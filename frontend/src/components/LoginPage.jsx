"use client";
import { useState } from "react";
import { login, register } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "", weight: "", height: "", blood_type: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          name: form.name, email: form.email, password: form.password,
          age: form.age ? parseInt(form.age) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          height: form.height ? parseFloat(form.height) : null,
          blood_type: form.blood_type || null,
        });
        await login(form.email, form.password);
      }
      onLogin();
    } catch (e) {
      setError(e?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp = (placeholder, key, type = "text") => (
    <input
      type={type} placeholder={placeholder} value={form[key]}
      onChange={e => set(key, e.target.value)}
      style={inpStyle}
    />
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.orb1} /><div style={styles.orb2} />
      <div style={styles.card}>
        <div style={styles.logo}>Fem<span style={{ color: "#ef4444" }}>Twin</span></div>
        <p style={styles.sub}>{mode === "login" ? "Welcome back" : "Create your health twin"}</p>

        <div style={styles.tabs}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={styles.fields}>
          {mode === "register" && inp("Full Name", "name")}
          {inp("Email", "email", "email")}
          {inp("Password", "password", "password")}
          {mode === "register" && (
            <>
              <div style={styles.row}>
                {inp("Age", "age", "number")}
                {inp("Weight (kg)", "weight", "number")}
              </div>
              <div style={styles.row}>
                {inp("Height (cm)", "height", "number")}
                <select value={form.blood_type} onChange={e => set("blood_type", e.target.value)} style={inpStyle}>
                  <option value="">Blood Type</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={styles.btn}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

const inpStyle = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#f0eef8",
  fontSize: 14, fontFamily: "DM Sans, sans-serif",
  outline: "none",
};

const styles = {
  wrap: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#03050f", position: "relative", overflow: "hidden",
  },
  orb1: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "#6d28d9", filter: "blur(100px)", opacity: 0.2, top: -150, left: -100 },
  orb2: { position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#1d4ed8", filter: "blur(100px)", opacity: 0.2, bottom: -100, right: -100 },
  card: {
    position: "relative", zIndex: 1,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24, padding: "40px 48px", width: "100%", maxWidth: 480,
    backdropFilter: "blur(20px)",
  },
  logo: { fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "#c084fc", marginBottom: 8 },
  sub: { fontSize: 14, color: "rgba(240,238,248,0.45)", marginBottom: 28 },
  tabs: { display: "flex", gap: 8, marginBottom: 24, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10 },
  tab: { flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 600, background: "transparent", color: "rgba(240,238,248,0.4)", transition: "all 0.2s" },
  tabActive: { background: "rgba(192,132,252,0.15)", color: "#c084fc" },
  fields: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  row: { display: "flex", gap: 10 },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 12 },
  btn: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer", marginTop: 8 },
};