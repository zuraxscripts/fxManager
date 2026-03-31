import type { FastifyPluginAsync } from "fastify"
import type { RouteModule } from "../../types";
import { sessionAuth } from "../../middleware/auth";

const ServerEndpoints: RouteModule['handler'] = async (fastify, options) => {
	const { pm, gm } = options;
	
  fastify.addHook('preHandler', sessionAuth);
};

export default {
	prefix: '/server',
	handler: ServerEndpoints,
} satisfies RouteModule;
