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
