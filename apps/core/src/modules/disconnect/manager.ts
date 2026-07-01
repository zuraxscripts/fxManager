import { repo } from '@fxmanager/database';
import type { DisconnectSession, ServerSession } from '@fxmanager/shared/types';
import { wsManager } from '../ws/manager';
import { classifyDrop } from './classify-drop';

class DisconnectManager {
	private live: DisconnectSession | null = null;

	onSessionOpen(session: ServerSession): void {
		repo.disconnects.openForSession(session.id);
		this.live = {
			id: session.id,
			startedAt: session.startedAt,
			endedAt: null,
			quit: 0,
			crash: 0,
			timeout: 0,
			kick: 0,
			other: 0,
		};
		this.broadcast();
	}

	onSessionClose(session: ServerSession | null): void {
		if (!this.live) return;
		if (session) this.live.endedAt = session.endedAt;
		this.broadcast();
		this.live = null;
	}

	recordDrop(payload: {
		reason: unknown;
		resourceName?: string;
		category?: number;
	}): void {
		const category = classifyDrop(payload);
		if (!category || !this.live) return;
		this.live[category] += 1;
		repo.disconnects.bump(this.live.id, category);
		repo.disconnects.recordEvent(this.live.id, Date.now(), category);
		this.broadcast();
	}

	getLiveSession(): DisconnectSession | null {
		return this.live;
	}

	private broadcast(): void {
		if (!this.live) return;
		wsManager.broadcast<DisconnectSession>({
			channel: 'disconnects',
			event: 'update',
			data: this.live,
		});
	}
}

export const disconnectManager = new DisconnectManager();
