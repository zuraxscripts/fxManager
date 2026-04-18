import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import 'fastify';
import type { ProcessManager } from "../modules/process.manager";
import type { GameManager } from "../modules/game.manager";

export interface Managers {
	pm: ProcessManager;
	gm: GameManager;
}

export interface RouteModule {
  prefix: string;
  handler: FastifyPluginAsync<Managers>;
}

type RequestAdmin = {
	id: number;
	username: string;
	permissions: number;
}

export interface AuthedRequest extends FastifyRequest {
	admin: RequestAdmin;
}

declare module 'fastify' {
  interface FastifyRequest {
    admin?: RequestAdmin;
  }
}
