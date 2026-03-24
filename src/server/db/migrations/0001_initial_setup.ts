export const migration_0001_initial_setup = {
  name: '0001_initial_setup',
  queries : [
    `CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS admins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'admin',
      created_at    INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT    PRIMARY KEY,
      admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS players (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier            TEXT    NOT NULL UNIQUE,
      name                  TEXT    NOT NULL,
      first_seen            INTEGER NOT NULL,
      last_seen             INTEGER NOT NULL,
      total_playtime_seconds INTEGER NOT NULL DEFAULT 0,
      is_banned             INTEGER NOT NULL DEFAULT 0,
      ban_reason            TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS player_sessions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id        INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      joined_at        INTEGER NOT NULL,
      left_at          INTEGER,
      duration_seconds INTEGER
    );`,

    `CREATE TABLE IF NOT EXISTS audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id   INTEGER REFERENCES admins(id) ON DELETE SET NULL,
      action     TEXT    NOT NULL,
      target     TEXT,
      details    TEXT,
      created_at INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS console_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      line       TEXT    NOT NULL,
      source     TEXT    NOT NULL DEFAULT 'stdout',
      created_at INTEGER NOT NULL
    );`,
  ]
}