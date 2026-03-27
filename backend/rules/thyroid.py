def thyroid_risk(fatigue, hair_loss, weight_gain):
    score = 0
    
    if fatigue:
        score += 2
    if hair_loss:
        score += 2
    if weight_gain:
        score += 3

    if score >= 5:
        return "High", score
    elif score >= 3:
        return "Medium", score
    else:
        return "Low", score