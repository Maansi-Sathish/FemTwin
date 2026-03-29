"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getMe, analyzeHealth, getHistory, logout } from "../services/api";
import LoginPage from "../components/LoginPage";
import ProfilePanel from "../components/ProfilePanel";
import HealthProfileSetup from "../components/HealthProfileSetup";

const BodyModel = dynamic(() => import("../components/BodyModel"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,238,248,0.4)", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "2px solid #c084fc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Loading 3D Model...</span>
    </div>
  ),
});

const SYMPTOMS = [
  { key: "fatigue",           label: "Fatigue",           icon: "⚡", desc: "Persistent tiredness or low energy" },
  { key: "hair_loss",         label: "Hair Loss",          icon: "🌿", desc: "Unusual shedding or thinning" },
  { key: "weight_gain",       label: "Weight Gain",        icon: "⚖️", desc: "Unexplained weight increase" },
  { key: "irregular_periods", label: "Irregular Periods",  icon: "🌙", desc: "Inconsistent menstrual cycles" },
  { key: "acne",              label: "Acne",               icon: "✦",  desc: "Hormonal breakouts or flare-ups" },
  { key: "dizziness",         label: "Dizziness",          icon: "◎",  desc: "Lightheadedness or vertigo" },
  { key: "pale_skin",         label: "Pale Skin",          icon: "○",  desc: "Unusual pallor or lack of color" },
];

const POSTPARTUM_SYMPTOMS = [
  { key: "pp_depression", label: "Low Mood / Crying",      icon: "💙", desc: "Persistent sadness or emotional numbness" },
  { key: "pp_anxiety",    label: "Anxiety / Panic",        icon: "🌊", desc: "Excessive worry or panic episodes" },
  { key: "pp_sleep",      label: "Sleep Issues",           icon: "🌙", desc: "Inability to sleep even when baby sleeps" },
  { key: "pp_hair",       label: "Postpartum Hair Loss",   icon: "🌿", desc: "Excessive shedding 2–4 months after birth" },
];

const riskMeta = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "High Risk", icon: "▲" },
  Medium: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "Moderate",  icon: "◆" },
  Low:    { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Healthy",   icon: "●" },
};

const defaultSymptoms = {
  fatigue: false, hair_loss: false, weight_gain: false,
  irregular_periods: false, acne: false, dizziness: false, pale_skin: false,
};
const defaultPpSymptoms = {
  pp_depression: false, pp_anxiety: false, pp_sleep: false, pp_hair: false,
};

export default function Home() {
  const [user, setUser]               = useState(null);
  const [authed, setAuthed]           = useState(false);
  const [checking, setChecking]       = useState(true);
  const [symptoms, setSymptoms]       = useState(defaultSymptoms);
  const [ppSymptoms, setPpSymptoms]   = useState(defaultPpSymptoms);
  const [isPostpartum, setIsPostpartum] = useState(false);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [step, setStep]               = useState("form");
  const [showProfile, setShowProfile] = useState(false);
  const [showSetup, setShowSetup]     = useState(false);
  const [history, setHistory]         = useState([]);

  useEffect(() => {
    getMe()
      .then(u => { setUser(u); setAuthed(true); })
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async () => {
    const u = await getMe();
    setUser(u);
    setAuthed(true);
    if (!u.profile_complete) setShowSetup(true);
    const h = await getHistory();
    setHistory(h);
  };

  const toggle   = (key) => setSymptoms(p => ({ ...p, [key]: !p[key] }));
  const togglePp = (key) => setPpSymptoms(p => ({ ...p, [key]: !p[key] }));

  const handleAnalyze = async () => {
    setLoading(true); setError(null);
    try {
      const payload = {
        ...symptoms,
        ...(isPostpartum ? ppSymptoms : {}),
        is_postpartum: isPostpartum,
      };
      const res = await analyzeHealth(payload);
      setResult(res);
      setStep("results");
      const h = await getHistory();
      setHistory(h);
    } catch (e) {
      setError("Could not connect to backend. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setStep("form");
    setSymptoms(defaultSymptoms); setPpSymptoms(defaultPpSymptoms);
    setIsPostpartum(false);
  };
  const handleLogout = () => { logout(); setAuthed(false); setUser(null); };

  const selectedCount = Object.values(symptoms).filter(Boolean).length
    + (isPostpartum ? Object.values(ppSymptoms).filter(Boolean).length : 0);

  const overallRisk = result
    ? ["High","Medium","Low"].find(r =>
        [result.breakdown?.thyroid, result.breakdown?.pcos,
         result.breakdown?.iron, result.breakdown?.depression,
         result.breakdown?.hormonal].includes(r)
      ) ?? "Low"
    : null;

  // ── Guards ──────────────────────────────────────────────────
  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", fontFamily: "Syne, sans-serif", fontSize: 15 }}>
      Loading...
    </div>
  );
  if (!authed) return <LoginPage onLogin={handleLogin} />;
  if (showSetup) return (
    <HealthProfileSetup
      user={user}
      onComplete={async () => {
        const u = await getMe();
        setUser(u);
        setShowSetup(false);
      }}
    />
  );

  // ── Main render ──────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#03050f; --bg2:#080d1e;
          --surface:rgba(255,255,255,0.04);
          --border:rgba(255,255,255,0.08);
          --border-hover:rgba(255,255,255,0.18);
          --text:#f0eef8; --muted:rgba(240,238,248,0.45);
          --accent:#c084fc; --accent2:#818cf8;
          --glow:rgba(192,132,252,0.18);
        }
        body { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .bg-orbs { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.25; }
        .orb-1 { width:500px; height:500px; background:#6d28d9; top:-150px; left:-100px; }
        .orb-2 { width:400px; height:400px; background:#1d4ed8; bottom:-100px; right:-100px; }
        .app { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; }
        header { padding:20px 48px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); backdrop-filter:blur(12px); position:sticky; top:0; z-index:50; background:rgba(3,5,15,0.8); }
        .logo { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; background:linear-gradient(135deg,#c084fc,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .logo-dot { color:#ef4444; -webkit-text-fill-color:#ef4444; }
        .header-right { display:flex; align-items:center; gap:12px; }
        .user-pill { display:flex; align-items:center; gap:8px; padding:6px 14px; background:var(--surface); border:1px solid var(--border); border-radius:100px; font-size:13px; color:var(--muted); }
        .user-pill strong { color:var(--text); }
        .btn-sm { padding:6px 14px; border-radius:100px; border:1px solid var(--border); background:none; color:var(--muted); font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .btn-sm:hover { border-color:var(--border-hover); color:var(--text); }
        main { flex:1; padding:40px 48px; max-width:1300px; margin:0 auto; width:100%; }
        .hero { margin-bottom:48px; animation:fadeIn 0.5s ease; }
        .hero-eyebrow { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--accent); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .hero-eyebrow::before { content:''; width:24px; height:1px; background:var(--accent); }
        .hero h1 { font-family:'Syne',sans-serif; font-size:clamp(32px,5vw,52px); font-weight:800; line-height:1.05; letter-spacing:-2px; margin-bottom:12px; }
        .hero h1 em { font-style:normal; color:var(--accent); }
        .hero p { font-size:15px; color:var(--muted); max-width:480px; line-height:1.7; font-weight:300; }
        .form-layout { display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start; }
        .section-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-bottom:18px; }
        .symptom-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
        .symptom-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:14px 16px; cursor:pointer; transition:all 0.2s; user-select:none; }
        .symptom-card:hover { border-color:var(--border-hover); background:rgba(255,255,255,0.07); }
        .symptom-card.active { border-color:var(--accent); background:var(--glow); }
        .symptom-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .symptom-icon { font-size:16px; }
        .symptom-check { width:16px; height:16px; border-radius:50%; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:9px; transition:all 0.2s; }
        .symptom-card.active .symptom-check { background:var(--accent); border-color:var(--accent); color:white; }
        .symptom-name { font-family:'Syne',sans-serif; font-size:12px; font-weight:600; margin-bottom:2px; }
        .symptom-desc { font-size:10px; color:var(--muted); line-height:1.4; }
        .analyze-section { display:flex; align-items:center; justify-content:space-between; padding-top:8px; }
        .symptom-count { font-size:13px; color:var(--muted); }
        .symptom-count span { color:var(--accent); font-weight:600; }
        .btn-analyze { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; padding:13px 32px; border-radius:100px; border:none; cursor:pointer; background:linear-gradient(135deg,#7c3aed,#4f46e5); color:white; box-shadow:0 0 32px rgba(124,58,237,0.4); transition:all 0.25s; }
        .btn-analyze:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 0 48px rgba(124,58,237,0.6); }
        .btn-analyze:disabled { opacity:0.5; cursor:not-allowed; }
        .info-panel { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:28px; }
        .info-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; margin-bottom:22px; color:var(--accent); }
        .info-item { display:flex; gap:12px; margin-bottom:16px; align-items:flex-start; }
        .info-num { font-family:'Syne',sans-serif; font-size:11px; font-weight:800; color:var(--accent); min-width:24px; margin-top:2px; }
        .info-text { font-size:13px; color:var(--muted); line-height:1.6; }
        .info-text strong { color:var(--text); font-weight:500; }
        .user-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid var(--border); }
        .stat-box { background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:10px; padding:10px 12px; text-align:center; }
        .stat-val { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--accent); }
        .stat-lbl { font-size:10px; color:var(--muted); letter-spacing:0.5px; }
        .health-metrics { margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .metric-box { background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:10px; padding:8px 12px; }
        .metric-val { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--text); }
        .metric-lbl { font-size:10px; color:var(--muted); }
        .error-msg { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:12px 16px; font-size:13px; color:#fca5a5; margin-bottom:20px; }
        .results-layout { display:grid; grid-template-columns:1fr 1.2fr; gap:32px; align-items:start; animation:fadeIn 0.4s ease; }
        .results-header { margin-bottom:28px; }
        .back-btn { background:none; border:1px solid var(--border); color:var(--muted); font-size:13px; font-family:'DM Sans',sans-serif; padding:7px 16px; border-radius:100px; cursor:pointer; transition:all 0.2s; margin-bottom:20px; display:inline-flex; align-items:center; gap:6px; }
        .back-btn:hover { border-color:var(--border-hover); color:var(--text); }
        .overall-badge { display:inline-flex; align-items:center; gap:10px; padding:8px 18px; border-radius:100px; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; margin-bottom:14px; }
        .results-title { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; letter-spacing:-1px; margin-bottom:6px; }
        .results-sub { font-size:13px; color:var(--muted); margin-bottom:4px; }
        .risk-cards { display:flex; flex-direction:column; gap:12px; margin-bottom:24px; }
        .risk-card { border-radius:16px; padding:16px 20px; display:flex; flex-direction:column; gap:10px; border:1px solid transparent; }
        .risk-card-top { display:flex; align-items:center; justify-content:space-between; }
        .risk-left { display:flex; align-items:center; gap:14px; }
        .risk-icon-wrap { width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .risk-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; margin-bottom:2px; }
        .risk-desc { font-size:11px; color:var(--muted); }
        .risk-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .risk-level { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; padding:5px 12px; border-radius:100px; }
        .risk-accuracy { font-size:11px; color:var(--muted); }
        .risk-reasoning { font-size:11px; color:rgba(240,238,248,0.4); line-height:1.6; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); }
        .model-panel { background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden; height:520px; position:relative; }
        .model-label { position:absolute; bottom:14px; left:50%; transform:translateX(-50%); font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); background:var(--bg2); padding:5px 12px; border-radius:100px; border:1px solid var(--border); white-space:nowrap; }
        .rec-box { border-radius:16px; padding:18px 22px; }
        .rec-title { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px; }
        .rec-text { font-size:13px; color:var(--muted); line-height:1.7; }
        .history-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); font-size:12px; }
        .history-row:last-child { border-bottom:none; }
        .pp-toggle { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:12px; cursor:pointer; transition:all 0.2s; margin-bottom:12px; }
        .pp-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; animation:fadeIn 0.3s ease; }
        @media(max-width:900px) {
          main { padding:24px; }
          header { padding:16px 24px; }
          .form-layout, .results-layout { grid-template-columns:1fr; }
          .symptom-grid, .pp-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>

      {showProfile && (
        <ProfilePanel user={user} onUpdate={u => setUser(u)} onClose={() => setShowProfile(false)} />
      )}

      <div className="app">
        <header>
          <div className="logo">Fem<span className="logo-dot">Twin</span></div>
          <div className="header-right">
            <div className="user-pill">👤 <strong>{user?.name}</strong></div>
            <button className="btn-sm" onClick={() => setShowSetup(true)}>📄 Upload Report</button>
            <button className="btn-sm" onClick={() => setShowProfile(true)}>⚙ Profile</button>
            <button className="btn-sm" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <main>
          {/* ── FORM STEP ── */}
          {step === "form" && (
            <>
              <div className="hero">
                <div className="hero-eyebrow">AI-Powered Health Analysis</div>
                <h1>Your body,<br /><em>understood</em> whole.</h1>
                <p>Select your symptoms. Gemini AI analyzes thyroid, hormonal, iron, and postpartum risk with clinical reasoning.</p>
              </div>

              {error && <div className="error-msg">⚠ {error}</div>}

              <div className="form-layout">
                {/* Left — symptoms */}
                <div>
                  <div className="section-label">Symptoms — Select all that apply</div>
                  <div className="symptom-grid">
                    {SYMPTOMS.map(s => (
                      <div
                        key={s.key}
                        className={`symptom-card ${symptoms[s.key] ? "active" : ""}`}
                        onClick={() => toggle(s.key)}
                      >
                        <div className="symptom-top">
                          <span className="symptom-icon">{s.icon}</span>
                          <div className="symptom-check">{symptoms[s.key] ? "✓" : ""}</div>
                        </div>
                        <div className="symptom-name">{s.label}</div>
                        <div className="symptom-desc">{s.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Postpartum toggle */}
                  <div
                    className="pp-toggle"
                    onClick={() => setIsPostpartum(p => !p)}
                    style={{
                      background: isPostpartum ? "rgba(192,132,252,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isPostpartum ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🤱</span>
                      <div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: isPostpartum ? "#c084fc" : "rgba(240,238,248,0.7)" }}>
                          Postpartum Tracking
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(240,238,248,0.35)" }}>Within 12 months of giving birth</div>
                      </div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: isPostpartum ? "#7c3aed" : "rgba(255,255,255,0.1)", position: "relative", transition: "all 0.2s" }}>
                      <div style={{ position: "absolute", top: 3, left: isPostpartum ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "all 0.2s" }} />
                    </div>
                  </div>

                  {isPostpartum && (
                    <div className="pp-grid">
                      {POSTPARTUM_SYMPTOMS.map(s => (
                        <div
                          key={s.key}
                          className={`symptom-card ${ppSymptoms[s.key] ? "active" : ""}`}
                          onClick={() => togglePp(s.key)}
                        >
                          <div className="symptom-top">
                            <span className="symptom-icon">{s.icon}</span>
                            <div className="symptom-check">{ppSymptoms[s.key] ? "✓" : ""}</div>
                          </div>
                          <div className="symptom-name">{s.label}</div>
                          <div className="symptom-desc">{s.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="analyze-section">
                    <div className="symptom-count">
                      <span>{selectedCount}</span> symptom{selectedCount !== 1 ? "s" : ""} selected
                    </div>
                    <button
                      className="btn-analyze"
                      onClick={handleAnalyze}
                      disabled={loading || selectedCount === 0}
                    >
                      {loading ? "⏳ Gemini Analyzing..." : "Analyze Health →"}
                    </button>
                  </div>
                </div>

                {/* Right — profile panel */}
                <div className="info-panel">
                  <div className="info-title">Your Health Profile</div>
                  <div className="info-item">
                    <div className="info-num">👤</div>
                    <div className="info-text"><strong>{user?.name}</strong> · {user?.email}</div>
                  </div>
                  {user?.age && (
                    <div className="info-item">
                      <div className="info-num">🎂</div>
                      <div className="info-text">Age: <strong>{user.age}</strong></div>
                    </div>
                  )}
                  {user?.blood_type && (
                    <div className="info-item">
                      <div className="info-num">🩸</div>
                      <div className="info-text">Blood Type: <strong>{user.blood_type}</strong></div>
                    </div>
                  )}

                  {/* Body stats */}
                  {(user?.weight || user?.height) && (
                    <div className="user-stats">
                      {user?.weight && <div className="stat-box"><div className="stat-val">{user.weight}</div><div className="stat-lbl">kg</div></div>}
                      {user?.height && <div className="stat-box"><div className="stat-val">{user.height}</div><div className="stat-lbl">cm</div></div>}
                      {user?.weight && user?.height && (
                        <div className="stat-box">
                          <div className="stat-val">{(user.weight / ((user.height / 100) ** 2)).toFixed(1)}</div>
                          <div className="stat-lbl">BMI</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Health metrics */}
                  {(user?.bp_systolic || user?.blood_sugar || user?.cholesterol_total || user?.hemoglobin) && (
                    <div className="health-metrics">
                      {user?.bp_systolic && user?.bp_diastolic && (
                        <div className="metric-box">
                          <div className="metric-val">{user.bp_systolic}/{user.bp_diastolic}</div>
                          <div className="metric-lbl">Blood Pressure</div>
                        </div>
                      )}
                      {user?.blood_sugar && (
                        <div className="metric-box">
                          <div className="metric-val">{user.blood_sugar}</div>
                          <div className="metric-lbl">Blood Sugar mg/dL</div>
                        </div>
                      )}
                      {user?.cholesterol_total && (
                        <div className="metric-box">
                          <div className="metric-val">{user.cholesterol_total}</div>
                          <div className="metric-lbl">Cholesterol mg/dL</div>
                        </div>
                      )}
                      {user?.hemoglobin && (
                        <div className="metric-box">
                          <div className="metric-val">{user.hemoglobin}</div>
                          <div className="metric-lbl">Hemoglobin g/dL</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent history */}
                  {history.length > 0 && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                      <div className="section-label" style={{ marginBottom: 10 }}>Recent Analyses</div>
                      {history.slice(0, 3).map(h => (
                        <div key={h.id} className="history-row">
                          <span style={{ color: "var(--muted)" }}>{new Date(h.date).toLocaleDateString()}</span>
                          <span style={{ color: riskMeta[h.results.overall_risk?.split(" ")[0]]?.color || "#818cf8", fontSize: 12 }}>
                            {h.results.overall_risk}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Complete profile nudge */}
                  {!user?.profile_complete && (
                    <div
                      onClick={() => setShowSetup(true)}
                      style={{ marginTop: 16, padding: "12px 14px", background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 12, cursor: "pointer", fontSize: 12, color: "#c084fc" }}
                    >
                      ⚡ Complete your health profile for better AI accuracy →
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── RESULTS STEP ── */}
          {step === "results" && result && (
            <>
              <div className="results-header">
                <button className="back-btn" onClick={handleReset}>← Run New Analysis</button>
                <div
                  className="overall-badge"
                  style={{
                    background: riskMeta[overallRisk]?.bg,
                    color: riskMeta[overallRisk]?.color,
                    border: `1px solid ${riskMeta[overallRisk]?.color}40`,
                  }}
                >
                  <span>{riskMeta[overallRisk]?.icon}</span> Overall: {riskMeta[overallRisk]?.label}
                  {result.urgent && <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(239,68,68,0.2)", padding: "2px 8px", borderRadius: 100 }}>⚠ Urgent</span>}
                </div>
                <div className="results-title">Health Analysis Complete</div>
                <div className="results-sub">
                  Based on {selectedCount} reported symptom{selectedCount !== 1 ? "s" : ""}
                  {result.score && ` · Risk Score: ${result.score}/3`}
                  {isPostpartum && " · Postpartum mode active 🤱"}
                </div>
              </div>

              <div className="results-layout">
                {/* Left — risk cards */}
                <div>
                  <div className="section-label" style={{ marginBottom: 14 }}>Risk Assessment · Powered by Gemini AI</div>
                  <div className="risk-cards">
                    {[
                      { key: "thyroid",    label: "Thyroid",       icon: "🦋", desc: "Hormonal & metabolic function" },
                      { key: "pcos",       label: "PCOS",          icon: "🌸", desc: "Reproductive & ovarian health" },
                      { key: "iron",       label: "Iron Levels",   icon: "🩸", desc: "Anemia & oxygen transport" },
                      { key: "depression", label: "Mental Health", icon: "🧠", desc: "Mood & postpartum wellness" },
                      { key: "hormonal",   label: "Hormonal",      icon: "⚡", desc: "Estrogen & adrenal balance" },
                    ].map(({ key, label, icon, desc }) => {
                      const level   = result.breakdown?.[key] || "Low";
                      const meta    = riskMeta[level] || riskMeta["Low"];
                      const acc     = result.accuracy?.[key];
                      const reason  = result.reasoning?.[key];
                      return (
                        <div
                          key={key}
                          className="risk-card"
                          style={{ background: meta.bg, borderColor: `${meta.color}30` }}
                        >
                          <div className="risk-card-top">
                            <div className="risk-left">
                              <div className="risk-icon-wrap" style={{ background: `${meta.color}20` }}>{icon}</div>
                              <div>
                                <div className="risk-name">{label}</div>
                                <div className="risk-desc">{desc}</div>
                              </div>
                            </div>
                            <div className="risk-right">
                              <div className="risk-level" style={{ background: `${meta.color}20`, color: meta.color }}>
                                {meta.icon} {level}
                              </div>
                              {acc !== undefined && (
                                <div className="risk-accuracy">{acc}% confidence</div>
                              )}
                            </div>
                          </div>
                          {reason && (
                            <div className="risk-reasoning">💡 {reason}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendation */}
                  <div
                    className="rec-box"
                    style={{
                      background: result.urgent
                        ? "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(220,38,38,0.08))"
                        : "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.1))",
                      border: `1px solid ${result.urgent ? "rgba(239,68,68,0.25)" : "rgba(124,58,237,0.25)"}`,
                    }}
                  >
                    <div className="rec-title" style={{ color: result.urgent ? "#ef4444" : "var(--accent)" }}>
                      {result.urgent ? "⚠️ Urgent Recommendation" : "✦ Recommendation"}
                    </div>
                    <div className="rec-text">
                      {result.recommendation || (
                        overallRisk === "High"
                          ? "Your results indicate elevated risk. We strongly recommend consulting a healthcare provider for further testing."
                          : overallRisk === "Medium"
                          ? "Moderate risk signals detected. Consider scheduling a check-up and monitoring symptoms over coming weeks."
                          : "Low risk across all domains. Continue monitoring your health and maintain regular check-ups."
                      )}
                    </div>
                  </div>
                </div>

                {/* Right — 3D body model */}
                <div className="model-panel">
                  <BodyModel
                    result={result}
                    postpartumResult={isPostpartum ? {
                      depression: (ppSymptoms.pp_depression || ppSymptoms.pp_anxiety || ppSymptoms.pp_sleep) ? result.breakdown?.depression || "Medium" : "Low",
                      hormonal: ppSymptoms.pp_hair ? result.breakdown?.hormonal || "Medium" : "Low",
                    } : null}
                  />
                  <div className="model-label">Click organs to explore · Powered by Gemini AI</div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}