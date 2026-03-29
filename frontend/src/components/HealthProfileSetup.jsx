"use client";
import { useState } from "react";
import { updateMe, uploadReport } from "../services/api";

export default function HealthProfileSetup({ user, onComplete }) {
  const [step, setStep] = useState(1); // 1=manual, 2=upload
  const [form, setForm] = useState({
    bp_systolic: user?.bp_systolic || "",
    bp_diastolic: user?.bp_diastolic || "",
    blood_sugar: user?.blood_sugar || "",
    cholesterol_total: user?.cholesterol_total || "",
    cholesterol_hdl: user?.cholesterol_hdl || "",
    cholesterol_ldl: user?.cholesterol_ldl || "",
    hemoglobin: user?.hemoglobin || "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadReport(file);
      setExtracted(res.extracted);
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
      }));
      setStep(1);
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
        profile_complete: true,
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, unit, hint }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
        {label} {unit && <span style={{ color: "rgba(240,238,248,0.25)" }}>({unit})</span>}
      </label>
      <input
        type="number" value={form[k]} onChange={e => set(k, e.target.value)}
        placeholder={hint}
        style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#6d28d9", filter: "blur(120px)", opacity: 0.15, top: -100, left: -100 }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#1d4ed8", filter: "blur(120px)", opacity: 0.15, bottom: -100, right: -100 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "40px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c084fc", marginBottom: 10 }}>
            One-time setup
          </div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: "#f0eef8", marginBottom: 8, letterSpacing: -1 }}>
            Complete your<br />health profile
          </h2>
          <p style={{ fontSize: 13, color: "rgba(240,238,248,0.4)", lineHeight: 1.6 }}>
            These values help Gemini AI give you more accurate, personalized analysis. You can update them anytime.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12 }}>
          {[{ id: 1, label: "✏️ Enter Manually" }, { id: 2, label: "📄 Upload Report" }].map(t => (
            <button key={t.id} onClick={() => setStep(t.id)} style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 9, cursor: "pointer",
              fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 600,
              background: step === t.id ? "rgba(192,132,252,0.15)" : "transparent",
              color: step === t.id ? "#c084fc" : "rgba(240,238,248,0.35)",
              transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Manual Entry */}
        {step === 1 && (
          <>
            {extracted && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#86efac", marginBottom: 20 }}>
                ✓ Values auto-filled from your report. Review and edit below.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>
                  Blood Pressure <span style={{ color: "rgba(240,238,248,0.25)" }}>(mmHg) — editable</span>
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="number" value={form.bp_systolic} onChange={e => set("bp_systolic", e.target.value)} placeholder="120"
                    style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                  <span style={{ color: "rgba(240,238,248,0.3)", fontSize: 18 }}>/</span>
                  <input type="number" value={form.bp_diastolic} onChange={e => set("bp_diastolic", e.target.value)} placeholder="80"
                    style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                </div>
              </div>
              <Field label="Blood Sugar" k="blood_sugar" unit="mg/dL" hint="95" />
              <Field label="Hemoglobin" k="hemoglobin" unit="g/dL" hint="13.5" />
              <Field label="Total Cholesterol" k="cholesterol_total" unit="mg/dL" hint="180" />
              <Field label="HDL Cholesterol" k="cholesterol_hdl" unit="mg/dL" hint="55" />
              <Field label="LDL Cholesterol" k="cholesterol_ldl" unit="mg/dL" hint="100" />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onComplete} style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(240,238,248,0.4)", fontSize: 13, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>
                Skip for now
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          </>
        )}

        {/* Upload Report */}
        {step === 2 && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
              onClick={() => document.getElementById("report-input").click()}
              style={{
                border: `2px dashed ${dragOver ? "#c084fc" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 16, padding: "48px 24px",
                textAlign: "center", cursor: "pointer",
                background: dragOver ? "rgba(192,132,252,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s", marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 600, color: "rgba(240,238,248,0.7)", marginBottom: 6 }}>
                {file ? file.name : "Drop your lab report here"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(240,238,248,0.3)" }}>
                PDF, JPG, or PNG · Gemini AI will extract all values
              </div>
              <input id="report-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                onChange={e => setFile(e.target.files[0])} />
            </div>

            {file && (
              <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#c084fc", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span>📎</span> {file.name}
                <button onClick={() => setFile(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(240,238,248,0.3)", cursor: "pointer" }}>✕</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onComplete} style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "rgba(240,238,248,0.4)", fontSize: 13, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>
                Skip for now
              </button>
              <button onClick={handleUpload} disabled={!file || uploading} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer", opacity: !file ? 0.5 : 1 }}>
                {uploading ? "⏳ Gemini is reading..." : "Extract & Fill Values →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}