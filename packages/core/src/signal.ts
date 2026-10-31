// When the van's signal drops we say "last seen 40 s ago" instead of pretending it still moves.
export const STALE_AFTER_S = 30;

export type Signal = { stale: boolean; secondsAgo: number };

export function signalState(lastPositionAt: number, now: number, staleAfterS = STALE_AFTER_S): Signal {
  const secondsAgo = Math.max(0, Math.floor((now - lastPositionAt) / 1000));
  return { stale: secondsAgo > staleAfterS, secondsAgo };
}

/** An age split into a number and a unit; the words come from messages (age.s, age.min, age.h). */
export function ageParts(secondsAgo: number): { n: number; unit: 's' | 'min' | 'h' } {
  if (secondsAgo < 60) return { n: secondsAgo, unit: 's' };
  if (secondsAgo < 3600) return { n: Math.floor(secondsAgo / 60), unit: 'min' };
  return { n: Math.floor(secondsAgo / 3600), unit: 'h' };
}
