"use client";
import { useState, useEffect } from "react";
import { getCycleAnalysis, updateMe } from "../services/api";

const phaseColors = {
  Menstrual:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: "🔴" },
  Follicular: { color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "🌱" },
  Ovulation:  { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: "✨" },
  Luteal:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  icon: "🌙" },
};

const fertilityColors = {
  "Not Fertile":    "#818cf8",
  "Low Fertility":  "#eab308",
  "High Fertility": "#f97316",
  "Peak Fertility": "#22c55e",
};

const energyIcons = { Low: "🔋", Building: "⚡", High: "🚀", Declining: "📉" };

/**
 * Parse an ISO date string (YYYY-MM-DD) as LOCAL date, not UTC.
 * new Date("2025-03-29") is parsed as UTC midnight → shows Mar 28 in UTC+5:30.
 * This fixes that timezone shift.
 */
function parseLocalDate(isoStr) {
  if (!isoStr) return null;
  const [year, month, day] = isoStr.split("-").map(Number);
  return new Date(year, month - 1, day); // local midnight
}

function formatDate(isoStr) {
  const d = parseLocalDate(isoStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function CycleTracker({ user, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]       = useState({
    last_period_date: user?.last_period_date || "",
    cycle_length:     user?.cycle_length     || 28,
    period_length:    user?.period_length    || 5,
  });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (user?.last_period_date) fetchCycle();
    else { setLoading(false); setEditMode(true); }
  }, []);

  const fetchCycle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCycleAnalysis();
      if (res.error) { setError(res.error); setEditMode(true); }
      else setData(res);
    } catch (e) {
      setError("Could not load cycle data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({
        last_period_date: form.last_period_date,
        cycle_length:     parseInt(form.cycle_length),
        period_length:    parseInt(form.period_length),
      });
      setEditMode(false);
      await fetchCycle();
    } catch (e) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Resolve phase — fallback to Follicular if key not found
  const phase = data
    ? phaseColors[data.current_phase] || phaseColors[data.phase] || phaseColors.Follicular
    : phaseColors.Follicular;

  const fertilityColor = data
    ? fertilityColors[data.fertility_status] || "#818cf8"
    : "#818cf8";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 24 }}>
      <div style={{ background: "#080d1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px 36px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", fontFamily: "DM Sans, sans-serif", position: "relative" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "#c084fc", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Menstrual Health</div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: "#f0eef8" }}>Cycle Tracker</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditMode(e => !e)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "6px 14px", color: "rgba(240,238,248,0.5)", fontSize: 12, cursor: "pointer" }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 20 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Edit form */}
        {editMode && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "#c084fc", marginBottom: 16 }}>Update Period Info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>
                  Last Period Start Date
                </label>
                <input
                  type="date"
                  value={form.last_period_date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(p => ({ ...p, last_period_date: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>
                  Cycle Length (days)
                </label>
                <input
                  type="number"
                  min={21} max={45}
                  value={form.cycle_length}
                  onChange={e => setForm(p => ({ ...p, cycle_length: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>
                  Period Length (days)
                </label>
                <input
                  type="number"
                  min={2} max={10}
                  value={form.period_length}
                  onChange={e => setForm(p => ({ ...p, period_length: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, outline: "none" }}
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.last_period_date}
              style={{ width: "100%", padding: 11, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: saving || !form.last_period_date ? "not-allowed" : "pointer", opacity: !form.last_period_date ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : "Calculate My Cycle →"}
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#fca5a5", marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", color: "rgba(240,238,248,0.4)", padding: 40 }}>
            ⏳ Analyzing your cycle...
          </div>
        )}

        {data && !loading && (
          <>
            {/* Current phase hero */}
            <div style={{ background: phase.bg, border: `1px solid ${phase.color}40`, borderRadius: 18, padding: "20px 24px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{phase.icon}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: phase.color, marginBottom: 4 }}>
                {data.current_phase || data.phase} Phase
              </div>
              <div style={{ fontSize: 13, color: "rgba(240,238,248,0.5)", marginBottom: 12 }}>
                Day {data.day_of_cycle} of cycle · {data.days_until_next_period} days until next period
              </div>
              <div style={{ fontSize: 12, color: "rgba(240,238,248,0.6)", lineHeight: 1.7 }}>
                {data.phase_description}
              </div>
            </div>

            {/* Key stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                {
                  label: "Next Period",
                  value: formatDate(data.next_period_date),
                  color: null,
                },
                {
                  label: "Fertility",
                  value: data.fertility_status,
                  color: fertilityColor,
                },
                {
                  label: "Energy",
                  value: `${energyIcons[data.energy_level] || "⚡"} ${data.energy_level}`,
                  color: null,
                },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: s.color || "#f0eef8", marginBottom: 3 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(240,238,248,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Fertile window */}
            <div style={{ background: `${fertilityColor}18`, border: `1px solid ${fertilityColor}40`, borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: fertilityColor, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                🌸 Fertile Window
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(240,238,248,0.6)" }}>
                <div>Start: <strong style={{ color: "#f0eef8" }}>{formatDate(data.fertile_window_start)}</strong></div>
                <div>Ovulation: <strong style={{ color: "#22c55e" }}>{formatDate(data.ovulation_date)}</strong></div>
                <div>End: <strong style={{ color: "#f0eef8" }}>{formatDate(data.fertile_window_end)}</strong></div>
              </div>
            </div>

            {/* Mood tendency */}
            {data.mood_tendency && (
              <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "rgba(240,238,248,0.6)" }}>
                💭 <strong style={{ color: "#c084fc" }}>Mood this phase:</strong> {data.mood_tendency}
              </div>
            )}

            {/* Tips + expected symptoms */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, color: "#c084fc", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Phase Tips
                </div>
                {(data.phase_tips || []).map((t, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "3px 0", display: "flex", gap: 6 }}>
                    <span style={{ color: phase.color }}>→</span> {t}
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Expect These
                </div>
                {(data.symptoms_to_expect || []).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.55)", padding: "3px 0", display: "flex", gap: 6 }}>
                    <span style={{ color: "#818cf8" }}>·</span> {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Cycle info footer */}
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 11, color: "rgba(240,238,248,0.3)", textAlign: "center" }}>
              Cycle length: {data.cycle_length} days · Period length: {data.period_length} days · Based on last period: {formatDate(user?.last_period_date)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}