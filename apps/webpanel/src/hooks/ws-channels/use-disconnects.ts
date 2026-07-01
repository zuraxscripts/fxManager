import { useEffect, useState } from 'react';
import type { DisconnectSession } from '@fxmanager/shared/types';
import { useWSBase } from './use-ws-core';

/** Subscribes to the `disconnects` channel: seeds from the live session then
 * updates on each drop broadcast. */
export function useDisconnectsSocket() {
	const { subscribe, unsubscribe, on } = useWSBase();
	const [live, setLive] = useState<DisconnectSession | null>(null);

	useEffect(() => {
		subscribe('disconnects');

		const offInitial = on<DisconnectSession | null>(
			'disconnects',
			'initial',
			({ data }) => setLive(data),
		);
		const offUpdate = on<DisconnectSession>(
			'disconnects',
			'update',
			({ data }) => setLive(data),
		);

		return () => {
			offInitial();
			offUpdate();
			unsubscribe('disconnects');
		};
	}, [subscribe, unsubscribe, on]);

	return { live };
}
