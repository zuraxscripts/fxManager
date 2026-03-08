// ─── Server Process ───────────────────────────────────────────────────────────

export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'crashed';

export interface ServerState {
  status: ServerStatus;
  pid?: number;
  startedAt?: Date;
  restarts: number;
  lastCrashAt?: Date;
}

export interface ServerConfig {
  executable: string; // path to FXServer executable
  serverDataPath: string; // path to server-data folder
  configFile: string; // e.g. server.cfg
  autoRestart: boolean;
  maxRestarts: number;
  restartDelayMs: number;
}

// ─── Players ──────────────────────────────────────────────────────────────────

export interface Player {
  id: number;
  license: string;
  name: string;
  firstSeen: Date;
  lastSeen: Date;
}

export interface OnlinePlayer extends Player {
  serverNetId: number;
  ping: number;
  identifiers: string[];
}

// ─── Bans ─────────────────────────────────────────────────────────────────────

export interface Ban {
  id: number;
  playerId: number;
  reason: string;
  bannedBy: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CreateBanInput {
  license: string;
  reason: string;
  bannedBy: string;
  expiresAt?: Date;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'server.start'
  | 'server.stop'
  | 'server.restart'
  | 'player.ban'
  | 'player.unban'
  | 'player.kick'
  | 'settings.update';

export interface AuditEntry {
  id: number;
  adminId: string;
  action: AuditAction;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export type WSEventType = 'server:status' | 'server:log' | 'players:update' | 'console:output';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  ts: number;
}

export interface ConsoleOutputEvent {
  line: string;
  source: 'stdout' | 'stderr';
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Process Manager Interface ────────────────────────────────────────────────
// Defined here so panel can type-check against it without importing from core

import type { EventEmitter } from 'events';

export interface IProcessManager extends EventEmitter {
  getState(): ServerState;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  sendCommand(command: string): void;
}
