import { PlayerUpdatePackage } from '@fxmanager/shared/types';
import { QueryManager } from '../utils/query';

class PlayerManager {
	private players: Map<string, { permissions: number }> = new Map();

	constructor() {
		this.sendUpdates();
	}

	addPlayer(source: number, permissions: number = 0) {
		this.players.set(`${source}`, { permissions });
	}

	removePlayer(source: number) {
		this.players.delete(`${source}`);
	}

	private sendUpdates() {
		setInterval(() => {
			const updatePacket: PlayerUpdatePackage = {};

			for (const src of this.players.keys()) {
				const ped = GetPlayerPed(src);
				const health = GetEntityHealth(ped);
				const ping = GetPlayerPing(src);

				updatePacket[src] = [health, ping];
			}

			QueryManager({
				endpoint: '/players/update',
				method: 'POST',
				body: { payload: updatePacket },
			});
		});
	}
}

export const playerManager = new PlayerManager();
