import type { AdminGroup } from '../types';

// acts like an enum
export const UserPermissions = {
	NONE: 0,
	KICK: 1 << 0, // 1
	BAN: 1 << 1, // 2
	WARN: 1 << 2, // 4
	REVOKE_KICK: 1 << 3, // 8
	REVOKE_BAN: 1 << 4, // 16
	REVOKE_WARN: 1 << 5, // 32

	WHITELIST: 1 << 6, // 64
	REVOKE_WHITELIST: 1 << 7, // 128

	VIEW_REPORT: 1 << 8, // 256
	SEND_REPORT: 1 << 9, // 512
	CLOSE_REPORT: 1 << 10, // 1024

	SERVER_ACTIONS: 1 << 11, // 2048 - start/stop/restart

	CONSOLE_VIEW: 1 << 12, // 4096 - view console
	CONSOLE_ACCESS: 1 << 13, // 4096 - execute console commands

	SETTINGS_ACCESS: 1 << 14, // 8192 - access & edit settings
	SETTINGS_ADMIN_MANAGEMENT: 1 << 15, // 32768 - access & edit admins

	MASTER: 1 << 30, // 1073741824
} as const;

// ToDo: move to dynamic loading from DB
export const PERMISSION_GROUPS: AdminGroup[] = [
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
