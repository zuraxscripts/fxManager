import { repo } from '@fxmanager/database';
import type {
  BanDataCard,
  DeferralCheckResponse,
  IProcessManager,
  OnlinePlayer,
  PlayerIdentifiers,
} from '@fxmanager/types';

export class GameManager {
  private pm: IProcessManager;
  private playerlist: OnlinePlayer[] = [];

  constructor(pm: IProcessManager) {
    this.pm = pm;
  }

  // region player handling
  getPlayerList() {
    return this.playerlist;
  }

  playerDeferralChecks(identifiers: PlayerIdentifiers): DeferralCheckResponse {
    const ban = repo.players.checkBanned(identifiers);

    if (ban) {
      const isPerm = ban.expiresAt === null;

      let data: BanDataCard;

      if (isPerm)
        data = {
          permanent: true,
          reason: ban.reason,
          createdAt: ban.createdAt,
        };
      else
        data = {
          permanent: false,
          reason: ban.reason,
          createdAt: ban.createdAt,
          expiresAt: ban.expiresAt!,
        };

      return {
        access: false,
        ban: data,
      };
    }

    /* ToDo: Add whitelist checks */

    return { access: true };
  }

  async playerJoin({
    name,
    identifiers,
    serverId,
  }: { name: string; identifiers: PlayerIdentifiers; serverId: number }) {
    const player = await repo.players.upsert(name, identifiers);

    const playerPayload = {
      serverId,
      health: -1,
      ...player,
    } satisfies OnlinePlayer;

    this.playerlist.push(playerPayload);
    this.pm.handleGameEvent({
      event: 'player.join',
      data: playerPayload,
    });
  }

  async playerDrop(serverId: number) {
    const index = this.playerlist.findIndex((p) => p.serverId === serverId);

    if (index === -1) {
      console.warn(`[core - game] A player (${serverId}) disconnected but wasn't tracked!`);
      return;
    }

    const [player] = this.playerlist.splice(index, 1);
    const sessionDuration = Date.now() - player.lastSeen.getTime();
    const newPlaytime = player.playtime + sessionDuration;

    repo.players.updatePlaytime(player.id, newPlaytime);
    this.pm.handleGameEvent({
      event: 'player.drop',
      data: { serverId: player.serverId },
    });
  }
}
