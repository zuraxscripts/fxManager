import { adminUsers, bans, kicks, playerNotes, reports, warns } from '@fxmanager/database';

export type Ban = typeof bans.$inferSelect;
export type Warn = typeof warns.$inferSelect;
export type Kick = typeof kicks.$inferSelect;
export type PlayerNote = typeof playerNotes.$inferSelect;

export interface ReportRecap {
  id: number;
  playerId: number;
  subject: string;
  status: 'open' | 'inprogress' | 'resolved';
  openedAt: Date;
  lastAction: Date;
}

export type ReportMessage =
  | {
      id: number;
      playerId: number;
      message: string;
      timestamp: Date;
    }
  | {
      id: number;
      playerId: number;
      message: string;
      timestamp: Date;
    };

export interface Report extends ReportRecap {
  messages: ReportMessage[];
}
