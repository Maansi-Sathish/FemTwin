from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.schema import User, MedicalReport
from app.auth.auth import get_current_user
from app.services.gemini import extract_from_report

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
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and image files supported")

    file_bytes = await file.read()
    mime = ALLOWED_TYPES[file.content_type]

    if file.content_type == "application/pdf":
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc[0]
            pix = page.get_pixmap(dpi=200)
            file_bytes = pix.tobytes("png")
            mime = "image/png"
        except Exception:
            raise HTTPException(status_code=500, detail="Could not process PDF. Try uploading as image.")

    extracted = extract_from_report(file_bytes, mime)

    report = MedicalReport(
        user_id=current_user.id,
        filename=file.filename,
        extracted=extracted,
        explanation=extracted.get("explanation"),
    )
    db.add(report)

    # Auto-update all extractable fields
    fields = [
        "bp_systolic", "bp_diastolic", "blood_sugar",
        "cholesterol_total", "cholesterol_hdl", "cholesterol_ldl",
        "hemoglobin", "heart_rate", "oxygen_level",
        "vitamin_b12", "vitamin_d", "folate", "blood_type"
    ]
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
    return [
        {"id": r.id, "filename": r.filename, "extracted": r.extracted, "date": r.created_at}
        for r in reports
    ]