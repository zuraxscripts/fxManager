import type { AdminGroup, UserPermissionsType } from '@fxmanager/shared/types';
import { UserPermissions } from '@fxmanager/shared/constants';

// ToDo: move to dynamic loading from DB
const GROUPS: AdminGroup[] = [
	{
		label: 'Master Account',
		permissions: 1073741824,
		colour: '#FF0000',
		icon: 'Star',
	},
	{
		label: 'Development',
		permissions: 30720,
		colour: '#00FF00',
		icon: 'FileCode',
	},
	{
		label: 'Management',
		permissions: 36863,
		colour: '#0000FF',
		icon: 'UserRoundKey',
	},
	{
		label: 'Moderation',
		permissions: 1991,
		colour: '#ff6600',
		icon: 'Shield',
	},
];

export class PermissionManager {
	private static groups: AdminGroup[] = GROUPS;
	constructor() {}

	static has(userBitfield: number, required: UserPermissionsType): boolean {
		if (userBitfield & UserPermissions.MASTER) return true;

		return (userBitfield & required) === required;
	}

	static hasAll(
		userBitfield: number,
		required: UserPermissionsType[],
	): boolean {
		if (userBitfield & UserPermissions.MASTER) return true;

		const combined = required.reduce((acc, p) => acc | p, 0);

		return (userBitfield & combined) === combined;
	}

	static grant(userBitfield: number, toAdd: UserPermissionsType): number {
		return userBitfield | toAdd;
	}

	static revoke(userBitfield: number, toRemove: UserPermissionsType): number {
		return userBitfield & ~toRemove;
	}

	static loadGroups(groups: AdminGroup[]) {
		this.groups = groups;
	}

	static getGroup(permission: number): AdminGroup | null {
		const group =
			GROUPS.find(
				(group) => (permission & group.permissions) === group.permissions,
			) ?? null;

		return group;
	}
}
