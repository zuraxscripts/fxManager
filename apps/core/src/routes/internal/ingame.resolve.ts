import type { OnlinePlayer, PlayerIdentifiers } from '@fxmanager/shared/types';

export type IngameTarget =
	| number
	| { serverId: number }
	| { playerId: number }
	| { identifiers: Partial<PlayerIdentifiers> };

export interface ResolvedTarget {
	playerId: number;
	onlinePlayer?: OnlinePlayer;
}

export interface TargetDeps {
	onlineByServerId: (serverId: number) => OnlinePlayer | undefined;
	onlineByPlayerId: (playerId: number) => OnlinePlayer | undefined;
	playerIdByIdentifiers: (
		identifiers: Partial<PlayerIdentifiers>,
	) => number | null;
}

export function resolveTarget(
	target: IngameTarget,
	deps: TargetDeps,
): ResolvedTarget | null {
	if (typeof target === 'number' || 'serverId' in target) {
		const serverId = typeof target === 'number' ? target : target.serverId;
		const online = deps.onlineByServerId(serverId);
		return online ? { playerId: online.id, onlinePlayer: online } : null;
	}

	if ('playerId' in target) {
		return {
			playerId: target.playerId,
			onlinePlayer: deps.onlineByPlayerId(target.playerId),
		};
	}

	const playerId = deps.playerIdByIdentifiers(target.identifiers);
	if (playerId === null) return null;
	return { playerId, onlinePlayer: deps.onlineByPlayerId(playerId) };
}

export interface ActingAdmin {
	id: number;
	username: string;
}

export interface IssuerDeps {
	onlineByServerId: (serverId: number) => OnlinePlayer | undefined;
	adminByPlayerId: (playerId: number) => ActingAdmin | null;
}

export function resolveIssuer(
	by: number | undefined,
	deps: IssuerDeps,
): ActingAdmin | null {
	if (by === undefined || by === null) return null;
	const player = deps.onlineByServerId(by);
	if (!player) return null;
	return deps.adminByPlayerId(player.id);
}

export function resolveExpiry(
	input: { expiresAt?: string | null; durationSeconds?: number },
	now: Date,
): Date | null {
	if (input.durationSeconds != null && input.durationSeconds > 0) {
		return new Date(now.getTime() + input.durationSeconds * 1000);
	}
	if (input.expiresAt) return new Date(input.expiresAt);
	return null;
}
