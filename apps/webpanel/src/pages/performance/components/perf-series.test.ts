import { describe, expect, it } from 'bun:test';
import type {
	PerfSnapshot,
	PerfThreadCounts,
	RawPerf,
} from '@fxmanager/shared/types';
import { BANDS } from './perf-buckets';
import { bandFractions, buildPerfChartData } from './perf-series';

/** Build a 15-length cumulative buckets array from per-band tick counts. */
function cumulative(perBand: number[]): number[] {
	const out: number[] = [];
	let acc = 0;
	for (let i = 0; i < BANDS; i++) {
		acc += perBand[i] ?? 0;
		out.push(acc);
	}
	return out;
}

function thread(count: number, perBand: number[]): PerfThreadCounts {
	return { count, sum: 0, buckets: cumulative(perBand) };
}

function snapshot(
	ts: number,
	players: number,
	main: PerfThreadCounts,
): PerfSnapshot {
	const empty: PerfThreadCounts = { count: 0, sum: 0, buckets: [] };
	const threads: RawPerf = { svMain: main, svSync: empty, svNetwork: empty };
	return { ts, players, threads };
}

describe('bandFractions', () => {
	it('de-cumulates cumulative buckets into per-band fractions', () => {
		// 4 bands populated: 2, 3, 0, 5; rest zero. count = 10.
		const perBand = [2, 3, 0, 5];
		const snap = snapshot(1_000, 7, thread(10, perBand));

		const frac = bandFractions(snap, 'svMain');

		expect(frac).toHaveLength(BANDS);
		expect(frac[0]).toBeCloseTo(0.2);
		expect(frac[1]).toBeCloseTo(0.3);
		expect(frac[2]).toBeCloseTo(0);
		expect(frac[3]).toBeCloseTo(0.5);
		for (let i = 4; i < BANDS; i++) expect(frac[i]).toBeCloseTo(0);
		// fractions sum to ~1
		expect(frac.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
	});

	it('returns all zeros when the thread has no ticks', () => {
		const snap = snapshot(1_000, 0, thread(0, []));
		const frac = bandFractions(snap, 'svMain');
		expect(frac).toHaveLength(BANDS);
		expect(frac.every((v) => v === 0)).toBe(true);
	});

	it('returns all zeros for a thread not present in the snapshot', () => {
		const snap = snapshot(1_000, 3, thread(10, [10]));
		// svSync is the empty (count 0) thread here.
		const frac = bandFractions(snap, 'svSync');
		expect(frac.every((v) => v === 0)).toBe(true);
	});
});

describe('buildPerfChartData', () => {
	it('converts ts to unix seconds and passes players through', () => {
		const snaps = [
			snapshot(1_000, 4, thread(10, [10])),
			snapshot(31_500, 9, thread(20, [20])),
		];
		const cd = buildPerfChartData(snaps, 'svMain');
		expect(cd.time).toEqual([1, 32]); // 31_500/1000 rounds to 32
		expect(cd.players).toEqual([4, 9]);
	});

	it('produces a full stacked band curve summing to ~1 when count > 0', () => {
		const snaps = [
			snapshot(1_000, 4, thread(10, [2, 3, 0, 5])),
			snapshot(31_000, 9, thread(4, [1, 0, 3])),
		];
		const cd = buildPerfChartData(snaps, 'svMain');

		expect(cd.stacked).toHaveLength(BANDS);
		for (let i = 0; i < snaps.length; i++) {
			// top band == full cumulative ~= 1
			expect(cd.stacked[BANDS - 1][i]).toBeCloseTo(1);
			// cumulative & non-decreasing down the column
			for (let b = 1; b < BANDS; b++) {
				expect(cd.stacked[b][i]).toBeGreaterThanOrEqual(cd.stacked[b - 1][i]);
			}
			// band b equals sum of fractions 0..b
			let acc = 0;
			for (let b = 0; b < BANDS; b++) {
				acc += cd.fractions[i][b];
				expect(cd.stacked[b][i]).toBeCloseTo(acc);
			}
		}
	});

	it('keeps the stacked top band at 0 when a snapshot has no ticks', () => {
		const snaps = [snapshot(1_000, 0, thread(0, []))];
		const cd = buildPerfChartData(snaps, 'svMain');
		expect(cd.stacked[BANDS - 1][0]).toBeCloseTo(0);
	});
});
