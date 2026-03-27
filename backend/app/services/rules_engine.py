def thyroid_risk(fatigue, hair_loss, weight_gain):
    score = 0
    if fatigue: score += 2
    if hair_loss: score += 2
    if weight_gain: score += 3

    if score >= 5:
        return "High"
    elif score >= 3:
        return "Medium"
    return "Low"


def pcos_risk(irregular_periods, acne, weight_gain):
    score = 0
    if irregular_periods: score += 3
    if acne: score += 2
    if weight_gain: score += 2

    if score >= 5:
        return "High"
    elif score >= 3:
        return "Medium"
    return "Low"


def iron_risk(fatigue, dizziness, pale_skin):
    score = 0
    if fatigue: score += 2
    if dizziness: score += 2
    if pale_skin: score += 3

    if score >= 5:
        return "High"
    elif score >= 3:
        return "Medium"
    return "Low"