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
