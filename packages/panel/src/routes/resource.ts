import Elysia, { t } from 'elysia';
import { resourceAuth } from '../middleware/resource-auth';
import { repo } from '@fxmanager/database';

// These routes are called by the in-game resource via HTTP
export const resourceRoutes = new Elysia({ prefix: '/resource' })
  .use(resourceAuth)

  // Resource reports a player connecting
  .post(
    '/player/connect',
    ({ body }) => {
      repo.players.upsert(body.license, body.name);
      const banned = repo.bans.isLicenseBanned(body.license);
      return { banned };
    },
    {
      body: t.Object({
        license: t.String(),
        name: t.String(),
      }),
    },
  )

  // Resource reports players currently online (periodic heartbeat)
  .post(
    '/players/sync',
    ({ body }) => {
      for (const p of body.players) {
        repo.players.upsert(p.license, p.name);
      }
      return { success: true };
    },
    {
      body: t.Object({
        players: t.Array(
          t.Object({
            license: t.String(),
            name: t.String(),
            serverNetId: t.Number(),
            ping: t.Number(),
          }),
        ),
      }),
    },
  );
