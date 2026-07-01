import { useEffect, useState } from 'react';
import {
	DISCONNECT_CATEGORIES,
	type DisconnectCounts,
	type ServerSession,
} from '@fxmanager/shared/types';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fxmanager/ui/components/card';
import { PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { QueryService } from '@/lib/query';
import { useDisconnectsSocket } from '@/hooks/ws-channels/use-disconnects';

const RADIUS = 44;
const STROKE = 16;
const CIRC = 2 * Math.PI * RADIUS;
const ZERO: DisconnectCounts = { quit: 0, crash: 0, timeout: 0, kick: 0, other: 0 };

export function DisconnectDonut({
	sessionId,
	session,
	isLive,
	zoom,
}: {
	sessionId: number | null;
	session: ServerSession | null;
	isLive: boolean;
	zoom: { start: number; end: number } | null;
}) {
	const { live } = useDisconnectsSocket();
	const [fetched, setFetched] = useState<DisconnectCounts | null>(null);

	useEffect(() => {
		if (sessionId == null) {
			setFetched(null);
			return;
		}
		const q = zoom
			? `?from=${Math.floor(zoom.start)}&to=${Math.ceil(zoom.end)}`
			: '';
		let cancelled = false;
		QueryService<DisconnectCounts>({
			endpoint: `/disconnects/sessions/${sessionId}${q}`,
			method: 'GET',
		})
			.then((c) => {
				if (!cancelled) setFetched(c);
			})
			.catch(() => {
				if (!cancelled) setFetched(null);
			});
		return () => {
			cancelled = true;
		};
	}, [sessionId, zoom]);

	// Live session, unzoomed → the real-time WS running total; else the fetched
	// counts (a whole-session total or a zoomed slice).
	const counts: DisconnectCounts =
		isLive && !zoom && live && live.id === sessionId
			? {
					quit: live.quit,
					crash: live.crash,
					timeout: live.timeout,
					kick: live.kick,
					other: live.other,
				}
			: (fetched ?? ZERO);

	const total = DISCONNECT_CATEGORIES.reduce((s, c) => s + counts[c.key], 0);

	const scope = zoom
		? `${format(new Date(zoom.start), 'HH:mm')} – ${format(new Date(zoom.end), 'HH:mm')}`
		: session
			? session.endedAt === null
				? 'this session'
				: 'this restart'
			: 'this session';

	let offset = 0;
	const segments =
		total > 0
			? DISCONNECT_CATEGORIES.map((cat) => {
					const value = counts[cat.key];
					const len = (value / total) * CIRC;
					const seg = {
						key: cat.key,
						color: cat.color,
						dash: `${len} ${CIRC - len}`,
						offset: -offset,
					};
					offset += len;
					return seg;
				}).filter((_, i) => counts[DISCONNECT_CATEGORIES[i].key] > 0)
			: [];

	return (
		<Card>
			<CardHeader className="space-y-1.5">
				<CardTitle className="flex items-center gap-2">
					<PieChart className="h-4 w-4" />
					Disconnect reasons
				</CardTitle>
				<CardDescription>
					{total > 0
						? `${total.toLocaleString()} disconnects · ${scope}`
						: `Why players left · ${scope}`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{total === 0 ? (
					<div className="flex h-[180px] items-center justify-center text-center text-sm text-muted-foreground">
						No disconnects in {zoom ? 'this window' : 'this session'} yet.
					</div>
				) : (
					<div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
						<svg
							role="img"
							aria-label="Disconnect reasons breakdown"
							width={2 * (RADIUS + STROKE / 2)}
							height={2 * (RADIUS + STROKE / 2)}
							viewBox={`0 0 ${2 * (RADIUS + STROKE / 2)} ${2 * (RADIUS + STROKE / 2)}`}
							className="shrink-0"
						>
							<title>Disconnect reasons breakdown</title>
							<g
								transform={`translate(${RADIUS + STROKE / 2}, ${RADIUS + STROKE / 2}) rotate(-90)`}
							>
								{segments.map((seg) => (
									<circle
										key={seg.key}
										r={RADIUS}
										fill="none"
										stroke={seg.color}
										strokeWidth={STROKE}
										strokeDasharray={seg.dash}
										strokeDashoffset={seg.offset}
									/>
								))}
							</g>
							<text
								x="50%"
								y="50%"
								textAnchor="middle"
								dominantBaseline="central"
								className="fill-foreground text-2xl font-semibold tabular-nums"
							>
								{total}
							</text>
						</svg>
						<div className="w-full max-w-[240px] space-y-2">
							{DISCONNECT_CATEGORIES.map((cat) => {
								const value = counts[cat.key];
								const pct = total > 0 ? (value / total) * 100 : 0;
								return (
									<div
										key={cat.key}
										className="flex items-center gap-2 text-sm"
									>
										<span
											className="h-3 w-3 shrink-0 rounded-sm"
											style={{ backgroundColor: cat.color }}
										/>
										<span className="flex-1">{cat.label}</span>
										<span className="tabular-nums text-muted-foreground">
											{value}
										</span>
										<span className="w-12 text-right tabular-nums">
											{pct.toFixed(1)}%
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
