import type { FastifyPluginAsync } from "fastify"
import type { RouteModule } from "../../types";

const AuthEndpoints: FastifyPluginAsync = async (fastify, options) => {};

export default {
	prefix: '/auth',
	handler: AuthEndpoints,
} satisfies RouteModule;
