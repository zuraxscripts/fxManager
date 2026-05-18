import { repo } from '@fxmanager/database';
import { UserPermissions } from '@fxmanager/shared/constants';
import { PermissionManager } from '@fxmanager/shared/utils';
import type { AuthedRequest, RouteModule } from '../../../types';
import type { AuditLog } from '@fxmanager/database/types';
import type {
	AuditLogAction,
	PaginatedResponse,
} from '@fxmanager/shared/types';

const AuditLogEndpoint: RouteModule['handler'] = async (fastify) => {
	fastify.get('/', async (request): Promise<PaginatedResponse<AuditLog>> => {
		const { admin } = request as AuthedRequest;

		const allowed = PermissionManager.has(
			admin.permissions,
			UserPermissions.AUDIT_LOG,
		);

		if (!allowed) throw new Error('Unauthorized');

		// biome-ignore lint/suspicious/noExplicitAny: can't be arsed to cast atm
		const rawQuery = request.query as any;
		const page = rawQuery.page ? parseInt(rawQuery.page, 10) : 1;
		const pageSize = rawQuery.pageSize ? parseInt(rawQuery.pageSize, 10) : 50;

		let actionFilter: AuditLogAction[] | undefined;
		if (rawQuery.action) {
			actionFilter = Array.isArray(rawQuery.action)
				? rawQuery.action
				: [rawQuery.action];
		}

		let adminIdFilter: number | 'system' | undefined;
		if (rawQuery.adminId !== undefined && rawQuery.adminId !== '') {
			adminIdFilter =
				rawQuery.adminId === 'system'
					? 'system'
					: parseInt(rawQuery.adminId, 10);
		}

		// 5. Build your clean query objects
		const targetFilter = rawQuery.target?.trim() || undefined;
		const dateFromFilter = rawQuery.dateFrom
			? new Date(rawQuery.dateFrom)
			: undefined;
		const dateToFilter = rawQuery.dateTo
			? new Date(rawQuery.dateTo)
			: undefined;

		// Pass the safely formatted data structures down to Drizzle
		const list = await repo.audit.list(
			Number.isNaN(page) ? 1 : page,
			Number.isNaN(pageSize) ? 50 : pageSize,
			actionFilter,
			targetFilter,
			adminIdFilter,
			dateFromFilter,
			dateToFilter,
		);

		return list;
	});
};

export default {
	prefix: '/audit',
	handler: AuditLogEndpoint,
} satisfies RouteModule;
