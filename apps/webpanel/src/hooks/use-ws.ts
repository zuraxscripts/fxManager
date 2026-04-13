import type { WSContextValue } from '@/types/ws';
import { createContext, useContext } from 'react';

export const WSContext = createContext<WSContextValue | null>(null);

export function useWS() {
	const ctx = useContext(WSContext);
	if (!ctx) throw new Error('useWS must be used inside WSProvider');
	return ctx;
}
