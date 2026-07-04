import { describe, expect, it } from 'bun:test';
import type { OnlinePlayer } from '@fxmanager/shared/types';
import { resolveTarget, resolveIssuer, resolveExpiry } from './ingame.resolve';

const online = (id: number, serverId: number): OnlinePlayer => ({
	id,
	serverId,
	name: `p${id}`,
	playtime: 0,
	identifiers: { license: `license:${id}` },
	isStaff: false,
	firstSeen: new Date(0),
	lastSeen: new Date(0),
	health: 100,
});

describe('resolveTarget', () => {
	const roster = [online(10, 1), online(20, 2)];
	const deps = {
		onlineByServerId: (sid: number) => roster.find((p) => p.serverId === sid),
		onlineByPlayerId: (pid: number) => roster.find((p) => p.id === pid),
		playerIdByIdentifiers: (ids: { license?: string }) =>
			ids.license === 'license:offline' ? 99 : null,
	};

	it('resolves a bare server id to the online player', () => {
		expect(resolveTarget(1, deps)).toEqual({
			playerId: 10,
			onlinePlayer: roster[0],
		});
	});

	it('returns null for a server id that is not online', () => {
		expect(resolveTarget(777, deps)).toBeNull();
	});

	it('resolves a { serverId } object', () => {
		expect(resolveTarget({ serverId: 2 }, deps)?.playerId).toBe(20);
	});

	it('resolves a { playerId } directly, attaching the online player when present', () => {
		expect(resolveTarget({ playerId: 20 }, deps)).toEqual({
			playerId: 20,
			onlinePlayer: roster[1],
		});
	});

	it('resolves a { playerId } that is offline (no online player attached)', () => {
		const result = resolveTarget({ playerId: 55 }, deps);
		expect(result?.playerId).toBe(55);
		expect(result?.onlinePlayer).toBeUndefined();
	});

	it('resolves { identifiers } via a known player, even when offline', () => {
		const result = resolveTarget(
			{ identifiers: { license: 'license:offline' } },
			deps,
		);
		expect(result?.playerId).toBe(99);
		expect(result?.onlinePlayer).toBeUndefined();
	});

	it('returns null when identifiers match no known player', () => {
		expect(
			resolveTarget({ identifiers: { license: 'license:ghost' } }, deps),
		).toBeNull();
	});
});

describe('resolveIssuer', () => {
	const roster = [online(10, 1)];
	const deps = {
		onlineByServerId: (sid: number) => roster.find((p) => p.serverId === sid),
		adminByPlayerId: (pid: number) =>
			pid === 10 ? { id: 4, username: 'FjamZoo' } : null,
	};

	it('returns null when no acting server id is given', () => {
		expect(resolveIssuer(undefined, deps)).toBeNull();
	});

	it('resolves the acting server id to the linked admin', () => {
		expect(resolveIssuer(1, deps)).toEqual({ id: 4, username: 'FjamZoo' });
	});

	it('returns null when the acting player is online but not an admin', () => {
		const noAdmin = { ...deps, adminByPlayerId: () => null };
		expect(resolveIssuer(1, noAdmin)).toBeNull();
	});

	it('returns null when the acting server id is not online', () => {
		expect(resolveIssuer(999, deps)).toBeNull();
	});
});

describe('resolveExpiry', () => {
	const now = new Date('2026-07-03T00:00:00Z');

	it('returns null when neither expiresAt nor durationSeconds is given', () => {
		expect(resolveExpiry({}, now)).toBeNull();
	});

	it('uses expiresAt when provided', () => {
		expect(resolveExpiry({ expiresAt: '2026-08-01T00:00:00Z' }, now)).toEqual(
			new Date('2026-08-01T00:00:00Z'),
		);
	});

	it('computes expiresAt from durationSeconds relative to now', () => {
		expect(resolveExpiry({ durationSeconds: 3600 }, now)).toEqual(
			new Date('2026-07-03T01:00:00Z'),
		);
	});

	it('prefers durationSeconds over expiresAt', () => {
		expect(
			resolveExpiry(
				{ durationSeconds: 60, expiresAt: '2030-01-01T00:00:00Z' },
				now,
			),
		).toEqual(new Date('2026-07-03T00:01:00Z'));
	});

	it('ignores non-positive durationSeconds', () => {
		expect(
			resolveExpiry({ durationSeconds: 0, expiresAt: null }, now),
		).toBeNull();
	});
});
