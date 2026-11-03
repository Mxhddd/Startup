// The quiet data message the server sends an Android phone to refresh its live trip notification
// while the app is closed. Wrapped under one key, so the app can find it however Android hands
// the message over (the shape differs between phones and Expo versions).
import type { LiveCard } from './liveCard';

export const LIVE_KEY = 'pohnchLive';
export type LivePayload = { card: LiveCard; unit: string; end?: boolean };

/** Finds and reads a LivePayload anywhere inside what the background task received. */
export function findLivePayload(input: unknown, depth = 0): LivePayload | null {
  if (depth > 8 || input === null || input === undefined) return null;
  if (typeof input === 'string') {
    if (!input.includes('"card"') && !input.includes(LIVE_KEY)) return null;
    try {
      return findLivePayload(JSON.parse(input), depth + 1);
    } catch {
      return null;
    }
  }
  if (typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  if (o.card && typeof o.card === 'object' && typeof (o.card as LiveCard).lead === 'string') return o as unknown as LivePayload;
  if (LIVE_KEY in o) return findLivePayload(o[LIVE_KEY], depth + 1);
  for (const v of Object.values(o)) {
    const found = findLivePayload(v, depth + 1);
    if (found) return found;
  }
  return null;
}
