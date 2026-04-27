import type { AdminGroup, UserPermissionsType } from '@fxmanager/shared/types';
import {
	PERMISSION_GROUPS,
	UserPermissions,
} from '@fxmanager/shared/constants';

export class PermissionManager {
	private static groups: AdminGroup[] = PERMISSION_GROUPS;
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
			this.groups.find(
				(group) => (permission & group.permissions) === group.permissions,
			) ?? null;

		return group;
	}
}
