def pcos_risk(irregular_periods, acne, weight_gain):
    score = 0

    if irregular_periods:
        score += 3
    if acne:
        score += 2
    if weight_gain:
        score += 2

    if score >= 5:
        return "High", score
    elif score >= 3:
        return "Medium", score
    else:
        return "Low", score