def iron_risk(fatigue, dizziness, pale_skin):
    score = 0

    if fatigue:
        score += 2
    if dizziness:
        score += 2
    if pale_skin:
        score += 3

    if score >= 5:
        return "High", score
    elif score >= 3:
        return "Medium", score
    else:
        return "Low", score