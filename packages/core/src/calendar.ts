// Planned chutti (v8): the month grid a parent taps days on, and what changed when they save.
// Dates are Karachi school days as YYYY-MM-DD (see dates.ts); no time zones are involved here.
import { addDays } from './dates';

/** How far ahead a day off can be planned (the server checks the same limit). */
export const PLAN_AHEAD_DAYS = 60;

/** The weeks of a month (Sunday first), each a row of 7 dates or null for the days outside the month. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Whether a day can be planned off: from today up to PLAN_AHEAD_DAYS ahead. */
export function canPlanDay(date: string, today: string): boolean {
  return date >= today && date <= addDays(today, PLAN_AHEAD_DAYS);
}

/** Which days to mark off and which to clear, going from what is saved to what the parent chose. */
export function chuttiChanges(saved: string[], chosen: string[]): { add: string[]; clear: string[] } {
  const was = new Set(saved);
  const now = new Set(chosen);
  return { add: [...now].filter((d) => !was.has(d)).sort(), clear: [...was].filter((d) => !now.has(d)).sort() };
}

/** The next month after (year, month). */
export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
