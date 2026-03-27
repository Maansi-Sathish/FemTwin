import streamlit as st

st.title("FemTwin")

fatigue = st.checkbox("Fatigue")
hair_loss = st.checkbox("Hair Loss")
weight_gain = st.checkbox("Weight Gain")

import streamlit as st

from backend.rules.thyroid import thyroid_risk
from backend.rules.pcos import pcos_risk
from backend.rules.iron import iron_risk
from utils.health_index import calculate_health_index

st.title("FemTwin - Digital Female Health Twin")

st.header("Enter Symptoms")

# Common symptoms
fatigue = st.checkbox("Fatigue")
hair_loss = st.checkbox("Hair Loss")
weight_gain = st.checkbox("Weight Gain")

# PCOS
irregular_periods = st.checkbox("Irregular Periods")
acne = st.checkbox("Acne")

# Iron deficiency
dizziness = st.checkbox("Dizziness")
pale_skin = st.checkbox("Pale Skin")

if st.button("Analyze Health"):

    thyroid_result, t_score = thyroid_risk(fatigue, hair_loss, weight_gain)
    pcos_result, p_score = pcos_risk(irregular_periods, acne, weight_gain)
    iron_result, i_score = iron_risk(fatigue, dizziness, pale_skin)

    health_index = calculate_health_index(thyroid_result, pcos_result, iron_result)

    st.subheader("Results")

    st.write(f"Thyroid Risk: {thyroid_result}")
    st.write(f"PCOS Risk: {pcos_result}")
    st.write(f"Iron Deficiency Risk: {iron_result}")

    st.subheader("Overall Health Index")
    st.progress(int(health_index))

    st.subheader("Explanation")

    explanation = []

    if fatigue:
        explanation.append("Fatigue detected")
    if hair_loss:
        explanation.append("Hair loss detected")
    if irregular_periods:
        explanation.append("Irregular cycle detected")

    st.write(", ".join(explanation))

    st.warning("This is not a medical diagnosis. Consult a doctor.")