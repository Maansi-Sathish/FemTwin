from pydantic import BaseModel

class HealthInput(BaseModel):
    fatigue: bool
    hair_loss: bool
    weight_gain: bool
    irregular_periods: bool
    acne: bool
    dizziness: bool
    pale_skin: bool