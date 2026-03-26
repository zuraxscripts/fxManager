import type { FastifyPluginAsync } from "fastify";

export interface RouteModule {
	prefix: string;
	handler: FastifyPluginAsync;
}
