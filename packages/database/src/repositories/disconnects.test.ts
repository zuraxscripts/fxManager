/** biome-ignore-all lint/suspicious/noExplicitAny: explicit any allows clearing private singletons */
import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import { migrations, runMigrations } from '../migrations';
import { createDisconnectsRepository } from './disconnects';
import { createServerSessionsRepository } from './server-sessions';

describe('DisconnectsRepository', () => {
	const logSpy = spyOn(console, 'log').mockImplementation(() => {});

	let testSqlite: Database;
	let testDb: ReturnType<typeof drizzle<typeof schema>>;
	let repo: ReturnType<typeof createDisconnectsRepository>;
	let sessions: ReturnType<typeof createServerSessionsRepository>;

	beforeEach(() => {
		logSpy.mockClear();

		// Reset singleton cache instances to ensure total database isolation
		const zeroDisconnects = createDisconnectsRepository({} as any);
		(zeroDisconnects.constructor as any).instance = undefined;
		const zeroSessions = createServerSessionsRepository({} as any);
		(zeroSessions.constructor as any).instance = undefined;

		testSqlite = new Database(':memory:');
		testSqlite.run('PRAGMA foreign_keys = ON;');
		runMigrations(testSqlite, migrations);

		testDb = drizzle(testSqlite, { schema });
		repo = createDisconnectsRepository(testDb);
		sessions = createServerSessionsRepository(testDb);
	});

	afterAll(() => {
		logSpy.mockRestore();
	});

	it('opens a disconnects row for a session with zeroed counters', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		const got = repo.getForSession(s.id)!;
		expect(got.id).toBe(s.id);
		expect(got.startedAt).toBe(1000);
		expect(got.endedAt).toBeNull();
		expect(got.quit + got.crash + got.timeout + got.kick + got.other).toBe(0);
	});

	it('openForSession is idempotent (no duplicate rows / no reset)', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		repo.bump(s.id, 'crash');
		repo.openForSession(s.id);
		expect(repo.getForSession(s.id)!.crash).toBe(1);
	});

	it('bumps a category counter', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		repo.bump(s.id, 'crash');
		repo.bump(s.id, 'crash');
		repo.bump(s.id, 'quit');
		const got = repo.getForSession(s.id)!;
		expect(got.crash).toBe(2);
		expect(got.quit).toBe(1);
	});

	it('getForSession reflects the joined session times', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		sessions.close(s.id, 'crashed', new Date(5000));
		const got = repo.getForSession(s.id)!;
		expect(got.startedAt).toBe(1000);
		expect(got.endedAt).toBe(5000);
	});

	it('getForSession returns null for an unknown session', () => {
		expect(repo.getForSession(999)).toBeNull();
	});

	it('listRecent returns newest first with counts', () => {
		const a = sessions.open(new Date(1000));
		const b = sessions.open(new Date(3000));
		const c = sessions.open(new Date(2000));
		repo.openForSession(a.id);
		repo.openForSession(b.id);
		repo.openForSession(c.id);
		repo.bump(b.id, 'kick');
		const list = repo.listRecent(10);
		expect(list.map((s) => s.startedAt)).toEqual([3000, 2000, 1000]);
		expect(list[0].kick).toBe(1);
	});

	it('countsForSession returns the whole-session tallies', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		repo.bump(s.id, 'quit');
		repo.bump(s.id, 'crash');
		repo.bump(s.id, 'quit');
		expect(repo.countsForSession(s.id)).toEqual({
			quit: 2,
			crash: 1,
			timeout: 0,
			kick: 0,
			other: 0,
		});
		expect(repo.countsForSession(999)).toEqual({
			quit: 0,
			crash: 0,
			timeout: 0,
			kick: 0,
			other: 0,
		});
	});

	it('countsInRange only tallies events within [from, to]', () => {
		const s = sessions.open(new Date(1000));
		repo.openForSession(s.id);
		repo.recordEvent(s.id, 1000, 'quit');
		repo.recordEvent(s.id, 2000, 'quit');
		repo.recordEvent(s.id, 2000, 'crash');
		repo.recordEvent(s.id, 5000, 'kick'); // outside the window
		const counts = repo.countsInRange(s.id, 1500, 3000);
		expect(counts.quit).toBe(1);
		expect(counts.crash).toBe(1);
		expect(counts.kick).toBe(0);
	});
});
