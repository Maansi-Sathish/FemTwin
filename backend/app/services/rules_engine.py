def thyroid_risk(fatigue, hair_loss, weight_gain, user_profile=None, cycle=None):
    score = 0
    max_score = 7
    if fatigue: score += 2
    if hair_loss: score += 2
    if weight_gain: score += 3

    # Cycle confounders: during menstrual/luteal phases fatigue is common — reduce specificity
    phase = cycle.get('current_phase') if cycle else None
    accuracy = round((score / max_score) * 100)
    if phase in ('Menstrual', 'Luteal'):
        accuracy = max(0, accuracy - 10)
    else:
        accuracy = min(100, accuracy + 5)

    # Age/postpartum modifier (if provided in profile)
    if user_profile and user_profile.get('age') and user_profile['age'] > 50:
        # older age slightly increases chance of thyroid dysfunction
        accuracy = min(100, accuracy + 5)

    if score >= 5:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy


def pcos_risk(irregular_periods, acne, weight_gain, user_profile=None, cycle=None):
    score = 0
    max_score = 9
    if irregular_periods: score += 3
    if acne: score += 2
    if weight_gain: score += 2

    # Cycle-length influence: long cycles (>35) increase PCOS probability
    cycle_length = cycle.get('cycle_length') if cycle else None
    if cycle_length and cycle_length >= 35:
        score += 2

    # If current phase is Follicular or Ovulation but user reports irregular_periods, upweight
    phase = cycle.get('current_phase') if cycle else None
    if irregular_periods and phase in ('Follicular', 'Ovulation'):
        score += 1

    accuracy = round((score / max_score) * 100)

    # If cycle_length is absent but irregular_periods true — increase uncertainty slightly
    if not cycle_length and irregular_periods:
        accuracy = max(0, accuracy - 10)

    if score >= 6:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy


def iron_risk(fatigue, dizziness, pale_skin, user_profile=None, cycle=None):
    score = 0
    max_score = 9
    if fatigue: score += 2
    if dizziness: score += 2
    if pale_skin: score += 3

    # Use hemoglobin if available
    hb = user_profile.get('hemoglobin') if user_profile else None
    if hb is not None:
        try:
            hb_val = float(hb)
            if hb_val < 11.0:
                score += 3
            elif hb_val < 12.5:
                score += 1
        except Exception:
            pass

    # Heavy or prolonged periods increase iron loss
    period_length = cycle.get('period_length') if cycle else None
    if period_length and period_length >= 7:
        score += 2

    # If currently in Menstrual phase and day_of_cycle within bleeding days, upweight
    phase = cycle.get('current_phase') if cycle else None
    day = cycle.get('day_of_cycle') if cycle else None
    if phase == 'Menstrual' and day and period_length and day <= period_length:
        score += 1

    accuracy = round((score / max_score) * 100)

    if score >= 6:   return "High", accuracy
    elif score >= 3: return "Medium", accuracy
    return "Low", accuracy