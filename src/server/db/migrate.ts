import type { Database } from "bun:sqlite";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

/* ToDo:
  * Alter migrations from .sql files to ts files with individual queries 
*/

export async function runMigrations(db: Database): Promise<void> {
  // Ensure migrations tracking table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT    NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    )
  `);

  const migrationsDir = join(import.meta.dir, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    db
      .query<{ filename: string }, []>("SELECT filename FROM _migrations")
      .all()
      .map((r) => r.filename)
  );

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), "utf-8");

    // Run in a transaction
    db.transaction(() => {
      db.run(sql);
      db.run(
        "INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)",
        [file, Date.now()]
      );
    })();

    console.log(`[migrations] Applied: ${file}`);
  }
}
