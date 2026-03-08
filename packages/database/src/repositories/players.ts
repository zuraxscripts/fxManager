import { eq, desc } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { players } from '../schema';
import type * as schema from '../schema';

type DB = BunSQLiteDatabase<typeof schema>;

export function createPlayersRepository(db: DB) {
  return {
    upsert(license: string, name: string) {
      const now = new Date();
      return db
        .insert(players)
        .values({ license, name, firstSeen: now, lastSeen: now })
        .onConflictDoUpdate({
          target: players.license,
          set: { name, lastSeen: now },
        })
        .returning();
    },

    findByLicense(license: string) {
      return db.select().from(players).where(eq(players.license, license)).get();
    },

    findById(id: number) {
      return db.select().from(players).where(eq(players.id, id)).get();
    },

    list(page = 1, pageSize = 50) {
      return db
        .select()
        .from(players)
        .orderBy(desc(players.lastSeen))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all();
    },
  };
}
