def calculate_health_index(thyroid: str, pcos: str, iron: str) -> dict:
    risk_score = {"Low": 1, "Medium": 2, "High": 3}
    scores = [risk_score[thyroid], risk_score[pcos], risk_score[iron]]
    avg = sum(scores) / len(scores)
    if avg >= 2.5:   overall = "High Risk"
    elif avg >= 1.5: overall = "Moderate Risk"
    else:            overall = "Low Risk"
    return {"overall_risk": overall, "score": round(avg, 2)}