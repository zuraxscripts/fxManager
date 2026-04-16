import { useEffect, useState } from 'react';
import { useWSBase } from './use-ws-core';
import type { OnlinePlayer } from '@fxmanager/shared/types';

interface UsePlayerlistReturn {
	players: OnlinePlayer[];
	getPlayer: (id: number) => OnlinePlayer | undefined;
	count: number;
}

export function usePlayerlistSocket(): UsePlayerlistReturn {
	const { subscribe, unsubscribe, on } = useWSBase();
	const [players, setPlayers] = useState<OnlinePlayer[]>([]);

	useEffect(() => {
		subscribe('playerlist');

		// Full list sync (sent on subscribe + periodically)
		const offSync = on<OnlinePlayer[]>('playerlist', 'sync', (msg) => {
			setPlayers(msg.data);
		});

		// Incremental updates
		const offJoin = on<OnlinePlayer>('playerlist', 'player_joined', (msg) => {
			setPlayers((prev) => [...prev, msg.data]);
		});

		const offLeave = on<{ id: number }>('playerlist', 'player_left', (msg) => {
			setPlayers((prev) => prev.filter((p) => p.id !== msg.data.id));
		});

		const offUpdate = on<OnlinePlayer>(
			'playerlist',
			'player_updated',
			(msg) => {
				setPlayers((prev) =>
					prev.map((p) => (p.id === msg.data.id ? { ...p, ...msg.data } : p)),
				);
			},
		);

		return () => {
			offSync();
			offJoin();
			offLeave();
			offUpdate();
			unsubscribe('playerlist');
		};
	}, []);

	return {
		players,
		getPlayer: (id) => players.find((p) => p.id === id),
		count: players.length,
	};
}
