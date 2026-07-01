import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type {
	DisconnectCounts,
	DisconnectSession,
	DropCategory,
} from '@fxmanager/shared/types';
import {
	disconnectEvents,
	serverSessions,
	sessionDisconnects,
} from '../schema';
import type * as schema from '../schema';

const zeroCounts = (): DisconnectCounts => ({
	quit: 0,
	crash: 0,
	timeout: 0,
	kick: 0,
	other: 0,
});

type DB = BunSQLiteDatabase<typeof schema>;
type JoinRow = {
	session: typeof serverSessions.$inferSelect;
	counts: typeof sessionDisconnects.$inferSelect;
};

const toApi = ({ session, counts }: JoinRow): DisconnectSession => ({
	id: session.id,
	startedAt: session.startedAt.getTime(),
	endedAt: session.endedAt ? session.endedAt.getTime() : null,
	quit: counts.quit,
	crash: counts.crash,
	timeout: counts.timeout,
	kick: counts.kick,
	other: counts.other,
});

class DisconnectsRepository {
	private static instance: DisconnectsRepository;
	private constructor(private readonly db: DB) {}

	static getInstance(db: DB): DisconnectsRepository {
		if (!DisconnectsRepository.instance) {
			DisconnectsRepository.instance = new DisconnectsRepository(db);
		}
		return DisconnectsRepository.instance;
	}

	openForSession(sessionId: number): void {
		this.db
			.insert(sessionDisconnects)
			.values({ sessionId })
			.onConflictDoNothing()
			.run();
	}

	bump(sessionId: number, category: DropCategory): void {
		const col = sessionDisconnects[category];
		this.db
			.update(sessionDisconnects)
			.set({ [category]: sql`${col} + 1` })
			.where(eq(sessionDisconnects.sessionId, sessionId))
			.run();
	}

	/** Record one drop with its timestamp, for time-range queries. */
	recordEvent(sessionId: number, ts: number, category: DropCategory): void {
		this.db
			.insert(disconnectEvents)
			.values({ sessionId, ts, category })
			.run();
	}

	/** Category tallies for one session (the whole-session total). */
	countsForSession(sessionId: number): DisconnectCounts {
		const s = this.getForSession(sessionId);
		if (!s) return zeroCounts();
		return {
			quit: s.quit,
			crash: s.crash,
			timeout: s.timeout,
			kick: s.kick,
			other: s.other,
		};
	}

	/** Category tallies for drops within [from, to] of a session (via events). */
	countsInRange(sessionId: number, from: number, to: number): DisconnectCounts {
		const rows = this.db
			.select({ category: disconnectEvents.category, c: count() })
			.from(disconnectEvents)
			.where(
				and(
					eq(disconnectEvents.sessionId, sessionId),
					gte(disconnectEvents.ts, from),
					lte(disconnectEvents.ts, to),
				),
			)
			.groupBy(disconnectEvents.category)
			.all();

		const out = zeroCounts();
		for (const row of rows) {
			if (row.category in out) out[row.category as DropCategory] = row.c;
		}
		return out;
	}

	getForSession(sessionId: number): DisconnectSession | null {
		const row = this.db
			.select({ session: serverSessions, counts: sessionDisconnects })
			.from(sessionDisconnects)
			.innerJoin(
				serverSessions,
				eq(sessionDisconnects.sessionId, serverSessions.id),
			)
			.where(eq(sessionDisconnects.sessionId, sessionId))
			.get();
		return row ? toApi(row) : null;
	}

	listRecent(limit = 30): DisconnectSession[] {
		return this.db
			.select({ session: serverSessions, counts: sessionDisconnects })
			.from(sessionDisconnects)
			.innerJoin(
				serverSessions,
				eq(sessionDisconnects.sessionId, serverSessions.id),
			)
			.orderBy(desc(serverSessions.startedAt))
			.limit(limit)
			.all()
			.map(toApi);
	}
}

export function createDisconnectsRepository(db: DB) {
	return DisconnectsRepository.getInstance(db);
}
