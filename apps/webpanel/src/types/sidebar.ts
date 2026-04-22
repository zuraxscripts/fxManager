import type { LucideIcon } from 'lucide-react';

export interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	items?: {
		title: string;
		url: string;
	}[];
}
