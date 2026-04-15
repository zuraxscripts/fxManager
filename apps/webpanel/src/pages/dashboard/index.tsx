import { MonitorCog } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function DashboardPage() {
	return (
		<div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
			<PageHeader
				Icon={MonitorCog}
				title="Server Controls"
				description="Server overview and controls."
			/>
		</div>
	);
}
