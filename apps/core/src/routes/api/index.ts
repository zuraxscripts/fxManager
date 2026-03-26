import type { FastifyPluginAsync } from "fastify";
import AuthModule from "./auth";
import ServerModule from "./server";

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(AuthModule.handler, { prefix: AuthModule.prefix });
  fastify.register(ServerModule.handler, { prefix: ServerModule.prefix });
};

export default apiRoutes;
