import type { LucideIcon } from 'lucide-react';

export interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	permission?: number;
	items?: {
		title: string;
		url: string;
		permission?: number;
	}[];
}
