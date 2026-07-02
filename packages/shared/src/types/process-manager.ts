export type ProcessState =
	| 'running'
	| 'starting'
	| 'stopping'
	| 'stopped'
	| 'crashed';

export interface ServerState {
	status: ProcessState;
	startedAt: Date | null;
	version: string | null;
}

export interface ProcessOutputLine {
	line: string;
	source: 'stdout' | 'stderr';
	ts: number;
	/** Monotonic per core process; stable render key + duplicate detection */
	seq: number;
}
