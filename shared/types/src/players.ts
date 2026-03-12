export interface PlayerIdentifiers {
  license: string;
  fivem?: string;
  discord?: string;
  steam?: string;
}

export interface Player {
  id: number;
  name: string;
  playtime: number;
  identifiers: PlayerIdentifiers;
  firstSeen: Date;
  lastSeen: Date;
}

export interface OnlinePlayer extends Player {
  serverId: number;
  ping?: number;
  health: number;
}
