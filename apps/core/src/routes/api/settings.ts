import type {
	AuthedRequest,
	RouteModule,
	SearchQueryRequest,
} from '../../types';
import { sessionAuth } from '../../middleware/session';
import { PermissionManager } from '@fxmanager/shared/utils';
import { UserPermissions } from '@fxmanager/shared/constants';
import type { BaseAdminUser, PaginatedResponse } from '@fxmanager/shared/types';
import { repo } from '@fxmanager/database';

const SettingsEndpoints: RouteModule['handler'] = async (fastify) => {
	// enforces that admin key exists in request otherwise returns 401
	fastify.addHook('preHandler', sessionAuth);

	fastify.get('/admins', (request, reply): PaginatedResponse<BaseAdminUser> => {
		const { admin } = request as AuthedRequest;

		const allowed = PermissionManager.has(
			admin.permissions,
			UserPermissions.SETTINGS_ADMIN_MANAGEMENT,
		);

		if (!allowed) throw new Error('Unauthorized');

		const { query } = request as SearchQueryRequest;

		const page = Number(query.page ?? 1);
		const pageSize = Number(query.pageSize ?? 50);

		return repo.settings.listAdmins(page, pageSize, {
			search: query.search,
			sortBy: query.sortBy as any,
			sortOrder: query.sortOrder as any,
		});
	});
};

export default {
	prefix: '/settings',
	handler: SettingsEndpoints,
} satisfies RouteModule;
