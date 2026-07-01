import { useEffect, useState } from 'react';
import type {
	PerfSeriesResponse,
	PerfSnapshot,
} from '@fxmanager/shared/types';
import { QueryService } from '@/lib/query';
import { useWSBase } from './use-ws-core';

/** Insert a snapshot into a ts-sorted list, replacing any sample with the same
 * timestamp. */
function upsert(list: PerfSnapshot[], snap: PerfSnapshot): PerfSnapshot[] {
	const next = list.filter((s) => s.ts !== snap.ts);
	next.push(snap);
	next.sort((a, b) => a.ts - b.ts);
	return next;
}

/**
 * Loads the stored perf series for a session, then (when it is the live
 * session) appends each `sample` broadcast from the `perf` channel.
 */
export function usePerfSeries(sessionId: number | null, isLive: boolean) {
	const { subscribe, unsubscribe, on } = useWSBase();
	const [snapshots, setSnapshots] = useState<PerfSnapshot[]>([]);

	useEffect(() => {
		if (sessionId === null) {
			setSnapshots([]);
			return;
		}

		let active = true;
		QueryService<PerfSeriesResponse>({
			endpoint: `/perf/sessions/${sessionId}`,
			method: 'GET',
		})
			.then((res) => {
				if (!active) return;
				const sorted = [...res.snapshots].sort((a, b) => a.ts - b.ts);
				setSnapshots(sorted);
			})
			.catch(() => {
				if (active) setSnapshots([]);
			});

		return () => {
			active = false;
		};
	}, [sessionId]);

	useEffect(() => {
		if (!isLive) return;
		subscribe('perf');

		const offSample = on<PerfSnapshot>('perf', 'sample', ({ data }) => {
			setSnapshots((prev) => upsert(prev, data));
		});

		return () => {
			offSample();
			unsubscribe('perf');
		};
	}, [isLive, subscribe, unsubscribe, on]);

	return { snapshots };
}
