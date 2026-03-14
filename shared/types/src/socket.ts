export type ChannelName = 'server' | 'console' | 'playerlist' | `report:${string}`;

export interface WSEnvelope {
  channel: ChannelName;
  type: string;
  payload: unknown;
  ts: number;
}

export interface ConsoleOutputEvent {
  id: number;
  line: string; // raw line with ANSI
  source: 'stdout' | 'stderr';
  ts: number;
}
