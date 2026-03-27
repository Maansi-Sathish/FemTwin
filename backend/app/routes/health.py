from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.schema import HealthInput, HealthAnalysis
from app.services.rules_engine import thyroid_risk, pcos_risk, iron_risk
from app.utils.health_index import calculate_health_index
from app.auth.auth import get_current_user
from app.models.schema import User

router = APIRouter()

@router.post("/analyze")
def analyze(data: HealthInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    thyroid, thyroid_acc = thyroid_risk(data.fatigue, data.hair_loss, data.weight_gain)
    pcos, pcos_acc       = pcos_risk(data.irregular_periods, data.acne, data.weight_gain)
    iron, iron_acc       = iron_risk(data.fatigue, data.dizziness, data.pale_skin)

    result = calculate_health_index(thyroid, pcos, iron)
    result["accuracy"] = {
        "thyroid": thyroid_acc,
        "pcos": pcos_acc,
        "iron": iron_acc,
    }
    result["breakdown"] = {
        "thyroid": thyroid,
        "pcos": pcos,
        "iron": iron,
    }

    # Save to DB
    analysis = HealthAnalysis(
        user_id=current_user.id,
        symptoms=data.dict(),
        results=result,
    )
    db.add(analysis)
    db.commit()

    return result

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analyses = db.query(HealthAnalysis).filter(
        HealthAnalysis.user_id == current_user.id
    ).order_by(HealthAnalysis.created_at.desc()).limit(10).all()
    return [
        {"id": a.id, "symptoms": a.symptoms, "results": a.results, "date": a.created_at}
        for a in analyses
    ]