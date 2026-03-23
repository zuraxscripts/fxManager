import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import {
  startServer,
  stopServer,
  sendCommand,
  getStatus,
} from "../process/manager";
import { getConfig } from "../db";
import { getDb } from "../db";
import { consoleLogs, players, auditLog } from "../db/schema";
import { desc, count } from "drizzle-orm";

const api = new Hono();

// ── Server control ─────────────────────────────────────────────────────────────
api.get("/status", requireAuth, async (c) => {
  return c.json({ status: getStatus() });
});

api.post("/start", requireAuth, async (c) => {
  const path = await getConfig("server_path");
  if (!path) return c.json({ error: "Server path not configured" }, 400);
  try {
    await startServer(path);
    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

api.post("/stop", requireAuth, async (c) => {
  try {
    await stopServer();
    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

api.post("/command", requireAuth, async (c) => {
  const { cmd } = await c.req.json<{ cmd: string }>();
  try {
    sendCommand(cmd);
    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── Stats ──────────────────────────────────────────────────────────────────────
api.get("/stats", requireAuth, async (c) => {
  const db = getDb();

  const [totalPlayers] = await db.select({ count: count() }).from(players);
  const [totalLogs] = await db.select({ count: count() }).from(consoleLogs);

  return c.json({
    status: getStatus(),
    totalPlayers: totalPlayers.count,
    totalConsoleLogs: totalLogs.count,
  });
});

// ── Console history ────────────────────────────────────────────────────────────
api.get("/console", requireAuth, async (c) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(consoleLogs)
    .orderBy(desc(consoleLogs.id))
    .limit(200);
  return c.json(rows.reverse());
});

// ── Players ────────────────────────────────────────────────────────────────────
api.get("/players", requireAuth, async (c) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(players)
    .orderBy(desc(players.lastSeen))
    .limit(100);
  return c.json(rows);
});

// ── Audit log ──────────────────────────────────────────────────────────────────
api.get("/audit", requireAuth, async (c) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.id))
    .limit(100);
  return c.json(rows);
});

export default api;
