import type { EventEmitter } from 'events';
import type { ConsoleOutputEvent } from './socket';
import type { DeferralCheckResponse, GameEventPayload, OnlinePlayer } from './game-api';
import { PlayerIdentifiers } from './players';
import { ApiResponse } from './api';

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'crashed';

export interface ServerState {
  status: ServerStatus;
  pid?: number;
  startedAt?: Date;
  restarts: number;
  playerCount: number;
  lastCrashAt?: Date;
}

export interface ServerConfig {
  version: `${string}.${string}.${string}` | `${string}.${string}.${string}-b` | 'dev-build';
  executable: string;
  serverDataPath: string;
  configFile: string;
  autoRestart: boolean;
  maxRestarts: number;
  restartDelayMs: number;
  webServerPort: number;
  internalPort: number;
  resourceApiToken: string;
}

export interface IProcessManager extends EventEmitter {
  getState(): ServerState;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  sendCommand(command: string): void;
  getConsoleContent(): ConsoleOutputEvent[];
  handleGameEvent(payload: GameEventPayload): void;
}

export interface PlayerJoinPayload {
  name: string;
  identifiers: PlayerIdentifiers;
  serverId: number;
}

export interface IGameManager {
  getPlayerList(): OnlinePlayer[];
  getPlayer(id: number): OnlinePlayer | undefined;
  playerDeferralChecks(identifiers: PlayerIdentifiers): DeferralCheckResponse;
  playerJoin(payload: PlayerJoinPayload): Promise<void>;
  playerDrop(serverId: number): Promise<void>;

  dropPlayer(serverId: number, reason: string): Promise<ApiResponse>;
}
