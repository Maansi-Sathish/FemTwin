"use client";
import { useState } from "react";

const riskColors = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" };
const riskGlow = { High: "rgba(239,68,68,0.6)", Medium: "rgba(249,115,22,0.6)", Low: "rgba(34,197,94,0.6)" };

const ORGANS = {
  thyroid: {
    label: "Thyroid Gland",
    icon: "🦋",
    location: "Base of the neck",
    function: "Produces T3 and T4 hormones controlling metabolism, energy levels, heart function, and body temperature.",
    symptoms: ["Fatigue", "Hair Loss", "Weight Gain"],
    postpartum: "Postpartum thyroiditis affects 5–10% of women, causing thyroid inflammation within the first year after birth.",
    cx: 200, cy: 148,
    rx: 28, ry: 14,
  },
  heart: {
    label: "Heart / Iron",
    icon: "🩸",
    location: "Center-left chest",
    function: "Pumps oxygenated blood throughout the body. Iron deficiency reduces hemoglobin, weakening oxygen transport.",
    symptoms: ["Fatigue", "Dizziness", "Pale Skin"],
    postpartum: "Postpartum anemia is common due to blood loss during delivery. Low iron causes exhaustion and slow recovery.",
    cx: 188, cy: 195,
    rx: 22, ry: 22,
  },
  uterus: {
    label: "Uterus / Ovaries (PCOS)",
    icon: "🌸",
    location: "Lower abdomen",
    function: "Reproductive organs that produce hormones and eggs. PCOS disrupts ovulation and causes hormonal imbalance.",
    symptoms: ["Irregular Periods", "Acne", "Weight Gain"],
    postpartum: "Post-delivery, the uterus undergoes involution. Hormonal shifts can trigger PCOS flares or new onset symptoms.",
    cx: 200, cy: 285,
    rx: 30, ry: 20,
  },
  brain: {
    label: "Brain / Mental Health",
    icon: "🧠",
    location: "Head",
    function: "Regulates mood, cognition, and hormonal signals via the hypothalamic-pituitary axis.",
    symptoms: ["Mood changes", "Anxiety", "Sleep issues"],
    postpartum: "Postpartum depression affects 1 in 7 women. Estrogen and progesterone drop sharply after birth, impacting serotonin levels.",
    cx: 200, cy: 72,
    rx: 32, ry: 28,
  },
  adrenal: {
    label: "Adrenal / Hormones",
    icon: "⚡",
    location: "Above kidneys",
    function: "Produces cortisol, adrenaline and sex hormones. Chronic stress dysregulates the entire hormonal cascade.",
    symptoms: ["Fatigue", "Hair Loss", "Weight Gain"],
    postpartum: "Postpartum hormonal crash — estrogen drops 1000x within 24hrs of birth, triggering mood swings and hair loss.",
    cx: 200, cy: 240,
    rx: 38, ry: 16,
  },
};

const POSTPARTUM_SYMPTOMS = [
  { key: "pp_depression", label: "Low Mood / Crying", icon: "💙", group: "postpartum" },
  { key: "pp_anxiety", label: "Anxiety / Panic", icon: "🌊", group: "postpartum" },
  { key: "pp_sleep", label: "Sleep Disruption", icon: "🌙", group: "postpartum" },
  { key: "pp_hair", label: "Postpartum Hair Loss", icon: "🌿", group: "postpartum" },
];

function OrganSVG({ result, postpartumResult, selectedKey, onSelect }) {
  const riskMap = result?.breakdown || {};
  const ppRiskMap = postpartumResult || {};

  const getOrganColor = (key) => {
    if (key === "thyroid") return riskColors[riskMap.thyroid] || "#818cf8";
    if (key === "heart") return riskColors[riskMap.iron] || "#818cf8";
    if (key === "uterus") return riskColors[riskMap.pcos] || "#818cf8";
    if (key === "brain") return riskColors[ppRiskMap.depression] || "#818cf8";
    if (key === "adrenal") return riskColors[ppRiskMap.hormonal] || "#818cf8";
    return "#818cf8";
  };

  return (
    <svg viewBox="0 0 400 520" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 20px rgba(129,140,248,0.3))" }}>
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(129,140,248,0.15)" />
          <stop offset="100%" stopColor="rgba(67,56,202,0.05)" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {Object.entries(ORGANS).map(([key]) => (
          <radialGradient key={key} id={`grad-${key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={getOrganColor(key)} stopOpacity="0.9" />
            <stop offset="100%" stopColor={getOrganColor(key)} stopOpacity="0.2" />
          </radialGradient>
        ))}
      </defs>

      {/* ── Body silhouette ── */}
      {/* Head */}
      <ellipse cx="200" cy="72" rx="38" ry="42" fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="188" y="110" width="24" height="28" rx="8" fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
      {/* Torso */}
      <path d="M140,138 Q120,160 118,220 Q116,290 130,340 Q160,360 200,362 Q240,360 270,340 Q284,290 282,220 Q280,160 260,138 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
      {/* Left arm */}
      <path d="M140,145 Q110,160 98,200 Q90,230 95,265 Q100,278 110,275 Q118,272 120,258 Q115,225 125,195 Q132,170 148,158 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
      {/* Right arm */}
      <path d="M260,145 Q290,160 302,200 Q310,230 305,265 Q300,278 290,275 Q282,272 280,258 Q285,225 275,195 Q268,170 252,158 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
      {/* Left leg */}
      <path d="M150,355 Q140,380 138,420 Q136,460 142,490 Q150,500 162,498 Q172,496 174,482 Q170,445 172,410 Q174,378 172,358 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
      {/* Right leg */}
      <path d="M250,355 Q260,380 262,420 Q264,460 258,490 Q250,500 238,498 Q228,496 226,482 Q230,445 228,410 Q226,378 228,358 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />

      {/* ── Spine line ── */}
      <line x1="200" y1="138" x2="200" y2="355" stroke="rgba(129,140,248,0.2)" strokeWidth="1" strokeDasharray="4,4" />

      {/* ── Rib cage outline ── */}
      <ellipse cx="200" cy="210" rx="52" ry="38" fill="none" stroke="rgba(129,140,248,0.15)" strokeWidth="1" strokeDasharray="3,3" />
      <ellipse cx="200" cy="225" rx="48" ry="32" fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="1" strokeDasharray="3,3" />

      {/* ── Organs ── */}
      {Object.entries(ORGANS).map(([key, organ]) => {
        const color = getOrganColor(key);
        const isSelected = selectedKey === key;
        const hasResult = result || postpartumResult;

        return (
          <g key={key} onClick={() => onSelect(key)} style={{ cursor: "pointer" }}>
            {/* Glow pulse ring */}
            {hasResult && (
              <ellipse
                cx={organ.cx} cy={organ.cy}
                rx={organ.rx + (isSelected ? 12 : 6)}
                ry={organ.ry + (isSelected ? 8 : 4)}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isSelected ? 0.8 : 0.4}
                filter="url(#softglow)"
              />
            )}
            {/* Organ body */}
            <ellipse
              cx={organ.cx} cy={organ.cy}
              rx={organ.rx} ry={organ.ry}
              fill={hasResult ? `url(#grad-${key})` : "rgba(129,140,248,0.12)"}
              stroke={hasResult ? color : "rgba(129,140,248,0.3)"}
              strokeWidth={isSelected ? 2 : 1}
              filter={hasResult ? "url(#glow)" : "none"}
              opacity={isSelected ? 1 : 0.85}
            />
            {/* Organ icon */}
            <text
              x={organ.cx} y={organ.cy + 5}
              textAnchor="middle"
              fontSize={hasResult ? "14" : "11"}
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {organ.icon}
            </text>
          </g>
        );
      })}

      {/* ── Connecting lines (circulatory feel) ── */}
      <path d="M200,100 Q200,130 200,148" stroke="rgba(129,140,248,0.2)" strokeWidth="1" fill="none" />
      <path d="M200,162 Q200,178 188,195" stroke="rgba(129,140,248,0.2)" strokeWidth="1" fill="none" />
      <path d="M200,162 Q200,210 200,224" stroke="rgba(129,140,248,0.2)" strokeWidth="1" fill="none" />
      <path d="M200,256 Q200,268 200,265" stroke="rgba(129,140,248,0.2)" strokeWidth="1" fill="none" />
    </svg>
  );
}

function OrganInfoPanel({ organKey, organ, riskLevel, accuracy, onClose }) {
  const color = riskColors[riskLevel] || "#818cf8";
  return (
    <div style={{
      position: "absolute", top: 12, right: 12, zIndex: 20,
      background: "rgba(5,8,24,0.97)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${color}50`,
      borderRadius: 16,
      padding: "18px 20px",
      width: 240,
      boxShadow: `0 0 32px ${color}20`,
      fontFamily: "DM Sans, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{organ.icon}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>

      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, color: "#f0eef8", marginBottom: 3 }}>{organ.label}</div>
      <div style={{ fontSize: 10, color: "rgba(240,238,248,0.35)", marginBottom: 12 }}>📍 {organ.location}</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ background: `${color}20`, border: `1px solid ${color}50`, borderRadius: 100, padding: "3px 10px", fontSize: 11, color, fontWeight: 700 }}>
          {riskLevel} Risk
        </span>
        {accuracy !== undefined && (
          <span style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 100, padding: "3px 10px", fontSize: 11, color: "#818cf8", fontWeight: 700 }}>
            {accuracy}% confidence
          </span>
        )}
      </div>

      <div style={{ fontSize: 12, color: "rgba(240,238,248,0.55)", lineHeight: 1.65, marginBottom: 12 }}>{organ.function}</div>

      <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#c084fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>🤱 Postpartum</div>
        <div style={{ fontSize: 11, color: "rgba(240,238,248,0.5)", lineHeight: 1.6 }}>{organ.postpartum}</div>
      </div>

      <div style={{ fontSize: 10, color: "rgba(240,238,248,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tracked Symptoms</div>
      {organ.symptoms.map(s => (
        <div key={s} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color, fontSize: 7 }}>●</span> {s}
        </div>
      ))}
    </div>
  );
}

export default function BodyModel({ result, postpartumResult }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const riskMap = result?.breakdown || {};
  const accuracyMap = result?.accuracy || {};

  const getOrganRisk = (key) => {
    if (key === "thyroid") return riskMap.thyroid || "Low";
    if (key === "heart")   return riskMap.iron || "Low";
    if (key === "uterus")  return riskMap.pcos || "Low";
    if (key === "brain")   return postpartumResult?.depression || "Low";
    if (key === "adrenal") return postpartumResult?.hormonal || "Low";
    return "Low";
  };

  const getOrganAccuracy = (key) => {
    if (key === "thyroid") return accuracyMap.thyroid;
    if (key === "heart")   return accuracyMap.iron;
    if (key === "uterus")  return accuracyMap.pcos;
    return undefined;
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", height: "100%", maxWidth: 340, padding: "12px" }}>
        <OrganSVG
          result={result}
          postpartumResult={postpartumResult}
          selectedKey={selectedKey}
          onSelect={(key) => setSelectedKey(selectedKey === key ? null : key)}
        />
      </div>

      {selectedKey && (
        <OrganInfoPanel
          organKey={selectedKey}
          organ={ORGANS[selectedKey]}
          riskLevel={getOrganRisk(selectedKey)}
          accuracy={getOrganAccuracy(selectedKey)}
          onClose={() => setSelectedKey(null)}
        />
      )}

      {!selectedKey && (
        <div style={{
          position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
          fontSize: 10, color: "rgba(240,238,248,0.25)", letterSpacing: 1.5,
          textTransform: "uppercase", whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          Click an organ to explore
        </div>
      )}
    </div>
  );
}