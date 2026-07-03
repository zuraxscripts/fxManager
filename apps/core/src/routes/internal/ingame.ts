import { repo } from '@fxmanager/database';
import type { PlayerIdentifiers } from '@fxmanager/shared/types';
import { resourceAuth } from '../../middleware/resource';
import type { RouteModule } from '../../types';
import { txAdminCompat } from '../../modules/txadmin/compat';
import { buildBannedPayload } from '../../modules/txadmin/payloads';
import {
	resolveExpiry,
	resolveIssuer,
	resolveTarget,
	type IngameTarget,
} from './ingame.resolve';

function parseTarget(raw: unknown): IngameTarget | null {
	if (typeof raw === 'number') return raw;
	if (raw && typeof raw === 'object') {
		const t = raw as Record<string, unknown>;
		if (typeof t.serverId === 'number') return { serverId: t.serverId };
		if (typeof t.playerId === 'number') return { playerId: t.playerId };
		if (t.identifiers && typeof t.identifiers === 'object')
			return { identifiers: t.identifiers as Partial<PlayerIdentifiers> };
	}
	return null;
}

const parsePage = (v: unknown) =>
	typeof v === 'string' && v ? Number(v) : undefined;

const IngameEndpoints: RouteModule['handler'] = async (fastify, options) => {
	const { gm } = options;

	fastify.addHook('preHandler', resourceAuth);

	const onlineByServerId = (sid: number) =>
		gm.getPlayerList().find((p) => p.serverId === sid);

	const targetDeps = {
		onlineByServerId,
		onlineByPlayerId: (pid: number) => gm.getPlayer(pid),
		playerIdByIdentifiers: (ids: Partial<PlayerIdentifiers>) =>
			ids.license ? (repo.players.findByLicense(ids.license)?.id ?? null) : null,
	};

	const issuerDeps = {
		onlineByServerId,
		adminByPlayerId: (pid: number) => repo.admins.findByPlayerId(pid),
	};

	fastify.get('/bans', (request) => {
		const q = request.query as { page?: string; pageSize?: string };
		return repo.bans.search({
			page: parsePage(q.page),
			pageSize: parsePage(q.pageSize),
		});
	});

	fastify.get('/bans/search', (request) => {
		const q = request.query as {
			q?: string;
			page?: string;
			pageSize?: string;
		};
		return repo.bans.search({
			query: q.q,
			page: parsePage(q.page),
			pageSize: parsePage(q.pageSize),
		});
	});

	fastify.get('/players', () => gm.getPlayerList());

	fastify.get('/players/lookup', async (request, reply) => {
		const q = request.query as {
			serverId?: string;
			playerId?: string;
			license?: string;
		};

		let target: IngameTarget | null = null;
		if (q.serverId) target = { serverId: Number(q.serverId) };
		else if (q.playerId) target = { playerId: Number(q.playerId) };
		else if (q.license) target = { identifiers: { license: q.license } };

		if (!target) return reply.code(400).send({ message: 'invalid_target' });

		const resolved = resolveTarget(target, targetDeps);
		if (!resolved) return reply.code(404).send({ message: 'player_not_found' });

		const profile = await repo.players.findById(resolved.playerId);
		if (!profile) return reply.code(404).send({ message: 'player_not_found' });

		return profile;
	});

	fastify.post('/bans', async (request, reply) => {
		const body = request.body as {
			target?: unknown;
			reason?: string;
			expiresAt?: string | null;
			durationSeconds?: number;
			by?: number;
			resource?: string;
		};

		const target = parseTarget(body.target);
		if (!target) return reply.code(400).send({ message: 'invalid_target' });
		if (!body.reason || typeof body.reason !== 'string')
			return reply.code(400).send({ message: 'reason_required' });

		const resolved = resolveTarget(target, targetDeps);
		if (!resolved) return reply.code(404).send({ message: 'player_not_found' });

		const acting = resolveIssuer(body.by, issuerDeps);
		const issuer = acting?.id ?? null;
		const author = acting?.username ?? 'Ingame API';

		const expiresAt = resolveExpiry(
			{ expiresAt: body.expiresAt, durationSeconds: body.durationSeconds },
			new Date(),
		);

		try {
			const result = await repo.players.addBan(
				resolved.playerId,
				expiresAt,
				body.reason,
				issuer,
			);

			if (result === false)
				return reply.code(409).send({ message: 'active_longer_ban_exists' });

			repo.audit.log({
				adminId: issuer ?? undefined,
				action: 'player.ban',
				playerId: result.player?.id,
				metadata: {
					banId: result.id,
					expiresAt: expiresAt?.toISOString() ?? 'permanent',
					source: 'ingame-api',
					resource: body.resource ?? null,
					author,
				},
			});

			const online = resolved.onlinePlayer;
			const expiryDate = expiresAt ? expiresAt.toLocaleString() : 'Permanent';
			const kickMessage = `You have been banned from the server. Reason: ${body.reason}. Expires: ${expiryDate}`;

			if (online) await gm.dropPlayer(online.serverId, kickMessage);

			const profile =
				online ?? (await repo.players.findById(resolved.playerId));
			void txAdminCompat.emit(
				'playerBanned',
				buildBannedPayload({
					author,
					reason: body.reason,
					banId: result.id,
					expiresAt,
					targetNetId: online?.serverId ?? null,
					targetName: profile?.name ?? 'Unknown',
					identifiers: profile?.identifiers,
					kickMessage,
				}),
			);

			return { banId: result.id };
		} catch (err) {
			const error = err as Error;
			if (error.message === 'player_not_found')
				return reply.code(404).send({ message: 'player_not_found' });

			console.error('[ingame-api] ban failed:', error.message);
			return reply.code(500).send({ message: 'internal_error' });
		}
	});

	fastify.post('/bans/:id/revoke', (request, reply) => {
		const { id } = request.params as { id: string };
		const banId = parseInt(id, 10);
		const body = (request.body ?? {}) as { by?: number; resource?: string };

		const revoked = repo.bans.revoke(banId);
		if (!revoked) return reply.code(404).send({ message: 'ban_not_found' });

		const acting = resolveIssuer(body.by, issuerDeps);

		repo.audit.log({
			adminId: acting?.id ?? undefined,
			action: 'player.unban',
			playerId: revoked.playerId,
			metadata: {
				banId,
				source: 'ingame-api',
				resource: body.resource ?? null,
				author: acting?.username ?? 'Ingame API',
			},
		});

		return { banId };
	});

	fastify.post('/kick', async (request, reply) => {
		const body = request.body as {
			target?: unknown;
			reason?: string;
			by?: number;
			resource?: string;
		};

		const target = parseTarget(body.target);
		if (!target) return reply.code(400).send({ message: 'invalid_target' });
		if (!body.reason || typeof body.reason !== 'string')
			return reply.code(400).send({ message: 'reason_required' });

		const resolved = resolveTarget(target, targetDeps);
		if (!resolved) return reply.code(404).send({ message: 'player_not_found' });

		const online = resolved.onlinePlayer;
		if (!online) return reply.code(409).send({ message: 'not_online' });

		const acting = resolveIssuer(body.by, issuerDeps);
		const issuer = acting?.id ?? null;
		const author = acting?.username ?? 'Ingame API';

		try {
			const result = await repo.players.addKick(
				resolved.playerId,
				body.reason,
				issuer,
			);

			repo.audit.log({
				adminId: issuer ?? undefined,
				action: 'player.kick',
				playerId: result.player?.id,
				metadata: {
					reason: result.reason,
					source: 'ingame-api',
					resource: body.resource ?? null,
					author,
				},
			});

			const kickMessage = `You have been kicked from the server. Reason: ${body.reason}`;
			await gm.dropPlayer(online.serverId, kickMessage);

			void txAdminCompat.emit('playerKicked', {
				target: online.serverId,
				author,
				reason: body.reason,
				dropMessage: kickMessage,
			});

			return { kicked: true };
		} catch (err) {
			const error = err as Error;
			console.error('[ingame-api] kick failed:', error.message);
			return reply.code(500).send({ message: 'internal_error' });
		}
	});
};

export default {
	prefix: '/ingame',
	handler: IngameEndpoints,
} satisfies RouteModule;
