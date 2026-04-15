import { BookUser } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function PlayerListPage() {
	return (
		<div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
			<PageHeader
				Icon={BookUser}
				title="Player List"
				description="Current connected players on the server."
			/>
		</div>
	);
}
