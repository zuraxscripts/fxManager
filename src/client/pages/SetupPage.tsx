import { useState } from "react";

interface Props { onComplete: () => void; }

export function SetupPage({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    serverName: "",
    serverPath: "",
    adminUsername: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const steps = [
    { label: "Server", icon: "⬡" },
    { label: "Admin", icon: "◈" },
    { label: "Review", icon: "◉" },
  ];

  async function submit() {
    setError("");
    if (form.adminPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.grid} />

      {/* Accent blob */}
      <div style={styles.blob} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>NEXUS<span style={{ color: "var(--accent)" }}>WRAP</span></span>
          </div>
          <p style={styles.subtitle}>First-time setup</p>
        </div>

        {/* Stepper */}
        <div style={styles.stepper}>
          {steps.map((s, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: i < step ? "var(--accent)" : i === step ? "var(--accent)" : "var(--bg3)",
                border: `1px solid ${i <= step ? "var(--accent)" : "var(--border)"}`,
                color: i <= step ? "#000" : "var(--muted)",
              }}>
                {i < step ? "✓" : s.icon}
              </div>
              <span style={{ ...styles.stepLabel, color: i === step ? "var(--text)" : "var(--muted)" }}>{s.label}</span>
              {i < steps.length - 1 && <div style={{ ...styles.stepLine, background: i < step ? "var(--accent)" : "var(--border)" }} />}
            </div>
          ))}
        </div>

        {/* Step 0 — Server config */}
        {step === 0 && (
          <div style={styles.fields}>
            <Field label="Server Name" placeholder="My FiveM Server" value={form.serverName} onChange={update("serverName")} />
            <Field label="FXServer Executable Path" placeholder="/opt/fxserver/run.sh" value={form.serverPath} onChange={update("serverPath")} hint="Full path to the FXServer binary or start script" />
          </div>
        )}

        {/* Step 1 — Admin account */}
        {step === 1 && (
          <div style={styles.fields}>
            <Field label="Admin Username" placeholder="admin" value={form.adminUsername} onChange={update("adminUsername")} />
            <Field label="Password" type="password" placeholder="Min. 8 characters" value={form.adminPassword} onChange={update("adminPassword")} />
            <Field label="Confirm Password" type="password" placeholder="" value={form.confirmPassword} onChange={update("confirmPassword")} />
          </div>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <div style={styles.review}>
            <ReviewRow label="Server Name" value={form.serverName || "(not set)"} />
            <ReviewRow label="Executable Path" value={form.serverPath || "(not set)"} />
            <ReviewRow label="Admin Username" value={form.adminUsername} />
            <ReviewRow label="Password" value="••••••••" />
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {/* Navigation */}
        <div style={styles.nav}>
          {step > 0 && (
            <button style={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button style={styles.btnPrimary} onClick={() => setStep(s => s + 1)}>
              Continue →
            </button>
          ) : (
            <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={submit} disabled={loading}>
              {loading ? "Setting up…" : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text", hint }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6,
          padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13,
          outline: "none", transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      {hint && <span style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</span>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>{value}</span>
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
    position: "absolute", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
    top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, width: "100%", maxWidth: 480,
    background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16,
    padding: 40, display: "flex", flexDirection: "column", gap: 32,
  },
  header: { display: "flex", flexDirection: "column", gap: 8 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 28, color: "var(--accent)", lineHeight: 1 },
  logoText: { fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 22, letterSpacing: "0.1em" },
  subtitle: { color: "var(--muted)", fontSize: 13 },
  stepper: { display: "flex", alignItems: "center", gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  stepDot: {
    width: 32, height: 32, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
    flexShrink: 0, transition: "all 0.2s",
  },
  stepLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" },
  stepLine: { flex: 1, height: 1, transition: "background 0.2s" },
  fields: { display: "flex", flexDirection: "column", gap: 18 },
  review: { display: "flex", flexDirection: "column" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "10px 14px", color: "#ef4444", fontSize: 13 },
  nav: { display: "flex", gap: 12 },
  btnPrimary: {
    background: "var(--accent)", color: "#000", border: "none", borderRadius: 8,
    padding: "11px 24px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14,
    cursor: "pointer", letterSpacing: "0.04em", transition: "opacity 0.15s",
  },
  btnSecondary: {
    background: "transparent", color: "var(--muted)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "11px 20px", fontFamily: "var(--font-ui)", fontWeight: 600,
    fontSize: 14, cursor: "pointer",
  },
};
