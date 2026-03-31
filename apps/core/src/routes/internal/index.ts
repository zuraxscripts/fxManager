import type { RouteModule } from "../../types";

const internalRoutes: RouteModule['handler'] = async (fastify, options) => {
	// fastify.register(AuthModule.handler, { 
	// 	...options, 
	// 	prefix: AuthModule.prefix 
	// });
};

export default internalRoutes;
