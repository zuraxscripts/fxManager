import AuthModule from "./auth";
import ServerModule from "./server";
import type { RouteModule } from "../../types";

const apiRoutes: RouteModule['handler'] = async (fastify, options) => {
  fastify.register(AuthModule.handler, { 
    ...options, 
    prefix: AuthModule.prefix 
  });
  
  fastify.register(ServerModule.handler, { 
    ...options, 
    prefix: ServerModule.prefix 
  });
};

export default apiRoutes;
