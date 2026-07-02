import { PageHeader } from '@/components/page-header';
import { useConsoleSocket, useServerStateSocket } from '@/hooks/ws-channels';
import type { ProcessOutputLine } from '@fxmanager/shared/types';
import { Button } from '@fxmanager/ui/components/button';
import { Card } from '@fxmanager/ui/components/card';
import { Input } from '@fxmanager/ui/components/input';
import { Checkbox } from '@fxmanager/ui/components/checkbox';
import { Label } from '@fxmanager/ui/components/label';
import { ScrollArea, ScrollBar } from '@fxmanager/ui/components/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@fxmanager/ui/components/select';
import Ansi from 'ansi-to-react';
import { ArrowRight, Filter, SendHorizonal, Terminal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

// biome-ignore lint/suspicious/noControlCharactersInRegex: strips ANSI color codes for filter matching
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

function LogLine({ event }: { event: ProcessOutputLine }) {
	return (
		<div className="font-mono text-sm leading-tight whitespace-pre-wrap">
			<Ansi linkify className="ansi-item">
				{event.line}
			</Ansi>
		</div>
	);
}

export default function Console() {
	const [maxLines, setMaxLines] = useState<number>(200);
	const { lines, sendCommand, clear } = useConsoleSocket({ maxLines });
	const {
		state: { status: serverStatus },
	} = useServerStateSocket();

	const viewportRef = useRef<HTMLDivElement>(null);
	const [autoScroll, setAutoScroll] = useState<boolean | 'indeterminate'>(true);
	const [input, setInput] = useState<string>('');
	const [history, setHistory] = useState<string[]>([]);
	const [histIdx, setHistIdx] = useState<number>(-1);
	const [filterOpen, setFilterOpen] = useState<boolean>(false);
	const [filter, setFilter] = useState<string>('');

	const visibleLines = useMemo(() => {
		const query = filter.trim().toLowerCase();
		if (!query) return lines;
		return lines.filter((log) =>
			log.line.replace(ANSI_PATTERN, '').toLowerCase().includes(query),
		);
	}, [lines, filter]);

	const toggleFilter = () => {
		if (filterOpen) setFilter('');
		setFilterOpen(!filterOpen);
	};

	const submit = () => {
		const cmd = input.trim();
		if (!cmd) return;
		setHistory((h) => [cmd, ...h].slice(0, 50));
		setHistIdx(-1);
		setInput('');

		if (cmd === 'clear' || cmd === 'cls') return clear();
		sendCommand(cmd);

		const el = viewportRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') return submit();
		if (e.key === 'ArrowUp') {
			const idx = Math.min(histIdx + 1, history.length - 1);
			setHistIdx(idx);
			setInput(history[idx] ?? '');
		}
		if (e.key === 'ArrowDown') {
			const idx = Math.max(histIdx - 1, -1);
			setHistIdx(idx);
			setInput(idx === -1 ? '' : history[idx]);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: visibleLines re-triggers the scroll on new output
	useEffect(() => {
		const el = viewportRef.current;
		if (!el || autoScroll !== true) return;
		el.scrollTop = el.scrollHeight;
	}, [visibleLines, autoScroll]);

	return (
		<div className="flex h-full flex-col gap-4">
			<PageHeader Icon={Terminal} title="Console" />

			<Card className="flex flex-1 flex-col min-h-0 pb-0 overflow-hidden gap-0.5">
				{filterOpen && (
					<div className="flex flex-none items-center gap-2 border-b px-3 pb-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<Input
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Filter output..."
							className="flex-1 border-0 bg-transparent font-mono text-sm shadow-none outline-none focus-visible:ring-0"
						/>
						{filter.trim() && (
							<span className="text-xs text-muted-foreground whitespace-nowrap">
								{visibleLines.length}/{lines.length}
							</span>
						)}
						<Button
							size="icon"
							variant="ghost"
							onClick={toggleFilter}
							className="h-7 w-7 text-muted-foreground"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}
				<ScrollArea className="flex-1 min-h-0" viewportRef={viewportRef}>
					<div className="p-4 font-mono text-xs leading-relaxed">
						{lines.length === 0 ? (
							<p className="text-muted-foreground text-center py-4">
								No output yet. Start the server to see logs.
							</p>
						) : visibleLines.length === 0 ? (
							<p className="text-muted-foreground text-center py-4">
								No lines match the filter.
							</p>
						) : (
							<div className="flex flex-col">
								{visibleLines.map((log, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: line indexes are immutable ?
									<LogLine event={log} key={i} />
								))}
							</div>
						)}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>

				<div className="flex flex-none items-center gap-4 border-t p-3 bg-background/50">
					<div className="flex flex-1 items-center gap-2">
						<ArrowRight className="h-4 w-4 text-primary" />
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={onKeyDown}
							disabled={serverStatus !== 'running'}
							placeholder={
								serverStatus === 'running'
									? 'Enter server command...'
									: 'Server not running...'
							}
							className="flex-1 border-0 bg-transparent font-mono text-sm shadow-none outline-none focus-visible:ring-0"
						/>
					</div>

					<div className="flex items-center gap-4 border-l pl-4 h-6 border-muted">
						<Button
							size="icon"
							variant="ghost"
							onClick={toggleFilter}
							className={`h-7 w-7 ${
								filterOpen ? 'text-primary' : 'text-muted-foreground'
							}`}
						>
							<Filter className="h-4 w-4" />
						</Button>
						<div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
							<span className="whitespace-nowrap">Max lines:</span>
							<Select
								value={String(maxLines)}
								onValueChange={(val) => setMaxLines(Number(val))}
							>
								<SelectTrigger className="h-7 w-[80px] text-xs font-mono bg-background">
									<SelectValue placeholder="200" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="100">100</SelectItem>
									<SelectItem value="200">200</SelectItem>
									<SelectItem value="500">500</SelectItem>
									<SelectItem value="1000">1000</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Label className="hidden md:flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
							<Checkbox
								defaultChecked
								checked={autoScroll}
								onCheckedChange={setAutoScroll}
							/>
							<span>Auto-scroll</span>
						</Label>
					</div>

					<Button
						size="icon"
						variant="ghost"
						onClick={submit}
						disabled={serverStatus !== 'running'}
						className="h-8 w-8 text-primary"
					>
						<SendHorizonal className="h-4 w-4" />
					</Button>
				</div>
			</Card>
		</div>
	);
}
