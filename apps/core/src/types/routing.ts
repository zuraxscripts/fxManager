import type { FastifyPluginAsync } from "fastify";
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

declare module 'fastify' {
  interface FastifyRequest {
    admin?: {
      id: number;
      username: string;
      permissions: number;
    };
  }
}
