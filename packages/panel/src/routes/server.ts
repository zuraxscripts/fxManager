import Elysia, { t } from 'elysia';
import type { IProcessManager } from '@fxmanager/types';
import { repo } from '@fxmanager/database';

export const serverRoutes = (pm: IProcessManager) =>
  new Elysia({ prefix: '/server' })

    .get('/status', () => pm.getState())

    .post('/start', async () => {
      await pm.start();
      repo.audit.log({ adminId: 'admin', action: 'server.start' });
      return { success: true };
    })

    .post('/stop', async () => {
      await pm.stop();
      repo.audit.log({ adminId: 'admin', action: 'server.stop' });
      return { success: true };
    })

    .post('/restart', async () => {
      await pm.restart();
      repo.audit.log({ adminId: 'admin', action: 'server.restart' });
      return { success: true };
    })

    .post(
      '/command',
      ({ body }) => {
        pm.sendCommand(body.command);
        return { success: true };
      },
      {
        body: t.Object({ command: t.String() }),
      },
    );
