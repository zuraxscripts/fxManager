import { randomUUID } from 'crypto';
import { wsManager } from '../../modules/ws.manager';
import type { RouteModule } from '../../types';

// ToDo: add authentication checks

const wsEndpoints: RouteModule['handler'] = async (fastify) => {
  fastify.get('', { websocket: true }, (socket, request) => {
    const clientId = randomUUID();
    wsManager.add(clientId, socket);

    // Send client its assigned id so it can reference itself
    socket.send(JSON.stringify({ type: 'connected', clientId }));
  });
};

export default {
	prefix: '/ws',
	handler: wsEndpoints,
} satisfies RouteModule;
