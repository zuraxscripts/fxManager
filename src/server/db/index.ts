import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database | null = null;

export function getDb() {
  if (!_db) throw new Error("DB not initialised — call initDb() first");
  return _db;
}

export function getSqlite() {
  if (!_sqlite) throw new Error("SQLite not initialised");
  return _sqlite;
}

export async function initDb(path = "data.db"): Promise<void> {
  _sqlite = new Database(path, { create: true });
  _sqlite.run("PRAGMA journal_mode = WAL");
  _sqlite.run("PRAGMA foreign_keys = ON");
  await runMigrations(_sqlite);
  _db = drizzle(_sqlite, { schema });
  console.log("[db] Ready");
}

// ── Config helpers ─────────────────────────────────────────────────────────────
export async function getConfig(key: string): Promise<string | null> {
  const db = getDb();
  const row = await db.query.config.findFirst({
    where: (c, { eq }) => eq(c.key, key),
  });
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const sqlite = getSqlite();
  sqlite.run(
    "INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [key, value]
  );
}
