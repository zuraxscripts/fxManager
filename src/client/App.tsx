import { useState, useEffect } from "react";
import { SetupPage } from "./pages/SetupPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

type AppState = "loading" | "setup" | "login" | "dashboard";

export function App() {
  const [state, setState] = useState<AppState>("loading");

  useEffect(() => {
    (async () => {
      // Check if setup is done
      const setupRes = await fetch("/api/setup/status");
      const { configured } = await setupRes.json();
      if (!configured) { setState("setup"); return; }

      // Check if already authenticated
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      setState(me.authenticated ? "dashboard" : "login");
    })();
  }, []);

  if (state === "loading") return <Loader />;
  if (state === "setup") return <SetupPage onComplete={() => setState("login")} />;
  if (state === "login") return <LoginPage onLogin={() => setState("dashboard")} />;
  return <DashboardPage onLogout={() => setState("login")} />;
}

function Loader() {
  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", flexDirection: "column", gap: 16,
    }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>initialising…</span>
    </div>
  );
}
