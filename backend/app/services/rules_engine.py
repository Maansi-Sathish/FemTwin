def thyroid_risk(fatigue, hair_loss, weight_gain):
    score = 0
    max_score = 7
    if fatigue: score += 2
    if hair_loss: score += 2
    if weight_gain: score += 3
    accuracy = round((score / max_score) * 100)
    if score >= 5:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy

def pcos_risk(irregular_periods, acne, weight_gain):
    score = 0
    max_score = 7
    if irregular_periods: score += 3
    if acne: score += 2
    if weight_gain: score += 2
    accuracy = round((score / max_score) * 100)
    if score >= 5:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy

def iron_risk(fatigue, dizziness, pale_skin):
    score = 0
    max_score = 7
    if fatigue: score += 2
    if dizziness: score += 2
    if pale_skin: score += 3
    accuracy = round((score / max_score) * 100)
    if score >= 5:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy