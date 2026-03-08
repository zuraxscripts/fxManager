import Elysia from 'elysia';
import type { IProcessManager } from '@fxmanager/types';
import type { WSEvent, ConsoleOutputEvent, ServerState } from '@fxmanager/types';

export const wsRoutes = (pm: IProcessManager) =>
  new Elysia().ws('/ws', {
    open(ws) {
      // Send current state immediately on connect
      const event: WSEvent<ServerState> = {
        type: 'server:status',
        payload: pm.getState(),
        ts: Date.now(),
      };
      ws.send(JSON.stringify(event));

      // Forward process manager events to this socket
      const onState = (state: ServerState) => {
        ws.send(JSON.stringify({ type: 'server:status', payload: state, ts: Date.now() }));
      };

      const onConsole = (data: ConsoleOutputEvent) => {
        ws.send(JSON.stringify({ type: 'console:output', payload: data, ts: Date.now() }));
      };

      pm.on('state', onState);
      pm.on('console', onConsole);

      // Clean up listeners when socket closes
      (ws.data as any)._cleanup = () => {
        pm.off('state', onState);
        pm.off('console', onConsole);
      };
    },

    close(ws) {
      (ws.data as any)._cleanup?.();
    },

    message(ws, msg) {
      // Accept console commands sent from the panel UI
      try {
        const parsed = JSON.parse(msg as string);
        if (parsed.type === 'console:input' && parsed.payload?.command) {
          pm.sendCommand(parsed.payload.command);
        }
      } catch {
        /* ignore malformed */
      }
    },
  });
