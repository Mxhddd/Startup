// v10 first-week tips on the parent home: shown until dismissed, and only in the first 7 days.
const WEEK = 7 * 24 * 3600_000;

export type TipsSaved = { firstSeen: number; done: boolean };

/** Whether the tips should show: never seen yet, or not dismissed and within a week of first seeing them. */
export function tipsDue(saved: TipsSaved | null, now: number): boolean {
  if (!saved) return true;
  return !saved.done && now - saved.firstSeen < WEEK;
}
