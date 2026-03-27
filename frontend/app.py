import sys
import os

# Get project root (femtwin folder)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Add to Python path
if project_root not in sys.path:
    sys.path.append(project_root)
    
import streamlit as st

from backend.rules.thyroid import thyroid_risk
from backend.rules.pcos import pcos_risk
from backend.rules.iron import iron_risk
from utils.health_index import calculate_health_index

# 🖥️ UI TITLE
st.title("FemTwin - Digital Female Health Twin")

st.header("Enter Your Symptoms")

# 🧾 INPUT SECTION
fatigue = st.checkbox("Fatigue")
hair_loss = st.checkbox("Hair Loss")
weight_gain = st.checkbox("Weight Gain")

irregular_periods = st.checkbox("Irregular Periods")
acne = st.checkbox("Acne")

dizziness = st.checkbox("Dizziness")
pale_skin = st.checkbox("Pale Skin")

# 🚀 BUTTON ACTION
if st.button("Analyze Health"):

    # 🧠 BACKEND LOGIC (calling your rule engine)
    thyroid_result, t_score = thyroid_risk(fatigue, hair_loss, weight_gain)
    pcos_result, p_score = pcos_risk(irregular_periods, acne, weight_gain)
    iron_result, i_score = iron_risk(fatigue, dizziness, pale_skin)

    # 📊 HEALTH INDEX
    health_index = calculate_health_index(thyroid_result, pcos_result, iron_result)

    # 📢 OUTPUT
    st.subheader("Results")

    st.write(f"🧠 Thyroid Risk: {thyroid_result}")
    st.write(f"🧬 PCOS Risk: {pcos_result}")
    st.write(f"🩸 Iron Deficiency Risk: {iron_result}")

    # 📊 PROGRESS BAR
    st.subheader("Overall Health Index")
    st.progress(int(health_index))

    # 🧾 EXPLANATION
    st.subheader("Why this result?")

    explanation = []

    if fatigue:
        explanation.append("Fatigue observed")
    if hair_loss:
        explanation.append("Hair loss observed")
    if irregular_periods:
        explanation.append("Irregular cycle observed")
    if dizziness:
        explanation.append("Dizziness observed")

    if explanation:
        st.write(", ".join(explanation))
    else:
        st.write("No major symptoms detected")

    # ⚠️ DISCLAIMER
    st.warning("This is not a medical diagnosis. Consult a doctor.")