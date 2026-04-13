// Subscribes to a channel and lets you listen to specific events,
// keeping state updated automatically.
import { useEffect, useState } from 'react';
import { useWS } from './use-ws';
import type { Channel, WSMessage } from '@fxmanager/shared/types';

export function useWsChannel<T>(
	channel: Channel,
	event: string,
	initial: T,
): T {
	const { subscribe, unsubscribe, on } = useWS();
	const [state, setState] = useState<T>(initial);

	useEffect(() => {
		subscribe(channel);

		const off = on<T>(channel, event, (msg: WSMessage<T>) => {
			setState(msg.data);
		});

		return () => {
			off();
			unsubscribe(channel);
		};
	}, [channel, event]);

	return state;
}
