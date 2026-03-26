import type { FastifyPluginAsync } from "fastify"
import type { RouteModule } from "../../types";

const ServerEndpoints: FastifyPluginAsync = async (fastify, options) => {};

export default {
	prefix: '/server',
	handler: ServerEndpoints,
} satisfies RouteModule;
