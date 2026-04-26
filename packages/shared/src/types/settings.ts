import type { UserPermissionsType } from './security';

export type AdminGroup = {
	label: string;
	permissions: number;
	colour: string;
	icon?: string;
};

export interface BaseAdminUser {
	id: number;
	username: string;
	permissions: UserPermissionsType;
	group: AdminGroup | null;
	playerId: number | null;
	createdAt: Date;
	lastLoginAt: Date | null;
}

export interface CreateAdminForm {
	username: string;
	permissions: UserPermissionsType;
	playerId: number | null;
}
