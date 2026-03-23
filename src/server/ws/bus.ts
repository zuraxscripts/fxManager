import type { ServerWebSocket } from "bun";

export type WsTopic =
  | "console"
  | "player:join"
  | "player:leave"
  | "server:status"
  | "audit";

export interface WsMessage<T = unknown> {
  topic: WsTopic;
  payload: T;
  ts: number;
}

type WsClient = ServerWebSocket<{ id: string }>;

// In-memory set of connected clients
const clients = new Set<WsClient>();

// Rolling console buffer (last 500 lines for backfill)
const consoleBuffer: WsMessage[] = [];
const BUFFER_MAX = 500;

export function registerClient(ws: WsClient) {
  clients.add(ws);
  // Backfill console history
  for (const msg of consoleBuffer) {
    ws.send(JSON.stringify(msg));
  }
}

export function removeClient(ws: WsClient) {
  clients.delete(ws);
}

export function broadcast<T>(topic: WsTopic, payload: T) {
  const msg: WsMessage<T> = { topic, payload, ts: Date.now() };
  const raw = JSON.stringify(msg);

  if (topic === "console") {
    consoleBuffer.push(msg as WsMessage);
    if (consoleBuffer.length > BUFFER_MAX) consoleBuffer.shift();
  }

  for (const client of clients) {
    try {
      client.send(raw);
    } catch {
      clients.delete(client);
    }
  }
}

export function clientCount() {
  return clients.size;
}
