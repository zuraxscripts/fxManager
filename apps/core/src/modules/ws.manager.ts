import type { WebSocket } from '@fastify/websocket';
import type { Channel, WSMessage } from '@fxmanager/shared/types';

interface Subscription {
  socket: WebSocket;
  channels: Set<Channel>;
}

class WSManager {
  private clients = new Map<string, Subscription>();

  add(id: string, socket: WebSocket) {
    this.clients.set(id, { socket, channels: new Set() });

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleClientMessage(id, msg);
      } catch {}
    });

    socket.on('close', () => this.remove(id));
  }

  private handleClientMessage(id: string, msg: { type: string; channel: Channel }) {
    const sub = this.clients.get(id);
    if (!sub) return;

    if (msg.type === 'subscribe') {
      sub.channels.add(msg.channel);
    } else if (msg.type === 'unsubscribe') {
      sub.channels.delete(msg.channel);
    }
  }

  remove(id: string) {
    this.clients.delete(id);
  }

  broadcast<T>(message: WSMessage<T>) {
    const payload = JSON.stringify(message);
    for (const sub of this.clients.values()) {
      if (sub.channels.has(message.channel) && sub.socket.readyState === 1) {
        sub.socket.send(payload);
      }
    }
  }

  send<T>(clientId: string, message: WSMessage<T>) {
    const sub = this.clients.get(clientId);
    if (sub?.socket.readyState === 1) {
      sub.socket.send(JSON.stringify(message));
    }
  }
}

export const wsManager = new WSManager();
