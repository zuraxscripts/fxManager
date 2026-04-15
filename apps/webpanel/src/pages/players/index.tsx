import { Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function PlayersPage() {
	return (
		<div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
			<PageHeader
				Icon={Users}
				title="Players"
				description="All registered players in the database."
			/>
		</div>
	);
}
