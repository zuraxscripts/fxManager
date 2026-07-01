import type { Migration } from '../types';

export const m0004_disconnect_sessions: Migration = {
	version: 4,
	description: 'Add server_sessions + session_disconnects + perf_snapshots',
	up: [
		`CREATE TABLE \`server_sessions\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`started_at\` integer NOT NULL,
	\`ended_at\` integer,
	\`close_reason\` text
)`,
		`CREATE INDEX \`server_session_started_idx\` ON \`server_sessions\` (\`started_at\`)`,
		`CREATE TABLE \`session_disconnects\` (
	\`session_id\` integer PRIMARY KEY NOT NULL,
	\`quit\` integer DEFAULT 0 NOT NULL,
	\`crash\` integer DEFAULT 0 NOT NULL,
	\`timeout\` integer DEFAULT 0 NOT NULL,
	\`kick\` integer DEFAULT 0 NOT NULL,
	\`other\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`session_id\`) REFERENCES \`server_sessions\`(\`id\`) ON UPDATE no action ON DELETE cascade
)`,
		`CREATE TABLE \`perf_snapshots\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`session_id\` integer NOT NULL,
	\`ts\` integer NOT NULL,
	\`players\` integer DEFAULT 0 NOT NULL,
	\`fxs_memory\` integer,
	\`node_memory\` integer,
	\`perf\` text NOT NULL,
	FOREIGN KEY (\`session_id\`) REFERENCES \`server_sessions\`(\`id\`) ON UPDATE no action ON DELETE cascade
)`,
		`CREATE INDEX \`perf_snapshot_session_ts_idx\` ON \`perf_snapshots\` (\`session_id\`,\`ts\`)`,
	],
};
