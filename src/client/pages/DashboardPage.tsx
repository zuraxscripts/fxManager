import { useState, useEffect, useRef, useCallback } from "react";

type Tab = "overview" | "console" | "players" | "audit";
type ServerStatus = "offline" | "starting" | "online" | "stopping";

interface Props { onLogout: () => void; }

interface ConsoleLine { line: string; source: "stdout" | "stderr"; ts: number; }
interface Player { id: number; identifier: string; name: string; totalPlaytimeSeconds: number; isBanned: number; lastSeen: string; }
interface AuditEntry { id: number; adminId: number | null; action: string; target: string | null; details: string | null; createdAt: string; }
interface Stats { status: ServerStatus; totalPlayers: number; totalConsoleLogs: number; }

export function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<ServerStatus>("offline");
  const [stats, setStats] = useState<Stats | null>(null);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [cmdInput, setCmdInput] = useState("");
  const [serverName, setServerName] = useState("FiveM Server");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.topic === "console") {
        setConsoleLines(prev => [...prev.slice(-499), { ...msg.payload, ts: msg.ts }]);
      } else if (msg.topic === "server:status") {
        setStatus(msg.payload.status);
      } else if (msg.topic === "player:join" || msg.topic === "player:leave") {
        fetchPlayers();
      }
    };

    ws.onclose = () => console.log("[ws] disconnected");
    return () => ws.close();
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLines]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
      setStatus(data.status);
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    const res = await fetch("/api/players");
    if (res.ok) setPlayers(await res.json());
  }, []);

  const fetchAudit = useCallback(async () => {
    const res = await fetch("/api/audit");
    if (res.ok) setAuditLog(await res.json());
  }, []);

  const fetchConsoleHistory = useCallback(async () => {
    const res = await fetch("/api/console");
    if (res.ok) {
      const rows = await res.json();
      setConsoleLines(rows.map((r: any) => ({ line: r.line, source: r.source, ts: r.createdAt })));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchConsoleHistory();
    fetchPlayers();
    fetchAudit();
  }, []);

  async function toggleServer() {
    if (status === "online" || status === "starting") {
      await fetch("/api/stop", { method: "POST" });
    } else {
      await fetch("/api/start", { method: "POST" });
    }
    setTimeout(fetchStats, 500);
  }

  async function sendCommand() {
    if (!cmdInput.trim()) return;
    await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: cmdInput }),
    });
    setCmdInput("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  const statusColor = { online: "var(--green)", starting: "var(--yellow)", stopping: "var(--yellow)", offline: "var(--red)" }[status];
  const canStart = status === "offline";
  const canStop = status === "online";

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "console", label: "Console", icon: ">" },
    { id: "players", label: "Players", icon: "◎" },
    { id: "audit", label: "Audit Log", icon: "≡" },
  ];

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ color: "var(--accent)", fontSize: 20 }}>⬡</span>
          <span style={styles.logoText}>NEXUS<span style={{ color: "var(--accent)" }}>WRAP</span></span>
        </div>

        {/* Status pill */}
        <div style={styles.statusPill}>
          <div style={{ ...styles.statusDot, background: statusColor }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{status}</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(tab === item.id ? styles.navBtnActive : {}) }}
              onClick={() => setTab(item.id)}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Server controls */}
        <div style={styles.serverControls}>
          <button
            style={{ ...styles.controlBtn, background: canStart ? "rgba(34,197,94,0.15)" : canStop ? "rgba(239,68,68,0.12)" : "var(--bg3)", color: canStart ? "var(--green)" : canStop ? "var(--red)" : "var(--muted)", borderColor: canStart ? "rgba(34,197,94,0.3)" : canStop ? "rgba(239,68,68,0.3)" : "var(--border)", cursor: (canStart || canStop) ? "pointer" : "not-allowed" }}
            onClick={toggleServer}
            disabled={!canStart && !canStop}
          >
            {canStop ? "⏹ Stop Server" : canStart ? "▶ Start Server" : status === "starting" ? "⟳ Starting…" : "⟳ Stopping…"}
          </button>
        </div>

        <button style={styles.logoutBtn} onClick={logout}>← Sign Out</button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Top bar */}
        <header style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
          </div>
          <div style={styles.topbarRight}>
            <div style={{ ...styles.statusBadge, background: statusColor + "22", color: statusColor, borderColor: statusColor + "44" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
              {status}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {tab === "overview" && <OverviewTab stats={stats} />}
          {tab === "console" && (
            <ConsoleTab
              lines={consoleLines}
              consoleEndRef={consoleEndRef}
              cmdInput={cmdInput}
              setCmdInput={setCmdInput}
              sendCommand={sendCommand}
              serverOnline={status === "online"}
            />
          )}
          {tab === "players" && <PlayersTab players={players} />}
          {tab === "audit" && <AuditTab entries={auditLog} />}
        </div>
      </main>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats | null }) {
  const cards = [
    { label: "Server Status", value: stats?.status ?? "—", accent: true },
    { label: "Total Players", value: stats?.totalPlayers?.toLocaleString() ?? "0" },
    { label: "Console Lines", value: stats?.totalConsoleLogs?.toLocaleString() ?? "0" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={styles.cardGrid}>
        {cards.map((c, i) => (
          <div key={i} style={{ ...styles.statCard, ...(c.accent ? { borderColor: "var(--accent)", borderWidth: 1 } : {}) }}>
            <span style={styles.statLabel}>{c.label}</span>
            <span style={{ ...styles.statValue, ...(c.accent ? { color: "var(--accent)" } : {}) }}>{c.value}</span>
          </div>
        ))}
      </div>

      <div style={styles.infoBox}>
        <h3 style={styles.sectionTitle}>Quick Start</h3>
        <p style={styles.infoText}>Use the <strong style={{ color: "var(--accent)" }}>▶ Start Server</strong> button in the sidebar to launch your FXServer process. Once running, live console output will stream to the Console tab via WebSocket.</p>
        <div style={styles.codeBlock}>
          <span style={{ color: "var(--muted)" }}># WebSocket endpoint</span>{"\n"}
          <span style={{ color: "var(--accent2)" }}>ws://localhost:3000/ws</span>{"\n\n"}
          <span style={{ color: "var(--muted)" }}># Topics: console · player:join · player:leave · server:status · audit</span>
        </div>
      </div>
    </div>
  );
}

// ── Console ───────────────────────────────────────────────────────────────────
function ConsoleTab({ lines, consoleEndRef, cmdInput, setCmdInput, sendCommand, serverOnline }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={styles.consoleBox}>
        {lines.length === 0 && (
          <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>No output yet. Start the server to see console output.</span>
        )}
        {lines.map((l: ConsoleLine, i: number) => (
          <div key={i} style={{ ...styles.consoleLine, color: l.source === "stderr" ? "#f87171" : "var(--text)" }}>
            <span style={styles.consoleTs}>{new Date(l.ts).toLocaleTimeString()}</span>
            <span>{l.line}</span>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>

      <div style={styles.cmdRow}>
        <span style={styles.cmdPrompt}>$</span>
        <input
          value={cmdInput}
          onChange={e => setCmdInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendCommand()}
          placeholder={serverOnline ? "Type a server command…" : "Server is offline"}
          disabled={!serverOnline}
          style={styles.cmdInput}
        />
        <button onClick={sendCommand} disabled={!serverOnline || !cmdInput.trim()} style={styles.cmdBtn}>Send</button>
      </div>
    </div>
  );
}

// ── Players ───────────────────────────────────────────────────────────────────
function PlayersTab({ players }: { players: Player[] }) {
  function fmt(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div style={styles.tableWrap}>
      {players.length === 0 ? (
        <div style={styles.emptyState}>No player records yet.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {["Name", "Identifier", "Playtime", "Last Seen", "Status"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>{p.name}</td>
                <td style={{ ...styles.td, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{p.identifier}</td>
                <td style={styles.td}>{fmt(p.totalPlaytimeSeconds)}</td>
                <td style={{ ...styles.td, color: "var(--muted)", fontSize: 12 }}>{new Date(p.lastSeen).toLocaleString()}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: p.isBanned ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: p.isBanned ? "var(--red)" : "var(--green)" }}>
                    {p.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Audit ─────────────────────────────────────────────────────────────────────
function AuditTab({ entries }: { entries: AuditEntry[] }) {
  return (
    <div style={styles.tableWrap}>
      {entries.length === 0 ? (
        <div style={styles.emptyState}>No audit entries yet.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {["Action", "Target", "Admin", "Details", "Time"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent2)" }}>{e.action}</td>
                <td style={styles.td}>{e.target ?? "—"}</td>
                <td style={{ ...styles.td, color: "var(--muted)", fontSize: 12 }}>{e.adminId ?? "system"}</td>
                <td style={{ ...styles.td, color: "var(--muted)", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.details ?? "—"}</td>
                <td style={{ ...styles.td, color: "var(--muted)", fontSize: 12 }}>{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" },
  sidebar: {
    width: 220, flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", padding: "24px 16px", gap: 8,
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingLeft: 4 },
  logoText: { fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 18, letterSpacing: "0.1em" },
  statusPill: {
    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
    background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
    border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer",
    fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 600, textAlign: "left", transition: "all 0.15s",
  },
  navBtnActive: { background: "var(--bg3)", color: "var(--text)", borderLeft: "2px solid var(--accent)", paddingLeft: 10 },
  serverControls: { marginBottom: 8 },
  controlBtn: {
    width: "100%", padding: "10px 14px", border: "1px solid", borderRadius: 8,
    fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
    cursor: "pointer", transition: "all 0.15s",
  },
  logoutBtn: {
    background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer",
    fontSize: 12, fontFamily: "var(--font-ui)", padding: "8px 4px", textAlign: "left",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    padding: "18px 28px", borderBottom: "1px solid var(--border)", display: "flex",
    alignItems: "center", justifyContent: "space-between", background: "var(--bg2)", flexShrink: 0,
  },
  pageTitle: { fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 20, letterSpacing: "0.02em" },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  statusBadge: {
    display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
    borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em",
  },
  content: { flex: 1, overflow: "auto", padding: 28 },

  // Overview
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  statCard: {
    background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  statLabel: { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" },
  statValue: { fontSize: 28, fontWeight: 800, fontFamily: "var(--font-ui)", color: "var(--text)" },
  infoBox: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 12 },
  sectionTitle: { fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" },
  infoText: { color: "var(--muted)", fontSize: 13, lineHeight: 1.6 },
  codeBlock: {
    background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px",
    fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.8, whiteSpace: "pre",
  },

  // Console
  consoleBox: {
    flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
    padding: 16, overflow: "auto", fontFamily: "var(--font-mono)", fontSize: 12,
    lineHeight: 1.6, minHeight: 0, maxHeight: "calc(100vh - 280px)",
    display: "flex", flexDirection: "column", gap: 2,
  },
  consoleLine: { display: "flex", gap: 12, wordBreak: "break-all" },
  consoleTs: { color: "var(--muted)", flexShrink: 0, fontSize: 11 },
  cmdRow: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px",
  },
  cmdPrompt: { color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700 },
  cmdInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, padding: "4px 0",
  },
  cmdBtn: {
    background: "var(--accent)", color: "#000", border: "none", borderRadius: 6,
    padding: "6px 14px", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12, cursor: "pointer",
  },

  // Table
  tableWrap: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 700,
    color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
    borderBottom: "1px solid var(--border)", background: "var(--bg3)",
  },
  tr: { borderBottom: "1px solid var(--border)", transition: "background 0.1s" },
  td: { padding: "12px 16px", fontSize: 13, color: "var(--text)" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  emptyState: { padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 },
};
