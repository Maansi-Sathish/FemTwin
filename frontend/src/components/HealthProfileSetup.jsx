"use client";
import { useState } from "react";
import { updateMe, uploadReport } from "../services/api";

export default function HealthProfileSetup({ user, onComplete }) {
  const [tab, setTab] = useState(1);
  const [form, setForm] = useState({
    bp_systolic: user?.bp_systolic || "",
    bp_diastolic: user?.bp_diastolic || "",
    blood_sugar: user?.blood_sugar || "",
    cholesterol_total: user?.cholesterol_total || "",
    cholesterol_hdl: user?.cholesterol_hdl || "",
    cholesterol_ldl: user?.cholesterol_ldl || "",
    hemoglobin: user?.hemoglobin || "",
    heart_rate: user?.heart_rate || "",
    oxygen_level: user?.oxygen_level || "",
    vitamin_b12: user?.vitamin_b12 || "",
    vitamin_d: user?.vitamin_d || "",
    folate: user?.folate || "",
    last_period_date: user?.last_period_date || "",
    cycle_length: user?.cycle_length || "28",
    period_length: user?.period_length || "5",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadReport(file);
      setExtracted(res.extracted);
      setReportResult(res.extracted);
      const ext = res.extracted;
      setForm(p => ({
        ...p,
        bp_systolic: ext.bp_systolic || p.bp_systolic,
        bp_diastolic: ext.bp_diastolic || p.bp_diastolic,
        blood_sugar: ext.blood_sugar || p.blood_sugar,
        cholesterol_total: ext.cholesterol_total || p.cholesterol_total,
        cholesterol_hdl: ext.cholesterol_hdl || p.cholesterol_hdl,
        cholesterol_ldl: ext.cholesterol_ldl || p.cholesterol_ldl,
        hemoglobin: ext.hemoglobin || p.hemoglobin,
        heart_rate: ext.heart_rate || p.heart_rate,
        oxygen_level: ext.oxygen_level || p.oxygen_level,
        vitamin_b12: ext.vitamin_b12 || p.vitamin_b12,
        vitamin_d: ext.vitamin_d || p.vitamin_d,
        folate: ext.folate || p.folate,
      }));
      setTab(1);
    } catch (e) {
      alert("Could not process report. Try manually entering values.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({
        bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
        blood_sugar: form.blood_sugar ? parseFloat(form.blood_sugar) : null,
        cholesterol_total: form.cholesterol_total ? parseFloat(form.cholesterol_total) : null,
        cholesterol_hdl: form.cholesterol_hdl ? parseFloat(form.cholesterol_hdl) : null,
        cholesterol_ldl: form.cholesterol_ldl ? parseFloat(form.cholesterol_ldl) : null,
        hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
        heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
        oxygen_level: form.oxygen_level ? parseFloat(form.oxygen_level) : null,
        vitamin_b12: form.vitamin_b12 ? parseFloat(form.vitamin_b12) : null,
        vitamin_d: form.vitamin_d ? parseFloat(form.vitamin_d) : null,
        folate: form.folate ? parseFloat(form.folate) : null,
        last_period_date: form.last_period_date || null,
        cycle_length: form.cycle_length ? parseInt(form.cycle_length) : 28,
        period_length: form.period_length ? parseInt(form.period_length) : 5,
        profile_complete: true,
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const urgencyColor = { immediate: "#ef4444", within_week: "#f97316", monitor: "#eab308", normal: "#22c55e" };
  const urgencyLabel = { immediate: "⚠️ See doctor TODAY", within_week: "📅 See doctor this week", monitor: "👁 Monitor & recheck", normal: "✅ All looks normal" };

  const Field = ({ label, k, unit, hint, type = "number" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
        {label} {unit && <span style={{ color: "rgba(240,238,248,0.2)" }}>({unit})</span>}
      </label>
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={hint}
        style={{ padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, fontFamily: "DM Sans, sans-serif", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#6d28d9", filter: "blur(120px)", opacity: 0.15, top: -100, left: -100 }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#1d4ed8", filter: "blur(120px)", opacity: 0.15, bottom: -100, right: -100 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 600, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "36px 44px", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c084fc", marginBottom: 10 }}>One-time setup</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: "#f0eef8", marginBottom: 8, letterSpacing: -1 }}>Complete your health profile</h2>
          <p style={{ fontSize: 13, color: "rgba(240,238,248,0.4)", lineHeight: 1.6 }}>These values help Gemini AI give personalized, accurate analysis. Upload a report to auto-fill.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12 }}>
          {[{ id: 1, label: "✏️ Manual Entry" }, { id: 2, label: "📄 Upload Report" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
              fontSize: 12, fontFamily: "Syne, sans-serif", fontWeight: 600,
              background: tab === t.id ? "rgba(192,132,252,0.15)" : "transparent",
              color: tab === t.id ? "#c084fc" : "rgba(240,238,248,0.35)", transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Report result explanation */}
        {reportResult && (
          <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.03)", border: `1px solid ${urgencyColor[reportResult.urgency] || "#818cf8"}40`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: urgencyColor[reportResult.urgency] || "#818cf8", marginBottom: 6 }}>
              {urgencyLabel[reportResult.urgency] || "Report Processed"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(240,238,248,0.6)", lineHeight: 1.7, marginBottom: 10 }}>{reportResult.explanation}</div>
            {reportResult.urgency_reason && (
              <div style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", marginBottom: 10 }}>📌 {reportResult.urgency_reason}</div>
            )}
            {reportResult.action_items?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "rgba(240,238,248,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Action Items</div>
                {reportResult.action_items.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(240,238,248,0.55)", padding: "2px 0", display: "flex", gap: 8 }}>
                    <span style={{ color: urgencyColor[reportResult.urgency] }}>→</span> {a}
                  </div>
                ))}
              </div>
            )}
            {reportResult.abnormal_values?.length > 0 && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "#fca5a5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Abnormal Values</div>
                {reportResult.abnormal_values.map((v, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(240,238,248,0.5)", padding: "1px 0" }}>⚠ {v}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual entry */}
        {tab === 1 && (
          <>
            {extracted && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#86efac", marginBottom: 16 }}>✓ Values auto-filled from report. Review below.</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>

              {/* BP */}
              <div>
                <label style={{ fontSize: 10, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Blood Pressure (mmHg)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="number" value={form.bp_systolic} onChange={e => set("bp_systolic", e.target.value)} placeholder="120"
                    style={{ flex: 1, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, outline: "none" }} />
                  <span style={{ color: "rgba(240,238,248,0.3)" }}>/</span>
                  <input type="number" value={form.bp_diastolic} onChange={e => set("bp_diastolic", e.target.value)} placeholder="80"
                    style={{ flex: 1, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 13, outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Blood Sugar" k="blood_sugar" unit="mg/dL" hint="95" />
                <Field label="Hemoglobin" k="hemoglobin" unit="g/dL" hint="13.5" />
                <Field label="Heart Rate" k="heart_rate" unit="bpm" hint="72" />
                <Field label="Oxygen Level" k="oxygen_level" unit="%" hint="98" />
                <Field label="Total Cholesterol" k="cholesterol_total" unit="mg/dL" hint="180" />
                <Field label="HDL Cholesterol" k="cholesterol_hdl" unit="mg/dL" hint="55" />
                <Field label="LDL Cholesterol" k="cholesterol_ldl" unit="mg/dL" hint="100" />
                <Field label="Vitamin B12" k="vitamin_b12" unit="pg/mL" hint="400" />
                <Field label="Vitamin D" k="vitamin_d" unit="ng/mL" hint="40" />
                <Field label="Folate" k="folate" unit="ng/mL" hint="10" />
              </div>

              {/* Period tracking */}
              <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, color: "#c084fc", marginBottom: 12 }}>🌙 Period Tracking</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Last Period Date" k="last_period_date" hint="2024-01-01" type="date" />
                  <Field label="Cycle Length" k="cycle_length" unit="days" hint="28" />
                  <Field label="Period Length" k="period_length" unit="days" hint="5" />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onComplete} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(240,238,248,0.4)", fontSize: 13, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>Skip</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 12, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          </>
        )}

        {/* Upload report */}
        {tab === 2 && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
              onClick={() => document.getElementById("report-input").click()}
              style={{ border: `2px dashed ${dragOver ? "#c084fc" : "rgba(255,255,255,0.1)"}`, borderRadius: 16, padding: "44px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(192,132,252,0.05)" : "rgba(255,255,255,0.02)", transition: "all 0.2s", marginBottom: 16 }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(240,238,248,0.7)", marginBottom: 5 }}>
                {file ? file.name : "Drop your lab report here"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(240,238,248,0.3)" }}>PDF, JPG, or PNG · Gemini AI extracts all values + gives explanation</div>
              <input id="report-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>

            {file && (
              <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#c084fc", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                📎 {file.name}
                <button onClick={() => setFile(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(240,238,248,0.3)", cursor: "pointer" }}>✕</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onComplete} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(240,238,248,0.4)", fontSize: 13, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>Skip</button>
              <button onClick={handleUpload} disabled={!file || uploading} style={{ flex: 2, padding: 12, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer", opacity: !file ? 0.5 : 1 }}>
                {uploading ? "⏳ Gemini reading..." : "Extract & Fill Values →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}