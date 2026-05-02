import { PageHeader } from '@/components/page-header';
import { useResourcelistSocket } from '@/hooks/ws-channels/use-resourcelist';
import { QueryService } from '@/lib/query';
import { Badge } from '@fxmanager/ui/components/badge';
import { Button } from '@fxmanager/ui/components/button';
import { ScrollArea } from '@fxmanager/ui/components/scroll-area';
import {
	LayoutList,
	Package,
	User,
	Play,
	Square,
	AlertCircle,
	RefreshCcwIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export function ResourceList() {
	const { resources, loading, status } = useResourcelistSocket();

	function formatVersion(version: string | null) {
		if (!version) return 'unknown';
		else if (version.startsWith('v')) return version;
		else return `v${version}`;
	}

	async function handleAction(resource: string, action: 'start' | 'stop') {
		try {
			await QueryService({
				endpoint: `/server/resource/${action}`,
				method: 'POST',
				body: { resource },
			});
		} catch (err) {
			console.error(
				`Unable to execute action ${action}`,
				(err as Error).message,
			);
			toast.error(`Unable to ${action} for resource ${resource}`, {
				richColors: true,
				position: 'top-center',
			});
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-end">
				<PageHeader
					Icon={LayoutList}
					title="Server Controls"
					description="Server overview and controls."
				/>
				<div className="pb-2 text-sm font-medium">
					{status === 'errored' && (
						<span className="flex items-center text-red-500 gap-1">
							<AlertCircle size={16} /> Resource list error
						</span>
					)}
				</div>
			</div>

			{loading ? (
				<div className="p-8 text-center animate-pulse">
					Loading resources...
				</div>
			) : status ? (
				<ScrollArea className="h-[calc(100vh-7rem)] rounded-md border border-zinc-800 p-4">
					<div className="grid gap-4">
						{resources.map((res) => (
							<div
								key={res.name}
								className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors group"
							>
								<div className="flex items-start justify-between">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Package size={18} className="text-blue-400" />
											<h3 className="font-bold text-zinc-100">{res.name}</h3>
											<span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
												{formatVersion(res.version)}
											</span>
										</div>

										<p className="text-sm text-zinc-400 leading-relaxed">
											{res.description ||
												'No description provided for this resource.'}
										</p>

										<div className="flex gap-4 mt-2 text-xs text-zinc-500">
											{res.author && (
												<span className="flex items-center gap-1">
													<User size={12} /> {res.author}
												</span>
											)}
											<span className="font-mono">{res.path}</span>
										</div>
									</div>

									<div className="flex flex-col items-center justify-between gap-4 p-2">
										<Badge
											variant={
												res.status === 'started' ? 'success' : 'secondary'
											}
											className="w-[6.5rem] flex items-center justify-center gap-2 capitalize py-1"
										>
											{res.status === 'started' ? (
												<Play size={12} fill="currentColor" />
											) : (
												<Square size={12} fill="currentColor" />
											)}
											{res.status}
										</Badge>

										<div className="flex gap-2">
											{res.status === 'stopped' ? (
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 bg-green-500/20 disabled:bg-transparent hover:text-green-500"
													title="Start Resource"
													onClick={() => handleAction(res.name, 'start')}
												>
													<Play size={16} />
												</Button>
											) : (
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 bg-blue-500/20 disabled:bg-transparent hover:text-blue-500"
													title="Restart Resource"
													onClick={() => handleAction(res.name, 'start')}
												>
													<RefreshCcwIcon size={16} />
												</Button>
											)}

											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 bg-red-500/20 disabled:bg-transparent hover:text-red-500"
												disabled={res.status === 'stopped'}
												title="Stop Resource"
												onClick={() => handleAction(res.name, 'stop')}
											>
												<Square size={16} />
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			) : (
        // ToDo: make this shit nicer...
				<div className="p-8 text-center">Server is stopped</div>
			)}
		</div>
	);
}
