import { useEffect, useMemo, useState } from 'react';
import { ChartBar } from 'lucide-react';
import type { PerfThread, ServerSession } from '@fxmanager/shared/types';
import { PageHeader } from '@/components/page-header';
import { FullPerfChart } from './components/full-perf-chart';
import { PerfDistribution } from './components/perf-distribution';
import { DisconnectDonut } from './components/disconnect-donut';
import { PerfStatsGrid } from './components/process-stats';
import type { PerfInspect } from './components/perf-series';
import { QueryService } from '@/lib/query';
import { usePerfSocket } from '@/hooks/ws-channels/use-perf';

export default function PerformancePage() {
	const { samples } = usePerfSocket();

	// The performance chart is the single source of truth for session, thread and
	// zoom — the donut + distribution + stat cards all follow it.
	const [thread, setThread] = useState<PerfThread>('svMain');
	const [sessions, setSessions] = useState<ServerSession[]>([]);
	const [pickedId, setPickedId] = useState<number | null>(null);
	const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null);
	const [inspect, setInspect] = useState<PerfInspect | null>(null);

	useEffect(() => {
		QueryService<ServerSession[]>({
			endpoint: '/perf/sessions?limit=50',
			method: 'GET',
		})
			.then(setSessions)
			.catch(() => setSessions([]));
	}, []);

	const defaultId = useMemo(() => {
		const live = sessions.find((s) => s.endedAt === null);
		return live?.id ?? sessions[0]?.id ?? null;
	}, [sessions]);

	const selectedId = pickedId ?? defaultId;
	const selected = sessions.find((s) => s.id === selectedId) ?? null;
	const isLive = selected?.endedAt === null;

	// Clear zoom + inspection when the session changes — but NOT on live appends.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on session swap only
	useEffect(() => {
		setZoom(null);
		setInspect(null);
	}, [selectedId]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
			<PageHeader
				Icon={ChartBar}
				title="Performance"
				description="Monitor fxServer thread distribution and system resource usage."
			/>

			<PerfStatsGrid samples={samples} inspect={inspect} />

			<div className="grid gap-6 lg:grid-cols-2">
				<DisconnectDonut
					sessionId={selectedId}
					session={selected}
					isLive={isLive}
					zoom={zoom}
				/>
				<PerfDistribution samples={samples} inspect={inspect} thread={thread} />
			</div>

			<div className="flex min-h-[360px] flex-1 flex-col">
				<FullPerfChart
					thread={thread}
					onThreadChange={setThread}
					sessions={sessions}
					selectedId={selectedId}
					onSelect={setPickedId}
					zoom={zoom}
					onZoomChange={setZoom}
					onInspect={setInspect}
				/>
			</div>
		</div>
	);
}
