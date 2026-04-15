import type { WebSocket } from '@fastify/websocket';
import type { Channel, WSClientMessage, WSMessage } from '@fxmanager/shared/types';

interface Subscription {
  socket: WebSocket;
  channels: Set<Channel>;
}

type ServerHandler<T = unknown> = (clientId: string, event: string, data: T) => void;

class WSManager {
  private clients = new Map<string, Subscription>();
  private callbacks = new Map<string, Set<ServerHandler>>();

  add(id: string, socket: WebSocket) {
    this.clients.set(id, { socket, channels: new Set() });

    socket.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString()) as WSClientMessage;
        this.handleClientMessage(id, msg);
      } catch {}
    });

    socket.on('close', () => this.remove(id));
  }

  private handleClientMessage(id: string, msg: WSClientMessage) {
    const sub = this.clients.get(id);
    if (!sub) return;

    if (msg.type === 'subscribe') {
      sub.channels.add(msg.channel);
    } else if (msg.type === 'unsubscribe') {
      sub.channels.delete(msg.channel);
    } else if (msg.type === 'emit') {
			this.triggerCallbacks(id, msg.channel!, msg.event!, msg.data);
		}
  }

	private triggerCallbacks(clientId: string, channel: Channel, event: string, data: unknown) {
    const exactKey = `${channel}:${event}`;
    this.callbacks.get(exactKey)?.forEach((h) => h(clientId, event, data));

    const wildcardKey = `${channel}:*`;
    this.callbacks.get(wildcardKey)?.forEach((h) => h(clientId, event, data));
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

	on<T>(channel: Channel, event: string, handler: ServerHandler<T>): () => void {
    const key = `${channel}:${event}`;
    if (!this.callbacks.has(key)) this.callbacks.set(key, new Set());
    this.callbacks.get(key)!.add(handler as ServerHandler);

    return () => this.callbacks.get(key)?.delete(handler as ServerHandler);
  }

  onChannel<T>(channel: Channel, handler: ServerHandler<T>): () => void {
    return this.on(channel, '*', handler);
  }
}

export const wsManager = new WSManager();
