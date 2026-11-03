// The parent's day, told back (v8): the "van at your door" wait, and "Today's story" when a run ends.
import type { ParentEvent, TimelineItem } from './parent';

/** When the van reached your door for this child (the newest "arriving" step), or null. */
export function arrivedAt(childId: string, events: ParentEvent[]): string | null {
  const arr = events
    .filter((e) => !e.undone && e.step === 'arriving' && (e.childId === childId || e.childId === null))
    .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))[0];
  return arr?.happenedAt ?? null;
}

/** The wait at the door as "m:ss" (Western digits), counting up from when the van arrived. */
export function waitClock(since: string, now: number): string {
  const s = Math.max(0, Math.floor((now - Date.parse(since)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * A finished run as a story: every step that happened (time and who), and the minutes from the
 * child's own step (picked up / left school) to the end (reached school / dropped home).
 * Null while the run isn't finished for this child.
 */
export function storyOf(kind: 'morning' | 'afternoon', items: TimelineItem[]): { rows: TimelineItem[]; minutes: number | null } | null {
  const end = items.find((i) => i.step === (kind === 'morning' ? 'reached_school' : 'dropped'));
  if (!end?.at) return null;
  const rows = items.filter((i) => i.at);
  const start = items.find((i) => i.step === (kind === 'morning' ? 'picked' : 'left_school'))?.at;
  const minutes = start ? Math.max(1, Math.round((Date.parse(end.at) - Date.parse(start)) / 60_000)) : null;
  return { rows, minutes };
}
