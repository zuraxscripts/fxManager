import { repo } from '@fxmanager/database';
import type {
	PerfSeriesResponse,
	PerfSnapshot,
	RawPerf,
} from '@fxmanager/shared/types';
import { sessionAuth } from '../../middleware/session';
import type { RouteModule } from '../../types';

const PerfEndpoints: RouteModule['handler'] = async (fastify) => {
	fastify.addHook('preHandler', sessionAuth);

	fastify.get('/sessions', (request) => {
		const { limit } = request.query as { limit?: string };
		const parsed = parseInt(limit ?? '50', 10);
		const n = Math.min(Math.max(Number.isNaN(parsed) ? 50 : parsed, 1), 100);
		return repo.serverSessions.listRecent(n);
	});

	fastify.get('/sessions/:id', (request) => {
		const { id } = request.params as { id: string };
		const sessionId = parseInt(id, 10);
		if (Number.isNaN(sessionId)) {
			return { sessionId: -1, snapshots: [] } satisfies PerfSeriesResponse;
		}
		const snapshots: PerfSnapshot[] = repo.perfSnapshots
			.listForSession(sessionId)
			.map((r) => ({
				ts: r.ts,
				players: r.players,
				threads: r.perf as RawPerf,
			}));
		return { sessionId, snapshots } satisfies PerfSeriesResponse;
	});
};

export default {
	prefix: '/perf',
	handler: PerfEndpoints,
} satisfies RouteModule;
