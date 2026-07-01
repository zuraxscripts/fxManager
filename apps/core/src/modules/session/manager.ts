import { repo } from '@fxmanager/database';
import type { ServerSession } from '@fxmanager/shared/types';

class SessionManager {
	private current: ServerSession | null = null;
	private playerCount = 0;

	init(): void {
		repo.serverSessions.closeDangling();
	}

	openSession(): ServerSession {
		if (this.current) return this.current;
		this.current = repo.serverSessions.open();
		this.playerCount = 0;
		return this.current;
	}

	closeSession(reason: string | null = null): ServerSession | null {
		if (!this.current) return null;
		const closed = repo.serverSessions.close(this.current.id, reason);
		repo.serverSessions.prune();
		this.current = null;
		this.playerCount = 0;
		return closed;
	}

	getCurrent(): ServerSession | null {
		return this.current;
	}

	getCurrentId(): number | null {
		return this.current?.id ?? null;
	}

	setPlayerCount(n: number): void {
		this.playerCount = n;
	}

	getPlayerCount(): number {
		return this.playerCount;
	}
}

export const sessionManager = new SessionManager();
