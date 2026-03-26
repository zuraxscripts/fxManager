import type { FastifyPluginAsync } from "fastify";

const internalRoutes: FastifyPluginAsync = async (fastify) => {
  // fastify.register(AuthModule.handler, { prefix: AuthModule.prefix });
};

export default internalRoutes;
