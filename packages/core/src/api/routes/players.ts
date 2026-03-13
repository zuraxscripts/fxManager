import type { IProcessManager } from '@fxmanager/types';
import Elysia, { t } from 'elysia';
import type { GameHandler } from '../../services/game/handler';

const playerIdentifiers = t.Object({
  license: t.String(),
  fivem: t.Optional(t.String()),
  discord: t.Optional(t.String()),
  steam: t.Optional(t.String()),
});

export const playerRoutes = (gh: GameHandler) =>
  new Elysia({ prefix: '/api/players' })
    .post(
      '/deferrals',
      ({ body }) => {
        return gh.playerDeferralChecks(body.identifiers);
      },
      {
        body: t.Object({
          identifiers: playerIdentifiers,
        }),
      },
    )

    .post(
      '/join',
      ({ body }) => {
        return gh.playerJoin(body);
      },
      {
        body: t.Object({
          identifiers: playerIdentifiers,
          name: t.String(),
          serverId: t.Number(),
        }),
      },
    )

    .post(
      '/drop',
      ({ body }) => {
        return gh.playerDrop(body.serverId);
      },
      {
        body: t.Object({
          serverId: t.Number(),
        }),
      },
    );
