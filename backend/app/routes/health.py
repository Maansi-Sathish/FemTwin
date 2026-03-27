from fastapi import APIRouter
from app.models.schema import HealthInput
from app.services.rules_engine import thyroid_risk, pcos_risk, iron_risk

router = APIRouter()

@router.post("/analyze")
def analyze(data: HealthInput):

    thyroid = thyroid_risk(data.fatigue, data.hair_loss, data.weight_gain)
    pcos = pcos_risk(data.irregular_periods, data.acne, data.weight_gain)
    iron = iron_risk(data.fatigue, data.dizziness, data.pale_skin)

    return {
        "thyroid": thyroid,
        "pcos": pcos,
        "iron": iron
    }