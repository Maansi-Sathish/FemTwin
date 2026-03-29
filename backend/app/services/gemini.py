import os
import json
import base64
from datetime import date, datetime, timedelta

from dotenv import load_dotenv
load_dotenv()

from google import genai

# Lazy Gemini client setup (do not call external API at import time)
_api_key = os.getenv("GEMINI_API_KEY")
_gemini_client = None

def _log(msg):
    print(f"[gemini_service] {msg}")

if not _api_key:
    _log("❌ GEMINI_API_KEY not found. Set GEMINI_API_KEY in backend/.env")
else:
    _log("✅ GEMINI_API_KEY found")


def get_gemini_client():
    """Return an initialized genai client or None if unavailable."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not _api_key:
        return None
    try:
        _gemini_client = genai.Client(api_key=_api_key)
        _log("🚀 Gemini client initialized")
        return _gemini_client
    except Exception as e:
        _log(f"❌ Gemini init error: {e}")
        _gemini_client = None
        return None


def gemini_generate(payload):
    """Wrapper to call Gemini safely. payload may be a string or list (for images + prompt).
    Returns the raw text response or raises an exception."""
    client = get_gemini_client()
    if not client:
        raise RuntimeError("Gemini client unavailable")

    try:
        response = client.models.generate_content(model="gemini-1.5-flash", contents=payload)
        # prefer response.text if present; otherwise try common response shapes
        text = getattr(response, "text", None)
        if not text:
            try:
                # genai responses sometimes include output -> list -> content -> text
                text = response.output[0].content[0].text
            except Exception:
                text = str(response)
        return text
    except Exception as e:
        raise


def calculate_cycle_context(last_period_date, cycle_length=28, period_length=5):
    try:
        try:
            last = datetime.strptime(last_period_date, "%Y-%m-%d").date()
        except Exception:
            last = datetime.fromisoformat(last_period_date).date()

        cycle_length  = max(21, min(45, int(cycle_length)  if cycle_length  else 28))
        period_length = max(2,  min(10, int(period_length) if period_length else 5))

        today = date.today()
        if last > today:
            return {"error": "Last period date is in the future."}

        days_since          = (today - last).days
        cycles_completed    = days_since // cycle_length
        current_cycle_start = last + timedelta(days=cycles_completed * cycle_length)
        day_of_cycle        = (today - current_cycle_start).days + 1

        ovulation_day_number = cycle_length - 14
        ovulation_date       = current_cycle_start + timedelta(days=ovulation_day_number - 1)
        next_period_start    = current_cycle_start + timedelta(days=cycle_length)
        days_until_next      = (next_period_start - today).days
        fertile_window_start = ovulation_date - timedelta(days=5)
        fertile_window_end   = ovulation_date + timedelta(days=1)

        if today == ovulation_date:
            fertility_status = "Peak Fertility"
        elif fertile_window_start <= today <= fertile_window_end:
            fertility_status = "High Fertility"
        elif (fertile_window_start - timedelta(days=3)) <= today <= (fertile_window_end + timedelta(days=3)):
            fertility_status = "Low Fertility"
        else:
            fertility_status = "Not Fertile"

        if day_of_cycle <= period_length:
            phase = "Menstrual"
        elif day_of_cycle < ovulation_day_number - 1:
            phase = "Follicular"
        elif ovulation_day_number - 1 <= day_of_cycle <= ovulation_day_number + 1:
            phase = "Ovulation"
        else:
            phase = "Luteal"

        tips = {"Menstrual":["Prioritise rest.","Use heat for cramps.","Eat iron-rich foods."],"Follicular":["Focus on protein and strength training.","Support with B-vitamins.","Establish consistent sleep."],"Ovulation":["Stay active and hydrate.","Balanced carbs for energy.","Listen to your body."],"Luteal":["Manage stress.","Reduce salt for bloating.","Prioritise sleep hygiene."]}
        symptoms_exp = {"Menstrual":["Cramps","Low energy","Mood dips"],"Follicular":["Increasing energy","Clearer skin","Stable mood"],"Ovulation":["High energy","Increased libido","Mild pelvic discomfort"],"Luteal":["Bloating","Irritability","Fatigue"]}
        energy_map = {"Menstrual":"Low","Follicular":"Building","Ovulation":"High","Luteal":"Declining"}
        mood_map   = {"Menstrual":"Tearful or low","Follicular":"Optimistic","Ovulation":"Confident","Luteal":"Irritable or moody"}

        return {
            "day_of_cycle": int(day_of_cycle), "cycle_length": int(cycle_length),
            "period_length": int(period_length), "phase": phase, "current_phase": phase,
            "fertility_status": fertility_status,
            "days_until_next_period": int(days_until_next),
            "next_period_date": next_period_start.isoformat(),
            "ovulation_date": ovulation_date.isoformat(),
            "fertile_window_start": fertile_window_start.isoformat(),
            "fertile_window_end": fertile_window_end.isoformat(),
            "ovulation_day": int(ovulation_day_number),
            "current_cycle_start": current_cycle_start.isoformat(),
            "phase_description": f"{phase}: expected hormonal and physical changes during this phase.",
            "phase_tips": tips.get(phase, []),
            "symptoms_to_expect": symptoms_exp.get(phase, []),
            "energy_level": energy_map.get(phase, "Building"),
            "mood_tendency": mood_map.get(phase, "Varies"),
        }
    except Exception as e:
        print(f"[Cycle calc error] {e}")
        return {"error": "Could not calculate cycle context."}


def fallback_analysis(symptoms, cycle_context=None, user_profile=None):
    from app.services.rules_engine import thyroid_risk, pcos_risk, iron_risk
    from app.utils.health_index import calculate_health_index

    thyroid, t_acc = thyroid_risk(symptoms.get("fatigue"), symptoms.get("hair_loss"), symptoms.get("weight_gain"), user_profile=user_profile, cycle=cycle_context)
    pcos,    p_acc = pcos_risk(symptoms.get("irregular_periods"), symptoms.get("acne"), symptoms.get("weight_gain"), user_profile=user_profile, cycle=cycle_context)
    iron,    i_acc = iron_risk(symptoms.get("fatigue"), symptoms.get("dizziness"), symptoms.get("pale_skin"), user_profile=user_profile, cycle=cycle_context)

    if symptoms.get("is_postpartum"):
        if thyroid == "Low": thyroid = "Medium"; t_acc = min(100, t_acc + 10)
        if iron    == "Low": iron    = "Medium"; i_acc = min(100, i_acc + 10)

    if cycle_context:
        if cycle_context.get("cycle_length", 28) >= 35:
            if pcos == "Low": pcos = "Medium"; p_acc = min(100, p_acc + 15)
        if cycle_context.get("phase") in ["Menstrual","Luteal"] and symptoms.get("irregular_periods"):
            if pcos == "Low": pcos = "Medium"; p_acc = min(100, p_acc + 10)

    result = calculate_health_index(thyroid, pcos, iron)
    result.update({
        "breakdown":   {"thyroid":thyroid,"pcos":pcos,"iron":iron,"depression":"Low","hormonal":"Low"},
        "accuracy":    {"thyroid":t_acc,"pcos":p_acc,"iron":i_acc,"depression":0,"hormonal":0},
        "reasoning":   {"thyroid":"Rule-based assessment.","pcos":"Rule-based assessment.","iron":"Rule-based assessment.","depression":"Gemini unavailable.","hormonal":"Gemini unavailable."},
        "recommendation": "Rule-based fallback. Check server logs for Gemini error details.",
        "urgent":      thyroid=="High" or pcos=="High" or iron=="High",
        "postpartum_analysis": None, "mood_response": None,
        "cycle_analysis": cycle_context or {}, "cross_system_insights": [],
    })
    return result


def analyze_symptoms_with_gemini(symptoms, user_profile):
    cycle_context = {}
    if user_profile.get("last_period_date"):
        cycle_context = calculate_cycle_context(
            user_profile["last_period_date"],
            user_profile.get("cycle_length", 28),
            user_profile.get("period_length", 5),
        )

    try:
        mood_text     = symptoms.get("mood_text", "") or ""
        is_postpartum = symptoms.get("is_postpartum", False)
        ca = cycle_context if (cycle_context and not cycle_context.get("error")) else {}

        cycle_section = f"""
CYCLE (adjust all risks based on this):
Phase={ca.get('phase')} Day={ca.get('day_of_cycle')}/{ca.get('cycle_length')} Fertility={ca.get('fertility_status')} NextPeriod={ca.get('days_until_next_period')}days Ovulation={ca.get('ovulation_date')}
""" if ca else ""

        pp_section = f"""
POSTPARTUM=YES B12={user_profile.get('vitamin_b12','?')} VitD={user_profile.get('vitamin_d','?')} Folate={user_profile.get('folate','?')}
Sx: depression={symptoms.get('pp_depression')} anxiety={symptoms.get('pp_anxiety')} sleep={symptoms.get('pp_sleep')} hair={symptoms.get('pp_hair')}
""" if is_postpartum else ""

        mood_section = f'Patient words: "{mood_text}"\n' if mood_text else ""

        prompt = f"""You are a women's health AI. Analyze all symptoms holistically. Return ONLY valid JSON, absolutely no markdown or code fences.

PATIENT: Age={user_profile.get('age','?')} BMI={round(user_profile['weight']/((user_profile['height']/100)**2),1) if user_profile.get('weight') and user_profile.get('height') else '?'}
VITALS: BP={user_profile.get('bp_systolic','?')}/{user_profile.get('bp_diastolic','?')} HR={user_profile.get('heart_rate','?')} O2={user_profile.get('oxygen_level','?')}%
LABS: Sugar={user_profile.get('blood_sugar','?')} Hgb={user_profile.get('hemoglobin','?')} Chol={user_profile.get('cholesterol_total','?')} B12={user_profile.get('vitamin_b12','?')} VitD={user_profile.get('vitamin_d','?')} Folate={user_profile.get('folate','?')}
SYMPTOMS: fatigue={symptoms.get('fatigue')} hair_loss={symptoms.get('hair_loss')} weight_gain={symptoms.get('weight_gain')} irregular_periods={symptoms.get('irregular_periods')} acne={symptoms.get('acne')} dizziness={symptoms.get('dizziness')} pale_skin={symptoms.get('pale_skin')}
{cycle_section}{pp_section}{mood_section}
Return this JSON with real analysis values:
{{"overall_risk":"Low Risk","score":1.0,"breakdown":{{"thyroid":"Low","pcos":"Low","iron":"Low","depression":"Low","hormonal":"Low","cardiovascular":"Low","nutritional":"Low"}},"accuracy":{{"thyroid":80,"pcos":80,"iron":80,"depression":80,"hormonal":80,"cardiovascular":80,"nutritional":80}},"reasoning":{{"thyroid":"specific reasoning","pcos":"specific reasoning","iron":"specific reasoning","depression":"specific reasoning","hormonal":"specific reasoning","cardiovascular":"specific reasoning","nutritional":"specific reasoning"}},"cross_system_insights":["insight 1","insight 2","insight 3"],"cycle_analysis":{{"phase":"{ca.get('phase','Unknown')}","current_phase":"{ca.get('phase','Unknown')}","day_of_cycle":{ca.get('day_of_cycle',0)},"cycle_length":{ca.get('cycle_length',28)},"period_length":{ca.get('period_length',5)},"fertility_status":"{ca.get('fertility_status','Unknown')}","days_until_next_period":{ca.get('days_until_next_period',0)},"next_period_date":"{ca.get('next_period_date','')}","ovulation_date":"{ca.get('ovulation_date','')}","fertile_window_start":"{ca.get('fertile_window_start','')}","fertile_window_end":"{ca.get('fertile_window_end','')}","phase_description":"{ca.get('phase_description','')}","phase_tips":{json.dumps(ca.get('phase_tips',[]))},"symptoms_to_expect":{json.dumps(ca.get('symptoms_to_expect',[]))},"energy_level":"{ca.get('energy_level','Building')}","mood_tendency":"{ca.get('mood_tendency','Varies')}","phase_impact_on_symptoms":"how cycle phase affects symptoms","pcos_cycle_correlation":"cycle and PCOS correlation"}},"postpartum_analysis":{json.dumps({"vitamin_b12_risk":"Low","vitamin_d_risk":"Low","folate_risk":"Low","iron_risk":"Low","thyroiditis_risk":"Low","mental_health_risk":"Low","postpartum_summary":"summary","postpartum_actions":["action 1","action 2","action 3"]}) if is_postpartum else "null"},"mood_response":{json.dumps({"emotion_detected":"emotion","validation":"sentence","consolation":"paragraph","practical_steps":["step 1","step 2","step 3"],"seek_help_urgently":False}) if mood_text else "null"},"recommendation":"Personalized 3-4 sentence recommendation","urgent":false}}"""

        print("[gemini_service] Calling Gemini API...")
        response = gemini_generate(prompt)
        text = response.strip()
        print(f"[gemini_service] ✅ Response received ({len(text)} chars)")

        if "```" in text:
            lines = [l for l in text.split("\n") if not l.strip().startswith("```")]
            text = "\n".join(lines).strip()

        result = json.loads(text)

        # Always overwrite cycle_analysis with authoritative server values
        if ca:
            result["cycle_analysis"] = {**result.get("cycle_analysis", {}), **ca, "current_phase": ca.get("phase")}

        return result

    except json.JSONDecodeError as e:
        print(f"[Gemini JSON parse error] {e}")
        return {"error": "Gemini JSON parse error", "details": str(e)}
    except Exception as e:
        print(f"[Gemini error] {type(e).__name__}: {e}")
        return {"error": "Gemini unavailable", "details": str(e)}


def extract_from_report(file_bytes, mime_type, user_profile=None):
    """Extract structured labs from an uploaded report (via Gemini) then interpret values
    to produce risk scores and recommendations. Returns a dict with either an error key
    or a structured interpretation including `breakdown`, `accuracy`, `reasoning`, and
    `recommendation`.
    """
    try:
        prompt = 'Extract all medical values. Return ONLY valid JSON no markdown: {"bp_systolic":null,"bp_diastolic":null,"blood_sugar":null,"cholesterol_total":null,"cholesterol_hdl":null,"cholesterol_ldl":null,"hemoglobin":null,"heart_rate":null,"oxygen_level":null,"vitamin_b12":null,"vitamin_d":null,"folate":null,"blood_type":null,"abnormal_values":[],"explanation":"summary","urgency":"normal","urgency_reason":"reason","action_items":["action"],"other_findings":null}'
        image_part = {"mime_type": mime_type, "data": base64.b64encode(file_bytes).decode("utf-8")}
        text = gemini_generate([prompt, image_part])
        text = text.strip()
        if "```" in text:
            lines = [l for l in text.split("\n") if not l.strip().startswith("```")]
            text = "\n".join(lines).strip()

        report = json.loads(text)

        # Normalize numeric values when possible
        def _num(v):
            try:
                if v is None: return None
                if isinstance(v, (int, float)): return float(v)
                s = str(v).strip()
                # strip units if present
                for ch in ['mg/dL','g/dL','ng/mL','pg/mL','%']:
                    s = s.replace(ch, '')
                s = s.replace(',', '').strip()
                return float(s)
            except Exception:
                return None

        hb = _num(report.get('hemoglobin'))
        b12 = _num(report.get('vitamin_b12'))
        vitd = _num(report.get('vitamin_d'))
        folate = _num(report.get('folate'))
        sugar = _num(report.get('blood_sugar'))
        chol = _num(report.get('cholesterol_total'))
        ldl = _num(report.get('cholesterol_ldl'))

        breakdown = {"thyroid":"Low","pcos":"Low","iron":"Low","depression":"Low","hormonal":"Low","cardiovascular":"Low","nutritional":"Low"}
        accuracy  = {k:50 for k in breakdown.keys()}  # conservative default
        reasoning  = {}
        recs = []

        # Iron / hemoglobin interpretation (women thresholds)
        if hb is not None:
            if hb < 10.0:
                breakdown['iron'] = 'High'; accuracy['iron'] = 95
                reasoning['iron'] = f'Hemoglobin low ({hb} g/dL) — consistent with moderate-severe anemia.'
                recs.append(f'Hemoglobin is {hb} g/dL — this suggests iron-deficiency anemia. Arrange serum ferritin and iron studies; consider oral iron supplementation and diet rich in heme iron after clinical review.')
            elif hb < 12.0:
                breakdown['iron'] = 'Medium'; accuracy['iron'] = 85
                reasoning['iron'] = f'Hemoglobin slightly low ({hb} g/dL) — possible mild anemia.'
                recs.append(f'Hemoglobin is {hb} g/dL — consider iron studies and dietary changes; follow up with primary care.')
            else:
                breakdown['iron'] = 'Low'; accuracy['iron'] = 80
                reasoning['iron'] = f'Hemoglobin within expected range ({hb} g/dL).'

        # Nutritional: B12, Vit D, Folate
        nut_reasons = []
        nut_score = 0
        if b12 is not None:
            if b12 < 200:
                nut_score += 2
                nut_reasons.append(f'Low B12 ({b12} pg/mL)')
                recs.append('Vitamin B12 is low — consider oral B12 supplementation and dietary changes; confirm with repeat testing and clinical correlation.')
            elif b12 < 300:
                nut_score += 1
                nut_reasons.append(f'Borderline B12 ({b12} pg/mL)')
        if vitd is not None:
            if vitd < 20:
                nut_score += 2
                nut_reasons.append(f'Deficient Vit D ({vitd} ng/mL)')
                recs.append('Vitamin D deficiency — start supplementation as per local guidelines and recheck in 8–12 weeks.')
            elif vitd < 30:
                nut_score += 1
                nut_reasons.append(f'Insufficient Vit D ({vitd} ng/mL)')
        if folate is not None:
            if folate < 3:
                nut_score += 2
                nut_reasons.append(f'Low folate ({folate} ng/mL)')
                recs.append('Low folate — consider supplementation and review dietary folate intake; particularly important in pregnancy/postpartum.')
            elif folate < 6:
                nut_score += 1
                nut_reasons.append(f'Borderline folate ({folate} ng/mL)')

        if nut_score >= 3:
            breakdown['nutritional'] = 'High'; accuracy['nutritional'] = 90
        elif nut_score == 2:
            breakdown['nutritional'] = 'Medium'; accuracy['nutritional'] = 85
        elif nut_score == 1:
            breakdown['nutritional'] = 'Medium'; accuracy['nutritional'] = 70
        else:
            breakdown['nutritional'] = 'Low'; accuracy['nutritional'] = 75
        if nut_reasons:
            reasoning['nutritional'] = '; '.join(nut_reasons)

        # Cardiovascular: cholesterol / LDL
        cardio_reasons = []
        if chol is not None:
            if chol >= 240 or (ldl is not None and ldl >= 160):
                breakdown['cardiovascular'] = 'High'; accuracy['cardiovascular'] = 90
                cardio_reasons.append(f'High cholesterol ({chol} mg/dL)')
                recs.append('Elevated cholesterol — lifestyle modification and lipid panel review; consider statin therapy assessment per guidelines.')
            elif chol >= 200 or (ldl is not None and ldl >= 130):
                breakdown['cardiovascular'] = 'Medium'; accuracy['cardiovascular'] = 80
                cardio_reasons.append(f'Borderline cholesterol ({chol} mg/dL)')
            else:
                breakdown['cardiovascular'] = 'Low'; accuracy['cardiovascular'] = 75
        if cardio_reasons:
            reasoning['cardiovascular'] = '; '.join(cardio_reasons)

        # Blood sugar
        if sugar is not None:
            if sugar >= 200:
                breakdown['cardiovascular'] = 'High'; accuracy['cardiovascular'] = max(accuracy.get('cardiovascular',0), 90)
                reasoning.setdefault('cardiovascular', '')
                reasoning['cardiovascular'] += f' Elevated blood sugar ({sugar}) suggesting hyperglycemia.'
                recs.append('Random blood sugar elevated — arrange fasting glucose/HbA1c to assess for diabetes.')
            elif sugar >= 126:
                breakdown['cardiovascular'] = 'Medium'; accuracy['cardiovascular'] = max(accuracy.get('cardiovascular',0), 85)
                reasoning.setdefault('cardiovascular', '')
                reasoning['cardiovascular'] += f' Raised blood sugar ({sugar}).'
                recs.append('Raised blood sugar — follow up with fasting glucose or HbA1c.')

        # Postpartum-specific notes
        postpartum_actions = None
        if user_profile and user_profile.get('is_postpartum'):
            postpartum_actions = []
            # if low B12 / folate / iron present, prioritise those
            if breakdown['nutritional'] in ['High','Medium'] or breakdown['iron'] in ['High','Medium']:
                postpartum_actions.append('Prioritise iron, B12 and folate correction while breastfeeding; consult your clinician before supplementation.')
            postpartum_actions.append('Watch for postpartum mood symptoms — screen and seek support if low mood or anxiety persist.')

        # Compose recommendation summary
        if recs:
            recommendation = ' '.join(recs[:6])
        else:
            recommendation = 'No major abnormalities detected on the uploaded report. Continue routine follow-up and discuss results with your clinician.'

        # Compute numeric risk percentages using conservative base rates per level
        base_map = {'Low': 25, 'Medium': 60, 'High': 90}
        risk_percentages = {}
        for k, level in breakdown.items():
            base = base_map.get(level, 25)
            conf = accuracy.get(k, 50)
            # Scale base by confidence to produce a final percentage
            pct = min(100, max(0, int(round(base * (conf / 100.0)))))
            risk_percentages[k] = pct

        # Per-condition detailed recommendations
        detailed_recommendations = []
        for k, level in breakdown.items():
            pct = risk_percentages.get(k, 0)
            conf = accuracy.get(k, 50)
            reason = reasoning.get(k, None) or ('No specific abnormality detected.' if level == 'Low' else 'Review clinically.')
            action = ''
            if k == 'iron':
                if level == 'High':
                    action = 'Arrange urgent iron studies (serum ferritin, TIBC), consider IV iron if symptomatic; start oral iron following clinician review.'
                elif level == 'Medium':
                    action = 'Order ferritin and iron studies; consider dietary iron and oral supplementation if ferritin low.'
                else:
                    action = 'Maintain iron-rich diet; recheck if symptomatic.'
            elif k == 'nutritional':
                if level == 'High':
                    action = 'Begin targeted supplementation (B12, Vit D, folate) per deficiencies; recheck levels after 8-12 weeks.'
                elif level == 'Medium':
                    action = 'Address diet and consider supplementation for borderline deficiencies; follow-up testing recommended.'
                else:
                    action = 'Continue routine nutrition and recheck as part of annual labs.'
            elif k == 'cardiovascular':
                if level == 'High':
                    action = 'Refer for lipid clinic assessment; initiate lifestyle changes and assess need for statin therapy per guidelines.'
                elif level == 'Medium':
                    action = 'Implement lifestyle modification and repeat lipid panel; assess for other risk factors (BP, glucose).' 
                else:
                    action = 'Continue routine cardiovascular prevention measures.'
            elif k == 'thyroid':
                action = 'If symptomatic, measure TSH and free T4/Free T3 and review with endocrinology if abnormal.'
            elif k == 'pcos':
                action = 'If suspected, evaluate cycle history, measure androgens, and consider pelvic ultrasound and endocrine review.'
            elif k == 'depression':
                action = 'Screen using PHQ-9/GAD-7 and refer for mental health support if positive.'
            elif k == 'hormonal':
                action = 'Review symptoms and consider targeted endocrine testing (sex hormones, cortisol) as indicated.'

            detailed_recommendations.append({
                'condition': k,
                'level': level,
                'risk_percent': pct,
                'confidence_percent': conf,
                'reasoning': reason,
                'action': action,
            })

        result = {
            'extracted_report': report,
            'breakdown': breakdown,
            'accuracy': accuracy,
            'reasoning': reasoning,
            'recommendation': recommendation,
            'postpartum_actions': postpartum_actions,
            'risk_percentages': risk_percentages,
            'detailed_recommendations': detailed_recommendations,
        }

        return result

    except Exception as e:
        print(f"[Report extraction error] {e}")
        return {"error": "Gemini report extraction failed", "details": str(e)}


def analyze_cycle(last_period_date, cycle_length, period_length):
    try:
        return calculate_cycle_context(last_period_date, cycle_length, period_length)
    except Exception as e:
        print(f"[Analyze cycle error] {e}")
        return {"error": "Could not analyze cycle."}