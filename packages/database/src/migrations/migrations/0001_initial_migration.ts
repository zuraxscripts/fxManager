import { Migration } from '../types';

export const migration_0001_initial: Migration = {
  version: 1,
  description: 'Initial schema',
  up: [
    `CREATE TABLE players (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      license    TEXT    NOT NULL UNIQUE,
      name       TEXT    NOT NULL,
      first_seen INTEGER NOT NULL,
      last_seen  INTEGER NOT NULL
    )`,

    `CREATE INDEX players_license_idx ON players (license)`,

    `CREATE TABLE bans (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id  INTEGER NOT NULL REFERENCES players (id),
      reason     TEXT    NOT NULL,
      banned_by  TEXT    NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      revoked_at INTEGER
    )`,

    `CREATE INDEX bans_player_idx ON bans (player_id)`,

    `CREATE TABLE audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id   TEXT    NOT NULL,
      action     TEXT    NOT NULL,
      target     TEXT,
      metadata   TEXT,
      created_at INTEGER NOT NULL
    )`,

    `CREATE INDEX audit_admin_idx   ON audit_log (admin_id)`,
    `CREATE INDEX audit_created_idx ON audit_log (created_at)`,

    `CREATE TABLE settings (
      key        TEXT PRIMARY KEY,
      value      TEXT    NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE api_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      token      TEXT    NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_used  INTEGER,
      revoked_at INTEGER
    )`,

    `CREATE INDEX tokens_token_idx ON api_tokens (token)`,
  ],
};
