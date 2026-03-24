import type { Database } from "bun:sqlite";
import migrations from "./migrations";

export async function runMigrations(db: Database): Promise<void> {
  // Ensure migrations tracking table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT    NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    )
  `);

  const applied = new Set(
    db
      .query<{ filename: string }, []>("SELECT filename FROM _migrations")
      .all()
      .map((r) => r.filename)
  );

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;

    // Run in a transaction
    db.transaction(() => {
      migration.queries.forEach(sql => {
        db.run(sql);
      });
      db.run(
        "INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)",
        [migration.name, Date.now()]
      );
    })();

    console.log(`[migrations] Applied: ${migration.name}`);
  }
}
