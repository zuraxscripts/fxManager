import { useState } from "react";

interface Props { onLogin: () => void; }

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.grid} />
      <div style={styles.blob} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>NEXUS<span style={{ color: "var(--accent)" }}>WRAP</span></span>
          </div>
          <p style={styles.subtitle}>Sign in to the control panel</p>
        </div>

        <form onSubmit={submit} style={styles.form}>
          <Field label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoComplete="username" />
          <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6,
          padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13,
          outline: "none", transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg)", position: "relative", overflow: "hidden", padding: 24,
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
    backgroundSize: "48px 48px", opacity: 0.35,
  },
  blob: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
    top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, width: "100%", maxWidth: 400,
    background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16,
    padding: 40, display: "flex", flexDirection: "column", gap: 32,
  },
  header: { display: "flex", flexDirection: "column", gap: 8 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 28, color: "var(--accent)", lineHeight: 1 },
  logoText: { fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 22, letterSpacing: "0.1em" },
  subtitle: { color: "var(--muted)", fontSize: 13 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  error: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 6, padding: "10px 14px", color: "#ef4444", fontSize: 13,
  },
  btn: {
    background: "var(--accent)", color: "#000", border: "none", borderRadius: 8,
    padding: "12px 24px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14,
    cursor: "pointer", letterSpacing: "0.04em", marginTop: 4,
  },
};
