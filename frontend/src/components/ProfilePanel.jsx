"use client";
import { useState } from "react";
import { updateMe } from "../services/api";

export default function ProfilePanel({ user, onUpdate, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || "", age: user?.age || "",
    weight: user?.weight || "", height: user?.height || "",
    blood_type: user?.blood_type || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({
        name: form.name,
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        blood_type: form.blood_type || null,
      });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inp = (label, key, type = "text") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#0d1124", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: "#c084fc" }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(240,238,248,0.4)", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {inp("Full Name", "name")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {inp("Age", "age", "number")}
            {inp("Weight (kg)", "weight", "number")}
            {inp("Height (cm)", "height", "number")}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, color: "rgba(240,238,248,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Blood Type</label>
              <select value={form.blood_type} onChange={e => set("blood_type", e.target.value)}
                style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0eef8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }}>
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: 14, background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer" }}>
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}