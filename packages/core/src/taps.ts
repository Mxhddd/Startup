// Timing rules for the driver's taps.
// Van-wide taps (start trip, reached school, whole-van day off) need a hold, so a bump in traffic can't fire them.
// Every tap can be undone for 5 seconds.
export const HOLD_MS = 800;
export const UNDO_MS = 5000;

/** How far a hold has filled, 0 to 1. */
export function holdProgress(pressedAt: number, now: number, holdMs = HOLD_MS): number {
  if (now <= pressedAt) return 0;
  return Math.min(1, (now - pressedAt) / holdMs);
}

/** Whole seconds left to undo a tap (5, 4, ... 1), or 0 when undo has closed. */
export function undoSecondsLeft(tappedAt: number, now: number, windowMs = UNDO_MS): number {
  const left = tappedAt + windowMs - now;
  return left > 0 ? Math.ceil(left / 1000) : 0;
}
