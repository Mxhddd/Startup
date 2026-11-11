// When the opening logo moment plays: the full version (about 2.5 s) on a visitor's first visit, a
// 0.6 s version after that, never with reduced motion. The "seen" mark is the only thing stored, in
// the visitor's own browser; if storage is blocked, the visitor simply gets the full version.
export type IntroMode = 'full' | 'short' | 'none';
export const INTRO_KEY = 'pohnch.intro.seen';

export function introMode(reducedMotion: boolean, seen: boolean): IntroMode {
  if (reducedMotion) return 'none';
  return seen ? 'short' : 'full';
}

export function readSeen(store: Pick<Storage, 'getItem'> | null | undefined): boolean {
  try { return store?.getItem(INTRO_KEY) === '1'; } catch { return false; }
}
export function markSeen(store: Pick<Storage, 'setItem'> | null | undefined): void {
  try { store?.setItem(INTRO_KEY, '1'); } catch { /* storage blocked: the full intro plays again next time */ }
}
