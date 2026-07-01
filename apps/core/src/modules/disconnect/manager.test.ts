import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { ServerSession } from '@fxmanager/shared/types';
import { wsManager } from '../ws/manager';

const mockOpenForSession = mock(() => {});
const mockBump = mock(() => {});
const mockRecordEvent = mock(() => {});

mock.module('@fxmanager/database', () => ({
	repo: {
		disconnects: {
			openForSession: mockOpenForSession,
			bump: mockBump,
			recordEvent: mockRecordEvent,
		},
	},
}));

const { disconnectManager } = await import('./manager');

const stubSession = (): ServerSession => ({
	id: 1,
	startedAt: 1000,
	endedAt: 5000,
	closeReason: null,
});

describe('disconnectManager', () => {
	let wsSpy: ReturnType<typeof spyOn>;
	beforeEach(() => {
		mockOpenForSession.mockReset();
		mockBump.mockReset();
		mockRecordEvent.mockReset();
		wsSpy = spyOn(wsManager, 'broadcast').mockImplementation(() => {});
		// clear any live session leaking between tests
		disconnectManager.onSessionClose(null);
	});
	afterEach(() => wsSpy.mockRestore());

	it('onSessionOpen creates a counts row, sets live, and broadcasts', () => {
		disconnectManager.onSessionOpen(stubSession());
		expect(mockOpenForSession).toHaveBeenCalledWith(1);
		const live = disconnectManager.getLiveSession()!;
		expect(live.id).toBe(1);
		expect(live.startedAt).toBe(1000);
		expect(live.endedAt).toBeNull();
		expect(live.quit + live.crash + live.timeout + live.kick + live.other).toBe(
			0,
		);
		expect(wsSpy).toHaveBeenCalled();
	});

	it('records a classified drop: bumps counter + broadcasts', () => {
		disconnectManager.onSessionOpen(stubSession());
		wsSpy.mockClear();
		disconnectManager.recordDrop({ reason: 'Game crashed: x', category: 2 });
		expect(mockBump).toHaveBeenCalledWith(1, 'crash');
		expect(disconnectManager.getLiveSession()?.crash).toBe(1);
		expect(wsSpy).toHaveBeenCalledTimes(1);
	});

	it('ignores server-shutdown drops (no bump)', () => {
		disconnectManager.onSessionOpen(stubSession());
		disconnectManager.recordDrop({ reason: 'x', category: 7 });
		expect(mockBump).not.toHaveBeenCalled();
	});

	it('does not record when there is no live session', () => {
		disconnectManager.recordDrop({ reason: 'Exiting', category: 2 });
		expect(mockBump).not.toHaveBeenCalled();
	});

	it('onSessionClose sets endedAt, broadcasts, and clears live', () => {
		disconnectManager.onSessionOpen(stubSession());
		wsSpy.mockClear();
		disconnectManager.onSessionClose(stubSession());
		expect(disconnectManager.getLiveSession()).toBeNull();
		expect(wsSpy).toHaveBeenCalledTimes(1);
		const msg = wsSpy.mock.calls[0]?.[0] as {
			data: { endedAt: number | null };
		};
		expect(msg.data.endedAt).toBe(5000);
	});

	it('onSessionClose with no live session is a no-op', () => {
		disconnectManager.onSessionClose(stubSession());
		expect(wsSpy).not.toHaveBeenCalled();
	});
});
