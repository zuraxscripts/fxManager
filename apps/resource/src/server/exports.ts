import { ACE_PREFIX } from '@fxmanager/shared/constants';
import type { PlayerIdentifiers } from '@fxmanager/shared/types';
import { QueryManager } from './utils/query';

type Target =
	| number
	| { serverId: number }
	| { playerId: number }
	| { identifiers: Partial<PlayerIdentifiers> };

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(
	endpoint: string,
	method: 'GET' | 'POST',
	body?: unknown,
): Promise<Result<T>> {
	try {
		const data = await QueryManager<T>({ endpoint, method, body });
		return { ok: true, data };
	} catch (err) {
		return { ok: false, error: (err as Error).message };
	}
}

function pageQuery(opts?: { page?: number; pageSize?: number }): URLSearchParams {
	const params = new URLSearchParams();
	if (opts?.page) params.set('page', String(opts.page));
	if (opts?.pageSize) params.set('pageSize', String(opts.pageSize));
	return params;
}

function lookupQuery(target: Target): string {
	const params = new URLSearchParams();
	if (typeof target === 'number') params.set('serverId', String(target));
	else if ('serverId' in target)
		params.set('serverId', String(target.serverId));
	else if ('playerId' in target)
		params.set('playerId', String(target.playerId));
	else if (target.identifiers.license)
		params.set('license', target.identifiers.license);
	return params.toString();
}

exports(
	'hasPermission',
	(playerId: number | string, permissionKey: string): boolean => {
		if (typeof permissionKey !== 'string' || permissionKey.length === 0)
			return false;

		return IsPlayerAceAllowed(
			String(playerId),
			`${ACE_PREFIX}.${permissionKey}`,
		);
	},
);

exports('recentBans', (opts?: { page?: number; pageSize?: number }) => {
	const qs = pageQuery(opts).toString();
	return call(`/ingame/bans${qs ? `?${qs}` : ''}`, 'GET');
});

exports(
	'searchBans',
	(query: string, opts?: { page?: number; pageSize?: number }) => {
		const params = pageQuery(opts);
		if (query) params.set('q', query);
		return call(`/ingame/bans/search?${params.toString()}`, 'GET');
	},
);

exports('fetchPlayers', () => call('/ingame/players', 'GET'));

exports('getPlayer', (target: Target) =>
	call(`/ingame/players/lookup?${lookupQuery(target)}`, 'GET'),
);

exports(
	'ban',
	(input: {
		target: Target;
		reason: string;
		expiresAt?: string | null;
		durationSeconds?: number;
		by?: number;
	}) => call('/ingame/bans', 'POST', { ...input, resource: GetInvokingResource() }),
);

exports('revokeBan', (banId: number, opts?: { by?: number }) =>
	call(`/ingame/bans/${banId}/revoke`, 'POST', {
		...opts,
		resource: GetInvokingResource(),
	}),
);

exports('kick', (input: { target: Target; reason: string; by?: number }) =>
	call('/ingame/kick', 'POST', { ...input, resource: GetInvokingResource() }),
);

exports('warnPlayer', (input: { target: Target; reason: string; by?: number }) =>
	call('/ingame/warn', 'POST', { ...input, resource: GetInvokingResource() }),
);

exports(
	'searchPlayers',
	(
		query: string,
		opts?: {
			page?: number;
			pageSize?: number;
			sortBy?: 'playtime' | 'lastSeen' | 'firstSeen';
			sortOrder?: 'asc' | 'desc';
		},
	) => {
		const params = pageQuery(opts);
		if (query) params.set('q', query);
		if (opts?.sortBy) params.set('sortBy', opts.sortBy);
		if (opts?.sortOrder) params.set('sortOrder', opts.sortOrder);
		return call(`/ingame/players/search?${params.toString()}`, 'GET');
	},
);

exports(
	'addNote',
	(input: { target: Target; content: string; by: number }) =>
		call('/ingame/notes', 'POST', { ...input, resource: GetInvokingResource() }),
);

exports(
	'whitelistAdd',
	(input: { type: string; value: string; by?: number }) =>
		call('/ingame/whitelist', 'POST', {
			...input,
			resource: GetInvokingResource(),
		}),
);

exports(
	'whitelistRemove',
	(input: { type: string; value: string; by?: number }) =>
		call('/ingame/whitelist/remove', 'POST', {
			...input,
			resource: GetInvokingResource(),
		}),
);

exports('serverStart', (by?: number) =>
	call('/ingame/server/start', 'POST', { by, resource: GetInvokingResource() }),
);

exports('serverStop', (by?: number) =>
	call('/ingame/server/stop', 'POST', { by, resource: GetInvokingResource() }),
);

exports('serverRestart', (by?: number) =>
	call('/ingame/server/restart', 'POST', {
		by,
		resource: GetInvokingResource(),
	}),
);
