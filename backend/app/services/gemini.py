import os
import json
import base64
import google.generativeai as genai

genai.configure(api_key=os.getenv("Femtwin", "AIzaSyAocdR5IRy5Uz8FzFqKQI6XynPB924T2dA"))
model = genai.GenerativeModel("gemini-2.5-flash-lite")

def analyze_symptoms_with_gemini(symptoms: dict, user_profile: dict) -> dict:
    prompt = f"""
You are a women's health AI assistant. Analyze the following symptoms and health profile.
Return ONLY a valid JSON object with no extra text.

Patient Profile:
- Age: {user_profile.get('age', 'unknown')}
- Weight: {user_profile.get('weight', 'unknown')} kg
- Height: {user_profile.get('height', 'unknown')} cm
- Blood Type: {user_profile.get('blood_type', 'unknown')}
- BP: {user_profile.get('bp_systolic', '?')}/{user_profile.get('bp_diastolic', '?')} mmHg
- Blood Sugar: {user_profile.get('blood_sugar', 'unknown')} mg/dL
- Cholesterol: {user_profile.get('cholesterol_total', 'unknown')} mg/dL
- Hemoglobin: {user_profile.get('hemoglobin', 'unknown')} g/dL
- Is Postpartum: {symptoms.get('is_postpartum', False)}

Reported Symptoms:
- Fatigue: {symptoms.get('fatigue', False)}
- Hair Loss: {symptoms.get('hair_loss', False)}
- Weight Gain: {symptoms.get('weight_gain', False)}
- Irregular Periods: {symptoms.get('irregular_periods', False)}
- Acne: {symptoms.get('acne', False)}
- Dizziness: {symptoms.get('dizziness', False)}
- Pale Skin: {symptoms.get('pale_skin', False)}
- Low Mood/Depression: {symptoms.get('pp_depression', False)}
- Anxiety: {symptoms.get('pp_anxiety', False)}
- Sleep Issues: {symptoms.get('pp_sleep', False)}
- Postpartum Hair Loss: {symptoms.get('pp_hair', False)}

Analyze and return this exact JSON structure:
{{
  "overall_risk": "Low Risk" | "Moderate Risk" | "High Risk",
  "score": <float 1.0-3.0>,
  "breakdown": {{
    "thyroid": "Low" | "Medium" | "High",
    "pcos": "Low" | "Medium" | "High",
    "iron": "Low" | "Medium" | "High",
    "depression": "Low" | "Medium" | "High",
    "hormonal": "Low" | "Medium" | "High"
  }},
  "accuracy": {{
    "thyroid": <int 0-100>,
    "pcos": <int 0-100>,
    "iron": <int 0-100>,
    "depression": <int 0-100>,
    "hormonal": <int 0-100>
  }},
  "reasoning": {{
    "thyroid": "<one sentence clinical reasoning>",
    "pcos": "<one sentence clinical reasoning>",
    "iron": "<one sentence clinical reasoning>",
    "depression": "<one sentence clinical reasoning>",
    "hormonal": "<one sentence clinical reasoning>"
  }},
  "recommendation": "<2-3 sentence personalized recommendation based on profile>",
  "urgent": <true if any High risk detected, else false>
}}
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def extract_from_report(file_bytes: bytes, mime_type: str) -> dict:
    prompt = """
You are a medical report parser. Extract all health values from this report.
Return ONLY a valid JSON object with no extra text, no markdown.

Extract these fields if present (use null if not found):
{
  "bp_systolic": <integer or null>,
  "bp_diastolic": <integer or null>,
  "blood_sugar": <float or null>,
  "cholesterol_total": <float or null>,
  "cholesterol_hdl": <float or null>,
  "cholesterol_ldl": <float or null>,
  "hemoglobin": <float or null>,
  "blood_type": "<string or null>",
  "other_findings": "<any other important findings as a string>"
}
"""
    image_part = {
        "mime_type": mime_type,
        "data": base64.b64encode(file_bytes).decode("utf-8")
    }
    response = model.generate_content([prompt, image_part])
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())