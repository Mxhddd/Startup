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

/** v10: one school day for the week story (a day with a morning run). */
export type StoryDay = { date: string; minutes: number | null; rode: boolean };

/**
 * v10 "Week story": the child's week as a small chart for a share card. Only days with a morning run
 * count. A bar's height is that day's ride against the longest (at least 0.18 so it shows); a day the
 * child didn't ride is a short bar in another colour. Carries nothing but numbers: the card adds only
 * the child's first name (no map, no place, no times of day).
 */
export function weekStory(days: StoryDay[]): { schoolDays: number; rode: number; avgMinutes: number | null; bars: { date: string; height: number; rode: boolean }[] } {
  const rides = days.filter((d) => d.rode && d.minutes !== null).map((d) => d.minutes as number);
  const longest = Math.max(1, ...rides);
  const avg = rides.length ? Math.round(rides.reduce((a, b) => a + b, 0) / rides.length) : null;
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return {
    schoolDays: days.length,
    rode: days.filter((d) => d.rode).length,
    avgMinutes: avg,
    bars: ordered.map((d) => ({ date: d.date, rode: d.rode, height: d.rode && d.minutes !== null ? Math.max(0.18, d.minutes / longest) : 0.18 })),
  };
}
