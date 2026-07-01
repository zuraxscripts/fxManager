import type { PerfSnapshot, PerfThread } from '@fxmanager/shared/types';
import { BANDS } from './perf-buckets';

export type PerfInspect =
	| { kind: 'point'; snapshot: PerfSnapshot }
	| { kind: 'range'; snapshots: PerfSnapshot[]; start: number; end: number };

/** Sum tick counts across a pool of snapshots for one thread → per-band
 * fractions + total ticks. Returns null when the pool has no ticks. */
export function aggregateBuckets(
	pool: PerfSnapshot[],
	thread: PerfThread,
): { frac: number[]; totalTicks: number } | null {
	const ticks = new Array<number>(BANDS).fill(0);
	let total = 0;
	for (const s of pool) {
		const c = s.threads[thread];
		if (!c) continue;
		let prev = 0;
		for (let b = 0; b < BANDS; b++) {
			const cum = c.buckets[b] ?? prev;
			ticks[b] += cum - prev;
			prev = cum;
		}
		total += c.count || 0;
	}
	if (total <= 0) return null;
	return { frac: ticks.map((t) => t / total), totalTicks: total };
}

/** De-cumulate one snapshot+thread's cumulative buckets into per-band tick
 * fractions (each in [0,1], summing to ~1). Returns all-zero if no ticks. */
export function bandFractions(snapshot: PerfSnapshot, thread: PerfThread): number[] {
	const t = snapshot.threads[thread];
	const out = new Array<number>(BANDS).fill(0);
	if (!t || !t.count) return out;
	let prev = 0;
	for (let i = 0; i < BANDS; i++) {
		const cumulative = t.buckets[i] ?? prev;
		out[i] = (cumulative - prev) / t.count;
		prev = cumulative;
	}
	return out;
}

export interface PerfChartData {
	/** unix SECONDS (uPlot x scale) */
	time: number[];
	players: number[];
	/** [snapshotIdx][band] raw fraction — for the hover tooltip */
	fractions: number[][];
	/** [band][snapshotIdx] cumulative fraction (band b = sum of fractions 0..b) */
	stacked: number[][];
}

export function buildPerfChartData(
	snapshots: PerfSnapshot[],
	thread: PerfThread,
): PerfChartData {
	const time = snapshots.map((s) => Math.round(s.ts / 1000));
	const players = snapshots.map((s) => s.players);
	const fractions = snapshots.map((s) => bandFractions(s, thread));

	const stacked: number[][] = Array.from({ length: BANDS }, () =>
		new Array<number>(snapshots.length).fill(0),
	);
	for (let i = 0; i < snapshots.length; i++) {
		let acc = 0;
		for (let b = 0; b < BANDS; b++) {
			acc += fractions[i]?.[b] ?? 0;
			stacked[b][i] = acc;
		}
	}
	return { time, players, fractions, stacked };
}
