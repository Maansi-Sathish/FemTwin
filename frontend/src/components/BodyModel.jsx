"use client";
import { useState, useRef, useEffect, useMemo } from "react";

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
    cx: 200, cy: 132,
    rx: 26, ry: 12,
  },
  heart: {
    label: "Heart / Iron",
    icon: "🩸",
    location: "Center-left chest",
    function: "Pumps oxygenated blood throughout the body. Iron deficiency reduces hemoglobin, weakening oxygen transport.",
    symptoms: ["Fatigue", "Dizziness", "Pale Skin"],
    postpartum: "Postpartum anemia is common due to blood loss during delivery. Low iron causes exhaustion and slow recovery.",
    cx: 188, cy: 190,
    rx: 20, ry: 20,
  },
  uterus: {
    label: "Uterus / Ovaries (PCOS)",
    icon: "🌸",
    location: "Lower abdomen",
    function: "Reproductive organs that produce hormones and eggs. PCOS disrupts ovulation and causes hormonal imbalance.",
    symptoms: ["Irregular Periods", "Acne", "Weight Gain"],
    postpartum: "Post-delivery, the uterus undergoes involution. Hormonal shifts can trigger PCOS flares or new onset symptoms.",
    cx: 200, cy: 300,
    rx: 28, ry: 18,
  },
  brain: {
    label: "Brain / Mental Health",
    icon: "🧠",
    location: "Head",
    function: "Regulates mood, cognition, and hormonal signals via the hypothalamic-pituitary axis.",
    symptoms: ["Mood changes", "Anxiety", "Sleep issues"],
    postpartum: "Postpartum depression affects 1 in 7 women. Estrogen and progesterone drop sharply after birth, impacting serotonin levels.",
    cx: 200, cy: 62,
    rx: 30, ry: 26,
  },
  adrenal: {
    label: "Adrenal / Hormones",
    icon: "⚡",
    location: "Above kidneys",
    function: "Produces cortisol, adrenaline and sex hormones. Chronic stress dysregulates the entire hormonal cascade.",
    symptoms: ["Fatigue", "Hair Loss", "Weight Gain"],
    postpartum: "Postpartum hormonal crash — estrogen drops 1000x within 24hrs of birth, triggering mood swings and hair loss.",
    cx: 200, cy: 240,
    rx: 36, ry: 14,
  },
};

// Base colors for organs (used for smooth illustrated fills)
const baseOrgColors = {
  thyroid: '#ffb6d5',
  heart: '#ff9b9b',
  uterus: '#c4b5fd',
  brain: '#90cdf4',
  adrenal: '#fbd38d',
};

const POSTPARTUM_SYMPTOMS = [
  { key: "pp_depression", label: "Low Mood / Crying", icon: "💙", group: "postpartum" },
  { key: "pp_anxiety", label: "Anxiety / Panic", icon: "🌊", group: "postpartum" },
  { key: "pp_sleep", label: "Sleep Disruption", icon: "🌙", group: "postpartum" },
  { key: "pp_hair", label: "Postpartum Hair Loss", icon: "🌿", group: "postpartum" },
];

function OrganSVG({ result, postpartumResult, selectedKey, onSelect, cycle, symptoms, isPostpartum, ppSymptoms, getOrganColor, getOrganPercent }) {
  const ppRiskMap = postpartumResult || {};

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
      {/* Head with hair */}
      <g>
        <ellipse cx="200" cy="72" rx="38" ry="42" fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
        {/* Hair cap */}
        <path d="M160,60 C160,36 186,20 200,26 C214,20 240,36 240,60 C240,64 238,68 236,72 C228,82 210,86 200,86 C190,86 172,82 164,72 C162,68 160,64 160,60 Z"
          fill="rgba(67,56,202,0.16)" stroke="rgba(67,56,202,0.08)" strokeWidth="0.5" />
        {/* subtle hair strands */}
        <path d="M170,48 C178,58 190,60 200,60" stroke="rgba(67,56,202,0.12)" strokeWidth="1" fill="none" />
        <path d="M230,48 C222,58 210,60 200,60" stroke="rgba(67,56,202,0.12)" strokeWidth="1" fill="none" />
      </g>

      {/* Feminine torso: subtle bust, narrower waist, fuller hips (with subtle mass) */}
      <path d="M140,140
                C140,165 150,180 170,190
                C175,210 185,224 200,230
                C215,224 225,210 230,190
                C250,180 260,165 260,140
                C260,200 240,260 200,320
                C160,260 140,200 140,140 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />

      {/* breasts (soft ellipses) */}
      <ellipse cx="182" cy="202" rx="18" ry="10" fill="rgba(67,56,202,0.06)" />
      <ellipse cx="218" cy="202" rx="18" ry="10" fill="rgba(67,56,202,0.06)" />

      {/* Left arm (softer curve) */}
      <path d="M130,150
               C115,170 108,190 110,215
               C112,235 118,250 126,260
               C132,268 142,268 148,262
               C140,230 136,200 130,180 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />

      {/* Right arm (softer curve) */}
      <path d="M270,150
               C285,170 292,190 290,215
               C288,235 282,250 274,260
               C268,268 258,268 252,262
               C260,230 264,200 270,180 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />

      {/* Left leg (fuller hip tapering gracefully) */}
      <path d="M160,320
               C150,360 148,400 150,440
               C152,470 158,490 166,488
               C172,486 176,468 174,438
               C172,408 168,368 160,332 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />

      {/* Right leg (fuller hip tapering gracefully) */}
      <path d="M240,320
               C250,360 252,400 250,440
               C248,470 242,490 234,488
               C228,486 224,468 226,438
               C228,408 232,368 240,332 Z"
        fill="url(#bodyGrad)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />

      {/* ── Spine line ── */}
      <line x1="200" y1="138" x2="200" y2="355" stroke="rgba(129,140,248,0.2)" strokeWidth="1" strokeDasharray="4,4" />

      {/* ── Rib cage outline (slightly lower to match bust) ── */}
      <ellipse cx="200" cy="200" rx="54" ry="36" fill="none" stroke="rgba(129,140,248,0.15)" strokeWidth="1" strokeDasharray="3,3" />
      <ellipse cx="200" cy="218" rx="48" ry="30" fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="1" strokeDasharray="3,3" />

      {/* ── Organs ── */}
      {Object.entries(ORGANS).map(([key, organ]) => {
        const color = getOrganColor(key);
        const base = baseOrgColors[key] || '#e6e6ff';
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
              fill={hasResult ? base : "rgba(129,140,248,0.12)"}
              stroke={hasResult ? color : "rgba(129,140,248,0.3)"}
              strokeWidth={isSelected ? 2 : 1}
              filter={hasResult ? "url(#glow)" : "none"}
              opacity={isSelected ? 1 : 0.95}
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

            {/* Risk percent label (small) */}
            {hasResult && (
              <text
                x={organ.cx} y={organ.cy + organ.ry + 14}
                textAnchor="middle"
                fontSize={11}
                fill={color}
                style={{ userSelect: "none", pointerEvents: "none", fontWeight: 700 }}
              >
                {typeof getOrganPercent === 'function' ? `${getOrganPercent(key)}%` : ''}
              </text>
            )}
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

function OrganInfoPanel({ organKey, organ, riskLevel, accuracy, percent, onClose }) {
  const color = riskColors[riskLevel] || "#818cf8";
  return (
    <div style={{
      position: "absolute", top: 12, right: 12, zIndex: 20,
      background: "rgba(5,8,24,0.97)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${color}50`,
      borderRadius: 16,
      padding: "18px 20px",
      width: 260,
      boxShadow: `0 0 32px ${color}20`,
      fontFamily: "DM Sans, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>{organ.icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0eef8' }}>{organ.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(240,238,248,0.35)' }}>{percent}% risk</div>
          </div>
        </div>
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

export default function BodyModel({ result, postpartumResult, cycle, symptoms, isPostpartum, ppSymptoms, user }) {
  const [selectedKey, setSelectedKey] = useState(null);
  // Rotation state for 3D-like interaction
  const [rotation, setRotation] = useState(0); // degrees around Y
  const [tilt, setTilt] = useState(0); // small X tilt on hover/drag
  const dragging = useRef(false);
  const lastX = useRef(0);
  const containerRef = useRef(null);

  // Keyboard handlers for accessibility
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setRotation(r => r - 10);
      if (e.key === "ArrowRight") setRotation(r => r + 10);
      if (e.key === "Escape") { setSelectedKey(null); setRotation(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = (e) => {
    try {
      dragging.current = true;
      // cross-browser: prefer touch's first touch, otherwise clientX
      const x = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX || (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches[0] && e.nativeEvent.touches[0].clientX) || 0;
      lastX.current = x;
      // only try to setPointerCapture when available (pointer events)
      try {
        if (typeof e.pointerId !== 'undefined' && e.target && typeof e.target.setPointerCapture === 'function') {
          e.target.setPointerCapture(e.pointerId);
        }
      } catch (err) { /* ignore */ }
    } catch (err) {
      // defensive fallback
      dragging.current = false;
      lastX.current = 0;
    }
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    try {
      const x = (e.touches && e.touches[0] && e.touches[0].clientX) || e.clientX || (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches[0] && e.nativeEvent.touches[0].clientX) || 0;
      const dx = x - lastX.current;
      lastX.current = x;
      setRotation(r => Math.max(-60, Math.min(60, r + dx * 0.4)));
      setTilt((dx / 10));
    } catch (err) {
      // ignore move errors
    }
  };
  const onPointerUp = () => { dragging.current = false; setTilt(0); };
  const onWheel = (e) => { setRotation(r => Math.max(-60, Math.min(60, r + (e.deltaY > 0 ? 6 : -6)))); };

  const riskMap = result?.breakdown || {};
  const accuracyMap = result?.accuracy || {};

  // Allow postpartumResult shape returned by backend (e.g. 'depression' or 'mental_health_risk')
  const ppRisk = (postpartumResult) ? {
    depression: postpartumResult.depression ?? postpartumResult.mental_health_risk ?? postpartumResult.depression_risk ?? null,
    hormonal: postpartumResult.hormonal ?? postpartumResult.hormonal_risk ?? postpartumResult.thyroiditis_risk ?? null,
  } : {};

  // Phase-based emphasis (used when AI result isn't available to still reflect cycle influence)
  const phaseEmphasis = (() => {
    const phase = cycle?.current_phase;
    if (!phase) return {};
    switch (phase) {
      case "Menstrual": return { uterus: 1.0, heart: 0.6, thyroid: 0.5, adrenal: 0.6, brain: 0.5 };
      case "Follicular": return { thyroid: 0.9, brain: 0.8, uterus: 0.6, adrenal: 0.5, heart: 0.5 };
      case "Ovulation": return { uterus: 1.0, brain: 0.8, thyroid: 0.7, adrenal: 0.6, heart: 0.5 };
      case "Luteal": return { adrenal: 1.0, uterus: 0.9, brain: 0.6, thyroid: 0.5, heart: 0.6 };
      default: return {};
    }
  })();

  // Map level to numeric
  const levelToNum = (l) => (l === 'High' ? 3 : l === 'Medium' ? 2 : 1);
  const numToLevel = (n) => (n >= 2.6 ? 'High' : n >= 1.6 ? 'Medium' : 'Low');

  // Compute a combined organ risk using backend result + client-side symptom/cycle/user heuristics
  const computeLocalScores = (key) => {
    // symptoms available from parent; user and cycle context used too
    const s = symptoms || {};
    const c = cycle || {};
    const u = user || {};

    if (key === 'thyroid') {
      let score = 0;
      if (s.fatigue) score += 2;
      if (s.hair_loss) score += 2;
      if (s.weight_gain) score += 3;
      // postpartum and age influence
      if (isPostpartum) score += 1;
      if (u.age && u.age > 45) score += 1;
      return { raw: score, max: 8 };
    }
    if (key === 'heart') {
      let score = 0;
      if (s.fatigue) score += 2;
      if (s.dizziness) score += 2;
      if (s.pale_skin) score += 3;
      // heavy periods -> iron loss
      if (c.period_length && c.period_length >= 7) score += 1;
      return { raw: score, max: 8 };
    }
    if (key === 'uterus') {
      let score = 0;
      if (s.irregular_periods) score += 3;
      if (s.acne) score += 2;
      if (s.weight_gain) score += 2;
      // long cycle increases PCOS chance
      if (c.cycle_length && c.cycle_length >= 35) score += 2;
      return { raw: score, max: 9 };
    }
    if (key === 'brain') {
      let score = 0;
      if (isPostpartum && (ppSymptoms?.pp_depression || ppSymptoms?.pp_anxiety || ppSymptoms?.pp_sleep)) score += 3;
      if (s.fatigue) score += 1;
      if (s.irregular_periods) score += 1;
      return { raw: score, max: 6 };
    }
    if (key === 'adrenal') {
      let score = 0;
      if (s.fatigue) score += 2;
      if (s.hair_loss) score += 1;
      if (s.weight_gain) score += 1;
      // luteal/menstrual stress
      if (c.current_phase === 'Luteal' || c.current_phase === 'Menstrual') score += 1;
      return { raw: score, max: 6 };
    }
    return { raw: 0, max: 1 };
  };

  const getOrganRisk = (key) => {
    // backend level if present
    const backendLevel = (key === 'thyroid' && riskMap.thyroid) ? riskMap.thyroid
      : (key === 'heart' && riskMap.iron) ? riskMap.iron
      : (key === 'uterus' && riskMap.pcos) ? riskMap.pcos
      : (key === 'brain' && riskMap.depression) ? riskMap.depression
      : (key === 'adrenal' && riskMap.hormonal) ? riskMap.hormonal
      : null;

    const backendNum = backendLevel ? levelToNum(backendLevel) : null;

    const local = computeLocalScores(key);
    const localNorm = local.max ? (local.raw / local.max) * 3 : 0; // normalize to 0-3 scale

    // combine: prefer backend if available, but always include local evidence
    let combinedNum;
    if (backendNum) combinedNum = (backendNum * 0.7) + (localNorm * 0.3);
    else combinedNum = localNorm;

    const finalLevel = numToLevel(combinedNum);

    // accuracy: blend backend accuracy (if any) and local confidence
    const backendAcc = (key === 'thyroid' && accuracyMap.thyroid) ? accuracyMap.thyroid
      : (key === 'heart' && accuracyMap.iron) ? accuracyMap.iron
      : (key === 'uterus' && accuracyMap.pcos) ? accuracyMap.pcos
      : undefined;
    const localConf = Math.round((local.raw / (local.max || 1)) * 100);
    let accuracy = backendAcc !== undefined ? Math.round((backendAcc * 0.75) + (localConf * 0.25)) : localConf;

    return { level: finalLevel, accuracy };
  };

  const getOrganColor = (key) => {
    const r = getOrganRisk(key);
    return riskColors[r.level] || '#818cf8';
  };

  const getOrganAccuracy = (key) => {
    const r = getOrganRisk(key);
    return r.accuracy;
  };

  // Return numeric percent (0-100) for an organ by reproducing the same combine logic
  const getOrganPercent = (key) => {
    // backend level if present
    const backendLevel = (key === 'thyroid' && riskMap.thyroid) ? riskMap.thyroid
      : (key === 'heart' && riskMap.iron) ? riskMap.iron
      : (key === 'uterus' && riskMap.pcos) ? riskMap.pcos
      : (key === 'brain' && riskMap.depression) ? riskMap.depression
      : (key === 'adrenal' && riskMap.hormonal) ? riskMap.hormonal
      : null;

    const backendNum = backendLevel ? levelToNum(backendLevel) : null;
    const local = computeLocalScores(key);
    const localNorm = local.max ? (local.raw / local.max) * 3 : 0; // 0-3 scale

    let combinedNum;
    if (backendNum) combinedNum = (backendNum * 0.7) + (localNorm * 0.3);
    else combinedNum = localNorm;

    // Apply phase-based multiplier so current cycle influences percent
    const phaseVal = phaseEmphasis[key] ?? 0.75; // baseline 0.75 if not provided
    // map phaseVal around baseline to a gentle multiplier (±12.5%)
    const phaseMultiplier = 1 + ((phaseVal - 0.75) * 0.5);
    const adjusted = Math.max(0, Math.min(3, combinedNum * phaseMultiplier));

    const percent = Math.round((adjusted / 3) * 100);
    return Math.max(0, Math.min(100, percent));
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive body model"
        tabIndex={0}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onWheel={onWheel}
        style={{ width: "100%", height: "100%", maxWidth: 360, padding: "12px", perspective: 900 }}
      >
        <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 220ms ease", transform: `rotateY(${rotation}deg) rotateX(${tilt}deg)` }}>
          <OrganSVG
            result={result}
            postpartumResult={postpartumResult}
            cycle={cycle}
            symptoms={symptoms}
            isPostpartum={isPostpartum}
            ppSymptoms={ppSymptoms}
            selectedKey={selectedKey}
            onSelect={(key) => setSelectedKey(selectedKey === key ? null : key)}
            getOrganColor={getOrganColor}
            getOrganPercent={getOrganPercent}
          />
        </div>
      </div>

      {selectedKey && (
        <OrganInfoPanel
          organKey={selectedKey}
          organ={ORGANS[selectedKey]}
          riskLevel={getOrganRisk(selectedKey).level}
          accuracy={getOrganAccuracy(selectedKey)}
          percent={getOrganPercent(selectedKey)}
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