from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.schema import HealthInput, HealthAnalysis, User
from app.services.gemini import analyze_symptoms_with_gemini, analyze_cycle
from app.auth.auth import get_current_user

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
        "cholesterol_hdl": current_user.cholesterol_hdl,
        "cholesterol_ldl": current_user.cholesterol_ldl,
        "hemoglobin": current_user.hemoglobin,
        "heart_rate": current_user.heart_rate,
        "oxygen_level": current_user.oxygen_level,
        "vitamin_b12": current_user.vitamin_b12,
        "vitamin_d": current_user.vitamin_d,
        "folate": current_user.folate,
        "last_period_date": current_user.last_period_date,
        "cycle_length": current_user.cycle_length or 28,
        "period_length": current_user.period_length or 5,
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

@router.get("/cycle")
def get_cycle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.last_period_date:
        return {"error": "No period data. Please update your profile with last period date."}
    return analyze_cycle(
        current_user.last_period_date,
        current_user.cycle_length or 28,
        current_user.period_length or 5,
    )