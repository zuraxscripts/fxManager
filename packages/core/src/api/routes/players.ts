import Elysia, { t } from 'elysia';
import type { GameManager } from '../../services/game/manager';

const playerIdentifiers = t.Object({
  license: t.String(),
  fivem: t.Optional(t.String()),
  discord: t.Optional(t.String()),
  steam: t.Optional(t.String()),
});

export const playerRoutes = (gh: GameManager) =>
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
        gh.playerJoin(body);
        return { ack: true };
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
        gh.playerDrop(body.serverId);
        return { ack: true };
      },
      {
        body: t.Object({
          serverId: t.Number(),
        }),
      },
    );
