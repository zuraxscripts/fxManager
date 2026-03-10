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
