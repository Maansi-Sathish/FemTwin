from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.schema import HealthInput, HealthAnalysis, UserOut
from app.services.gemini import analyze_symptoms_with_gemini
from app.auth.auth import get_current_user
from app.models.schema import User

router = APIRouter()

@router.post("/analyze")
def analyze(
    data: HealthInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_profile = {
        "age": current_user.age,
        "weight": current_user.weight,
        "height": current_user.height,
        "blood_type": current_user.blood_type,
        "bp_systolic": current_user.bp_systolic,
        "bp_diastolic": current_user.bp_diastolic,
        "blood_sugar": current_user.blood_sugar,
        "cholesterol_total": current_user.cholesterol_total,
        "hemoglobin": current_user.hemoglobin,
    }

    result = analyze_symptoms_with_gemini(data.dict(), user_profile)

    analysis = HealthAnalysis(
        user_id=current_user.id,
        symptoms=data.dict(),
        results=result,
    )
    db.add(analysis)
    db.commit()
    return result

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analyses = db.query(HealthAnalysis).filter(
        HealthAnalysis.user_id == current_user.id
    ).order_by(HealthAnalysis.created_at.desc()).limit(10).all()
    return [
        {"id": a.id, "symptoms": a.symptoms, "results": a.results, "date": a.created_at}
        for a in analyses
    ]