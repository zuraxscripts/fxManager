import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Config ────────────────────────────────────────────────────────────────────
export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ── Admin accounts ────────────────────────────────────────────────────────────
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["superadmin", "admin", "moderator"] })
    .notNull()
    .default("admin"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Players ───────────────────────────────────────────────────────────────────
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  identifier: text("identifier").notNull().unique(), // steam/license hex
  name: text("name").notNull(),
  firstSeen: integer("first_seen", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastSeen: integer("last_seen", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  totalPlaytimeSeconds: integer("total_playtime_seconds").notNull().default(0),
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
  banReason: text("ban_reason"),
});

// ── Player sessions ───────────────────────────────────────────────────────────
export const playerSessions = sqliteTable("player_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  leftAt: integer("left_at", { mode: "timestamp" }),
  durationSeconds: integer("duration_seconds"),
});

// ── Audit log ─────────────────────────────────────────────────────────────────
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("admin_id").references(() => admins.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  target: text("target"),
  details: text("details"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Console log (persisted lines) ─────────────────────────────────────────────
export const consoleLogs = sqliteTable("console_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  line: text("line").notNull(),
  source: text("source", { enum: ["stdout", "stderr"] })
    .notNull()
    .default("stdout"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
