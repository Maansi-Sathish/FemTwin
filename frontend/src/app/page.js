"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getMe, analyzeHealth, getHistory, logout, getCycleAnalysis } from "../services/api";
import LoginPage from "../components/LoginPage";
import ProfilePanel from "../components/ProfilePanel";
import HealthProfileSetup from "../components/HealthProfileSetup";
import CycleTracker from "../components/CycleTracker";

const BodyModel = dynamic(() => import("../components/BodyModel"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,238,248,0.4)", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "2px solid #c084fc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Loading Model...</span>
    </div>
  ),
});

const SYMPTOMS = [
  { key: "fatigue",           label: "Fatigue",          icon: "⚡", desc: "Persistent tiredness or low energy" },
  { key: "hair_loss",         label: "Hair Loss",         icon: "🌿", desc: "Unusual shedding or thinning" },
  { key: "weight_gain",       label: "Weight Gain",       icon: "⚖️", desc: "Unexplained weight increase" },
  { key: "irregular_periods", label: "Irregular Periods", icon: "🌙", desc: "Inconsistent menstrual cycles" },
  { key: "acne",              label: "Acne",              icon: "✦",  desc: "Hormonal breakouts or flare-ups" },
  { key: "dizziness",         label: "Dizziness",         icon: "◎",  desc: "Lightheadedness or vertigo" },
  { key: "pale_skin",         label: "Pale Skin",         icon: "○",  desc: "Unusual pallor or lack of color" },
];

const POSTPARTUM_SYMPTOMS = [
  { key: "pp_depression", label: "Low Mood / Crying",    icon: "💙", desc: "Persistent sadness or numbness" },
  { key: "pp_anxiety",    label: "Anxiety / Panic",      icon: "🌊", desc: "Excessive worry or panic episodes" },
  { key: "pp_sleep",      label: "Sleep Issues",          icon: "🌙", desc: "Can't sleep even when baby sleeps" },
  { key: "pp_hair",       label: "Postpartum Hair Loss", icon: "🌿", desc: "Excessive shedding 2–4 months post-birth" },
];

const riskMeta = {
  High:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "High Risk", icon: "▲" },
  Medium: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "Moderate",  icon: "◆" },
  Low:    { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Healthy",   icon: "●" },
};

const phaseColors = {
  Menstrual:  { color: "#ef4444", icon: "🔴" },
  Follicular: { color: "#818cf8", icon: "🌱" },
  Ovulation:  { color: "#22c55e", icon: "✨" },
  Luteal:     { color: "#f97316", icon: "🌙" },
};

const defaultSymptoms = {
  fatigue: false, hair_loss: false, weight_gain: false,
  irregular_periods: false, acne: false, dizziness: false, pale_skin: false,
};
const defaultPp = {
  pp_depression: false, pp_anxiety: false, pp_sleep: false, pp_hair: false,
};

export default function Home() {
  const [user, setUser]               = useState(null);
  const [authed, setAuthed]           = useState(false);
  const [checking, setChecking]       = useState(true);
  const [symptoms, setSymptoms]       = useState(defaultSymptoms);
  const [ppSymptoms, setPpSymptoms]   = useState(defaultPp);
  const [isPostpartum, setIsPostpartum] = useState(false);
  const [moodText, setMoodText]       = useState("");
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [step, setStep]               = useState("form");
  const [showProfile, setShowProfile] = useState(false);
  const [showSetup, setShowSetup]     = useState(false);
  const [showCycle, setShowCycle]     = useState(false);
  const [history, setHistory]         = useState([]);
  const [storedCycle, setStoredCycle] = useState(null);

  useEffect(() => {
    getMe()
      .then(u => { setUser(u); setAuthed(true); })
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  // load cycle data when user is available
  useEffect(() => {
    const load = async () => {
      if (!user?.last_period_date) return;
      try {
        const c = await getCycleAnalysis();
        if (!c.error) setStoredCycle(c);
      } catch (e) { /* ignore */ }
    };
    load();
  }, [user]);

  const handleLogin = async () => {
    const u = await getMe();
    setUser(u);
    setAuthed(true);
    if (!u.profile_complete) setShowSetup(true);
    const h = await getHistory().catch(() => []);
    setHistory(h);
    try {
      if (u?.last_period_date) {
        const c = await getCycleAnalysis();
        if (!c.error) setStoredCycle(c);
      }
    } catch (e) { /* ignore */ }
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
        mood_text: moodText || null,
      };
      const res = await analyzeHealth(payload);
      setResult(res);
      setStep("results");
      const h = await getHistory().catch(() => []);
      setHistory(h);
      // Update stored cycle if backend provided cycle_analysis or /cycle endpoint changed
      try {
        if (res?.cycle_analysis) setStoredCycle(res.cycle_analysis);
        else if (user?.last_period_date) {
          const c = await getCycleAnalysis();
          if (!c.error) setStoredCycle(c);
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      setError("Could not connect to backend. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setStep("form");
    setSymptoms(defaultSymptoms); setPpSymptoms(defaultPp);
    setIsPostpartum(false); setMoodText("");
  };
  const handleLogout = () => { logout(); setAuthed(false); setUser(null); };

  const selectedCount = Object.values(symptoms).filter(Boolean).length
    + (isPostpartum ? Object.values(ppSymptoms).filter(Boolean).length : 0);

  const overallRisk = result
    ? ["High","Medium","Low"].find(r =>
        Object.values(result.breakdown || {}).includes(r)
      ) ?? "Low"
    : null;

  // Prefer cycle analysis returned by a recent analysis, fall back to stored cycle from /cycle
  const cycleFromResult = result?.cycle_analysis;
  const cycleData = cycleFromResult || storedCycle;
  const cyclePhase = cycleData?.phase || cycleData?.current_phase;
  const phaseStyle = cyclePhase ? phaseColors[cyclePhase] : null;

  // ── Guards ──────────────────────────────────────────────────
  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", fontFamily: "Syne, sans-serif" }}>
      Loading...
    </div>
  );
  if (!authed) return <LoginPage onLogin={handleLogin} />;
  if (showSetup) return (
    <HealthProfileSetup user={user} onComplete={async () => {
      const u = await getMe(); setUser(u); setShowSetup(false);
    }} />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
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
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .bg-orbs{position:fixed;inset:0;pointer-events:none;z-index:0;}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.25;}
        .orb-1{width:500px;height:500px;background:#6d28d9;top:-150px;left:-100px;}
        .orb-2{width:400px;height:400px;background:#1d4ed8;bottom:-100px;right:-100px;}
        .app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;}
        header{padding:18px 48px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);backdrop-filter:blur(12px);position:sticky;top:0;z-index:50;background:rgba(3,5,15,0.85);}
        .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;background:linear-gradient(135deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .logo-dot{color:#ef4444;-webkit-text-fill-color:#ef4444;}
        .header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .user-pill{display:flex;align-items:center;gap:8px;padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:12px;color:var(--muted);}
        .user-pill strong{color:var(--text);}
        .btn-sm{padding:5px 12px;border-radius:100px;border:1px solid var(--border);background:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;white-space:nowrap;}
        .btn-sm:hover{border-color:var(--border-hover);color:var(--text);}
        main{flex:1;padding:36px 48px;max-width:1400px;margin:0 auto;width:100%;}
        .hero{margin-bottom:40px;animation:fadeIn 0.5s ease;}
        .hero-eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
        .hero-eyebrow::before{content:'';width:24px;height:1px;background:var(--accent);}
        .hero h1{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:10px;}
        .hero h1 em{font-style:normal;color:var(--accent);}
        .hero p{font-size:14px;color:var(--muted);max-width:500px;line-height:1.7;font-weight:300;}
        .form-layout{display:grid;grid-template-columns:1.2fr 1fr;gap:28px;align-items:start;}
        .section-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:14px;}
        .symptom-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:16px;}
        .symptom-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.2s;user-select:none;}
        .symptom-card:hover{border-color:var(--border-hover);background:rgba(255,255,255,0.07);}
        .symptom-card.active{border-color:var(--accent);background:var(--glow);}
        .symptom-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
        .symptom-icon{font-size:15px;}
        .symptom-check{width:15px;height:15px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:8px;transition:all 0.2s;}
        .symptom-card.active .symptom-check{background:var(--accent);border-color:var(--accent);color:white;}
        .symptom-name{font-family:'Syne',sans-serif;font-size:11px;font-weight:600;margin-bottom:2px;}
        .symptom-desc{font-size:10px;color:var(--muted);line-height:1.4;}
        .analyze-section{display:flex;align-items:center;justify-content:space-between;padding-top:6px;}
        .symptom-count{font-size:12px;color:var(--muted);}
        .symptom-count span{color:var(--accent);font-weight:600;}
        .btn-analyze{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;padding:12px 28px;border-radius:100px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;box-shadow:0 0 28px rgba(124,58,237,0.4);transition:all 0.25s;}
        .btn-analyze:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 44px rgba(124,58,237,0.6);}
        .btn-analyze:disabled{opacity:0.5;cursor:not-allowed;}
        .info-panel{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:24px;}
        .info-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:18px;color:var(--accent);}
        .info-item{display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;}
        .info-num{font-size:11px;font-weight:800;color:var(--accent);min-width:20px;margin-top:1px;}
        .info-text{font-size:12px;color:var(--muted);line-height:1.6;}
        .info-text strong{color:var(--text);font-weight:500;}
        .user-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);}
        .stat-box{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:9px;padding:8px 10px;text-align:center;}
        .stat-val{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--accent);}
        .stat-lbl{font-size:9px;color:var(--muted);}
        .health-metrics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px;}
        .metric-box{background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:9px;padding:7px 10px;}
        .metric-val{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);}
        .metric-lbl{font-size:9px;color:var(--muted);}
        .error-msg{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:10px 14px;font-size:12px;color:#fca5a5;margin-bottom:16px;}
        .results-layout{display:grid;grid-template-columns:1fr 1.1fr;gap:28px;align-items:start;animation:fadeIn 0.4s ease;}
        .results-header{margin-bottom:24px;}
        .back-btn{background:none;border:1px solid var(--border);color:var(--muted);font-size:12px;font-family:'DM Sans',sans-serif;padding:6px 14px;border-radius:100px;cursor:pointer;transition:all 0.2s;margin-bottom:16px;display:inline-flex;align-items:center;gap:6px;}
        .back-btn:hover{border-color:var(--border-hover);color:var(--text);}
        .overall-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:100px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;margin-bottom:12px;}
        .results-title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-1px;margin-bottom:5px;}
        .results-sub{font-size:12px;color:var(--muted);}
        .risk-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;}
        .risk-card{border-radius:14px;padding:14px 18px;display:flex;flex-direction:column;gap:8px;border:1px solid transparent;}
        .risk-card-top{display:flex;align-items:center;justify-content:space-between;}
        .risk-left{display:flex;align-items:center;gap:12px;}
        .risk-icon-wrap{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;}
        .risk-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:1px;}
        .risk-desc{font-size:10px;color:var(--muted);}
        .risk-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px;}
        .risk-level{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;}
        .risk-accuracy{font-size:10px;color:var(--muted);}
        .risk-reasoning{font-size:11px;color:rgba(240,238,248,0.4);line-height:1.6;padding-top:7px;border-top:1px solid rgba(255,255,255,0.06);}
        .model-panel{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;height:500px;position:relative;}
        .model-label{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);background:var(--bg2);padding:4px 10px;border-radius:100px;border:1px solid var(--border);white-space:nowrap;}
        .rec-box{border-radius:14px;padding:16px 20px;}
        .rec-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px;}
        .rec-text{font-size:12px;color:var(--muted);line-height:1.7;}
        .history-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:11px;}
        .history-row:last-child{border-bottom:none;}
        .pp-toggle{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:11px;cursor:pointer;transition:all 0.2s;margin-bottom:10px;}
        .pp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;animation:fadeIn 0.3s ease;}
        .cycle-banner{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:11px;margin-bottom:14px;cursor:pointer;transition:all 0.2s;}
        .cycle-banner:hover{opacity:0.85;}
        .insight-box{background:rgba(129,140,248,0.06);border:1px solid rgba(129,140,248,0.15);border-radius:12px;padding:14px 18px;margin-bottom:12px;}
        @media(max-width:1000px){main{padding:24px;}.form-layout,.results-layout{grid-template-columns:1fr;}.symptom-grid,.pp-grid{grid-template-columns:1fr;}}
      `}</style>

      <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>

      {showProfile && <ProfilePanel user={user} onUpdate={u => setUser(u)} onClose={() => setShowProfile(false)} />}
      {showCycle && <CycleTracker user={user} onClose={() => setShowCycle(false)} />}

      <div className="app">
        <header>
          <div className="logo">Fem<span className="logo-dot">Twin</span></div>
          <div className="header-right">
            {user?.last_period_date && (
              <div className="user-pill">
                {phaseStyle?.icon || "🌙"} <strong style={{ color: phaseStyle?.color || "#c084fc" }}>
                  {cyclePhase || "Track Cycle"}
                </strong>
              </div>
            )}
            <button className="btn-sm" onClick={() => setShowCycle(true)}>🌙 Cycle</button>
            <button className="btn-sm" onClick={() => setShowSetup(true)}>📄 Upload Report</button>
            <button className="btn-sm" onClick={() => setShowProfile(true)}>⚙ Profile</button>
            <div className="user-pill">👤 <strong>{user?.name}</strong></div>
            <button className="btn-sm" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <main>
          {/* ── FORM ── */}
          {step === "form" && (
            <>
              <div className="hero">
                <div className="hero-eyebrow">Holistic AI Health Analysis</div>
                <h1>Your body,<br /><em>understood</em> whole.</h1>
                <p>Every symptom, lab value, and cycle phase cross-references with every other — your body treated as one system.</p>
              </div>

              {/* Cycle phase banner */}
              {user?.last_period_date && (
                <div
                  className="cycle-banner"
                  onClick={() => setShowCycle(true)}
                  style={{
                    background: phaseStyle ? `${phaseStyle.color}12` : "rgba(192,132,252,0.08)",
                    border: `1px solid ${phaseStyle?.color || "#c084fc"}30`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{phaseStyle?.icon || "🌙"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: phaseStyle?.color || "#c084fc" }}>
                      {cyclePhase ? `Currently in ${cyclePhase} Phase` : "Cycle data loaded"} · This will factor into your analysis
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(240,238,248,0.35)" }}>
                      Symptoms like fatigue or mood in the Luteal phase are adjusted for PMS context
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(240,238,248,0.3)" }}>View →</span>
                </div>
              )}

              {error && <div className="error-msg">⚠ {error}</div>}

              <div className="form-layout">
                <div>
                  <div className="section-label">Symptoms — Select all that apply</div>
                  <div className="symptom-grid">
                    {SYMPTOMS.map(s => (
                      <div key={s.key} className={`symptom-card ${symptoms[s.key] ? "active" : ""}`} onClick={() => toggle(s.key)}>
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
                      <span style={{ fontSize: 16 }}>🤱</span>
                      <div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: isPostpartum ? "#c084fc" : "rgba(240,238,248,0.7)" }}>Postpartum Tracking</div>
                        <div style={{ fontSize: 10, color: "rgba(240,238,248,0.35)" }}>Within 12 months of giving birth · B12, D, Folate, Iron analysed</div>
                      </div>
                    </div>
                    <div style={{ width: 34, height: 18, borderRadius: 9, background: isPostpartum ? "#7c3aed" : "rgba(255,255,255,0.1)", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: isPostpartum ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "all 0.2s" }} />
                    </div>
                  </div>

                  {isPostpartum && (
                    <div className="pp-grid">
                      {POSTPARTUM_SYMPTOMS.map(s => (
                        <div key={s.key} className={`symptom-card ${ppSymptoms[s.key] ? "active" : ""}`} onClick={() => togglePp(s.key)}>
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

                  {/* Mood text */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                      💬 How are you feeling? <span style={{ color: "rgba(240,238,248,0.25)" }}>(optional — AI responds personally)</span>
                    </label>
                    <textarea
                      value={moodText}
                      onChange={e => setMoodText(e.target.value)}
                      placeholder="e.g. I've been exhausted and anxious, I don't feel like myself lately..."
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f0eef8", fontSize: 12, fontFamily: "DM Sans, sans-serif", outline: "none", resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>

                  <div className="analyze-section">
                    <div className="symptom-count"><span>{selectedCount}</span> symptom{selectedCount !== 1 ? "s" : ""} selected</div>
                    <button className="btn-analyze" onClick={handleAnalyze} disabled={loading || selectedCount === 0}>
                      {loading ? "⏳ Analysing holistically..." : "Analyse My Body →"}
                    </button>
                  </div>
                </div>

                {/* Right panel */}
                <div className="info-panel">
                  <div className="info-title">Your Health Profile</div>
                  <div className="info-item"><div className="info-num">👤</div><div className="info-text"><strong>{user?.name}</strong> · {user?.email}</div></div>
                  {user?.age && <div className="info-item"><div className="info-num">🎂</div><div className="info-text">Age: <strong>{user.age}</strong></div></div>}
                  {user?.blood_type && <div className="info-item"><div className="info-num">🩸</div><div className="info-text">Blood Type: <strong>{user.blood_type}</strong></div></div>}

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

                  {(user?.bp_systolic || user?.blood_sugar || user?.heart_rate || user?.oxygen_level || user?.hemoglobin || user?.vitamin_b12) && (
                    <div className="health-metrics">
                      {user?.bp_systolic && <div className="metric-box"><div className="metric-val">{user.bp_systolic}/{user.bp_diastolic}</div><div className="metric-lbl">Blood Pressure</div></div>}
                      {user?.blood_sugar && <div className="metric-box"><div className="metric-val">{user.blood_sugar}</div><div className="metric-lbl">Sugar mg/dL</div></div>}
                      {user?.heart_rate && <div className="metric-box"><div className="metric-val">{user.heart_rate}</div><div className="metric-lbl">Heart Rate bpm</div></div>}
                      {user?.oxygen_level && <div className="metric-box"><div className="metric-val">{user.oxygen_level}%</div><div className="metric-lbl">Oxygen</div></div>}
                      {user?.hemoglobin && <div className="metric-box"><div className="metric-val">{user.hemoglobin}</div><div className="metric-lbl">Hemoglobin g/dL</div></div>}
                      {user?.vitamin_b12 && <div className="metric-box"><div className="metric-val">{user.vitamin_b12}</div><div className="metric-lbl">B12 pg/mL</div></div>}
                      {user?.vitamin_d && <div className="metric-box"><div className="metric-val">{user.vitamin_d}</div><div className="metric-lbl">Vit D ng/mL</div></div>}
                      {user?.folate && <div className="metric-box"><div className="metric-val">{user.folate}</div><div className="metric-lbl">Folate ng/mL</div></div>}
                    </div>
                  )}

                  {user?.last_period_date && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.15)", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "#c084fc", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>🌙 Cycle Info</div>
                      <div style={{ fontSize: 11, color: "rgba(240,238,248,0.5)" }}>Last period: {new Date(user.last_period_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                      <div style={{ fontSize: 11, color: "rgba(240,238,248,0.5)" }}>Cycle: {user.cycle_length || 28} days · Period: {user.period_length || 5} days</div>
                    </div>
                  )}

                  {history.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>Recent Analyses</div>
                      {history.slice(0, 3).map(h => (
                        <div key={h.id} className="history-row">
                          <span style={{ color: "var(--muted)" }}>{new Date(h.date).toLocaleDateString()}</span>
                          <span style={{ color: riskMeta[h.results?.overall_risk?.split(" ")[0]]?.color || "#818cf8", fontSize: 11 }}>
                            {h.results?.overall_risk}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!user?.profile_complete && (
                    <div onClick={() => setShowSetup(true)} style={{ marginTop: 12, padding: "10px 12px", background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.18)", borderRadius: 10, cursor: "pointer", fontSize: 11, color: "#c084fc" }}>
                      ⚡ Complete health profile for better AI accuracy →
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── RESULTS ── */}
          {step === "results" && result && (
            <>
              <div className="results-header">
                <button className="back-btn" onClick={handleReset}>← New Analysis</button>
                <div className="overall-badge" style={{ background: riskMeta[overallRisk]?.bg, color: riskMeta[overallRisk]?.color, border: `1px solid ${riskMeta[overallRisk]?.color}40` }}>
                  <span>{riskMeta[overallRisk]?.icon}</span> Overall: {riskMeta[overallRisk]?.label}
                  {result.urgent && <span style={{ marginLeft: 8, fontSize: 10, background: "rgba(239,68,68,0.2)", padding: "2px 8px", borderRadius: 100 }}>⚠ Urgent</span>}
                </div>
                <div className="results-title">Holistic Health Analysis</div>
                <div className="results-sub">
                  {selectedCount} symptom{selectedCount !== 1 ? "s" : ""}
                  {result.score && ` · Score ${result.score}/3`}
                  {cycleData?.phase && ` · ${cycleData.phase} Phase`}
                  {isPostpartum && " · Postpartum 🤱"}
                </div>
              </div>

              <div className="results-layout">
                <div>
                  {/* Cycle phase impact */}
                  {cycleData?.phase && (
                    <div className="cycle-banner" style={{ background: `${phaseColors[cycleData.phase]?.color || "#c084fc"}12`, border: `1px solid ${phaseColors[cycleData.phase]?.color || "#c084fc"}30`, marginBottom: 16, cursor: "default" }}>
                      <span style={{ fontSize: 18 }}>{phaseColors[cycleData.phase]?.icon || "🌙"}</span>
                      <div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: phaseColors[cycleData.phase]?.color || "#c084fc" }}>
                          {cycleData.phase} Phase · Day {cycleData.day_of_cycle}
                          {cycleData.days_until_next_period && ` · ${cycleData.days_until_next_period}d until next period`}
                        </div>
                        {cycleData.phase_impact_on_symptoms && (
                          <div style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", marginTop: 2 }}>{cycleData.phase_impact_on_symptoms}</div>
                        )}
                        {cycleData.pcos_cycle_correlation && (
                          <div style={{ fontSize: 11, color: "rgba(240,238,248,0.35)", marginTop: 2 }}>PCOS: {cycleData.pcos_cycle_correlation}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cross-system insights */}
                  {result.cross_system_insights?.length > 0 && (
                    <div className="insight-box" style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🔗 Cross-System Insights</div>
                      {result.cross_system_insights.map((ins, i) => (
                        <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "3px 0", display: "flex", gap: 8, lineHeight: 1.6 }}>
                          <span style={{ color: "#818cf8", flexShrink: 0 }}>→</span> {ins}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="section-label" style={{ marginBottom: 12 }}>Risk Assessment · Gemini AI</div>
                  <div className="risk-cards">
                    {[
                      { key: "thyroid",       label: "Thyroid",        icon: "🦋", desc: "Hormonal & metabolic" },
                      { key: "pcos",          label: "PCOS",           icon: "🌸", desc: "Reproductive health" },
                      { key: "iron",          label: "Iron / Anemia",  icon: "🩸", desc: "Oxygen transport" },
                      { key: "depression",    label: "Mental Health",  icon: "🧠", desc: "Mood & wellness" },
                      { key: "hormonal",      label: "Hormonal",       icon: "⚡", desc: "Estrogen & adrenal" },
                      { key: "cardiovascular",label: "Cardiovascular", icon: "❤️", desc: "BP & heart health" },
                      { key: "nutritional",   label: "Nutritional",    icon: "🌿", desc: "B12, D, Folate" },
                    ].map(({ key, label, icon, desc }) => {
                      const level  = result.breakdown?.[key] || "Low";
                      const meta   = riskMeta[level] || riskMeta["Low"];
                      const acc    = result.accuracy?.[key];
                      const reason = result.reasoning?.[key];
                      return (
                        <div key={key} className="risk-card" style={{ background: meta.bg, borderColor: `${meta.color}30` }}>
                          <div className="risk-card-top">
                            <div className="risk-left">
                              <div className="risk-icon-wrap" style={{ background: `${meta.color}20` }}>{icon}</div>
                              <div><div className="risk-name">{label}</div><div className="risk-desc">{desc}</div></div>
                            </div>
                            <div className="risk-right">
                              <div className="risk-level" style={{ background: `${meta.color}20`, color: meta.color }}>{meta.icon} {level}</div>
                              {acc !== undefined && <div className="risk-accuracy">{acc}% confidence</div>}
                            </div>
                          </div>
                          {reason && <div className="risk-reasoning">💡 {reason}</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendation */}
                  <div className="rec-box" style={{
                    background: result.urgent ? "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(220,38,38,0.08))" : "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.1))",
                    border: `1px solid ${result.urgent ? "rgba(239,68,68,0.25)" : "rgba(124,58,237,0.25)"}`,
                    marginBottom: 14,
                  }}>
                    <div className="rec-title" style={{ color: result.urgent ? "#ef4444" : "var(--accent)" }}>
                      {result.urgent ? "⚠️ Urgent" : "✦ Recommendation"}
                    </div>
                    <div className="rec-text">{result.recommendation}</div>
                  </div>

                  {/* Mood response */}
                  {result.mood_response && (
                    <div style={{ background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.18)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, color: "#c084fc", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        💙 Personal Response · {result.mood_response.emotion_detected}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(240,238,248,0.45)", fontStyle: "italic", marginBottom: 8 }}>{result.mood_response.validation}</div>
                      <div style={{ fontSize: 12, color: "rgba(240,238,248,0.65)", lineHeight: 1.7, marginBottom: 12 }}>{result.mood_response.consolation}</div>
                      {result.mood_response.practical_steps?.map((s, i) => (
                        <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "2px 0", display: "flex", gap: 8 }}>
                          <span style={{ color: "#c084fc" }}>{i + 1}.</span> {s}
                        </div>
                      ))}
                      {result.mood_response.seek_help_urgently && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, fontSize: 11, color: "#fca5a5" }}>
                          ⚠️ If in crisis: iCall 9152987821 · Vandrevala Foundation 1860-2662-345
                        </div>
                      )}
                    </div>
                  )}

                  {/* Postpartum deep analysis */}
                  {result.postpartum_analysis && isPostpartum && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🤱 Postpartum Analysis</div>
                      <div style={{ fontSize: 12, color: "rgba(240,238,248,0.5)", lineHeight: 1.7, marginBottom: 12 }}>{result.postpartum_analysis.postpartum_summary}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 12 }}>
                        {[
                          { label: "B12", key: "vitamin_b12_risk" },
                          { label: "Vit D", key: "vitamin_d_risk" },
                          { label: "Folate", key: "folate_risk" },
                          { label: "Iron", key: "iron_risk" },
                          { label: "Thyroiditis", key: "thyroiditis_risk" },
                          { label: "Mental", key: "mental_health_risk" },
                        ].map(({ label, key }) => {
                          const level = result.postpartum_analysis[key] || "Low";
                          const meta = riskMeta[level] || riskMeta["Low"];
                          return (
                            <div key={key} style={{ background: meta.bg, border: `1px solid ${meta.color}30`, borderRadius: 9, padding: "7px 8px", textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{level}</div>
                              <div style={{ fontSize: 9, color: "rgba(240,238,248,0.4)" }}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                      {result.postpartum_analysis.postpartum_actions?.map((a, i) => (
                        <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "2px 0", display: "flex", gap: 8 }}>
                          <span style={{ color: "#818cf8" }}>→</span> {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body model */}
                <div className="model-panel">
                  <BodyModel
                    result={result}
                    postpartumResult={isPostpartum ? {
                      depression: result.breakdown?.depression || "Low",
                      hormonal: result.breakdown?.hormonal || "Low",
                    } : null}
                    cycle={cycleData}
                    symptoms={symptoms}
                    isPostpartum={isPostpartum}
                    ppSymptoms={ppSymptoms}
                    user={user}
                  />
                  <div className="model-label">Click organs · Holistic analysis · Gemini AI</div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}