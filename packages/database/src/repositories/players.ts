import { eq, desc, and } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { players, playerIdentifiers } from '../schema';
import type * as schema from '../schema';

type DB = BunSQLiteDatabase<typeof schema>;

export function createPlayersRepository(db: DB) {
  return {
    findByLicense(license: string) {
      return db
        .select({
          player: players,
        })
        .from(players)
        .innerJoin(playerIdentifiers, eq(playerIdentifiers.playerId, players.id))
        .where(and(eq(playerIdentifiers.type, 'license'), eq(playerIdentifiers.value, license)))
        .get();
    },

    async upsert(license: string, name: string) {
      const now = new Date();
      return db.transaction(async (tx) => {
        const existingIdentifier = tx
          .select()
          .from(playerIdentifiers)
          .where(and(eq(playerIdentifiers.type, 'license'), eq(playerIdentifiers.value, license)))
          .get();

        if (existingIdentifier) {
          return tx
            .update(players)
            .set({ name, lastSeen: now })
            .where(eq(players.id, existingIdentifier.playerId))
            .returning();
        } else {
          const [newPlayer] = await tx
            .insert(players)
            .values({ name, firstSeen: now, lastSeen: now })
            .returning();

          await tx.insert(playerIdentifiers).values({
            playerId: newPlayer.id,
            type: 'license',
            value: license,
          });

          return [newPlayer];
        }
      });
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
