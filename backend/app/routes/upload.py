from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.schema import User, MedicalReport
from app.auth.auth import get_current_user
from app.services.gemini import extract_from_report
import io

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": "application/pdf",
    "image/jpeg": "image/jpeg",
    "image/png": "image/png",
    "image/jpg": "image/jpeg",
}

@router.post("/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content_type = file.content_type
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and image files are supported")

    file_bytes = await file.read()
    mime = ALLOWED_TYPES[content_type]

    # PDFs: convert first page to image for Gemini
    if content_type == "application/pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc[0]
            pix = page.get_pixmap(dpi=200)
            file_bytes = pix.tobytes("png")
            mime = "image/png"
        except Exception:
            raise HTTPException(status_code=500, detail="Could not process PDF. Try uploading as an image.")

    extracted = extract_from_report(file_bytes, mime)

    # Save report record
    report = MedicalReport(
        user_id=current_user.id,
        filename=file.filename,
        extracted=extracted,
    )
    db.add(report)

    # Auto-update user profile with extracted values
    fields = ["bp_systolic", "bp_diastolic", "blood_sugar",
              "cholesterol_total", "cholesterol_hdl", "cholesterol_ldl",
              "hemoglobin", "blood_type"]
    for field in fields:
        val = extracted.get(field)
        if val is not None:
            setattr(current_user, field, val)

    db.commit()
    return {"extracted": extracted, "message": "Report processed and profile updated"}

@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == current_user.id
    ).order_by(MedicalReport.created_at.desc()).all()
    return [{"id": r.id, "filename": r.filename, "extracted": r.extracted, "date": r.created_at} for r in reports]