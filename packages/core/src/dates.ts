// Trip dates and clock times are always in Karachi time, whatever the phone's own setting.
export const KARACHI_TZ = 'Asia/Karachi';

/** The school day a moment belongs to, as YYYY-MM-DD in Karachi. Trips are stored under this date. */
export function karachiDate(at: Date): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KARACHI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/** A clock time like "7:12" in Karachi, 12-hour, Western digits (the design rule for times). */
export function karachiClock(at: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KARACHI_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(at);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  return `${hour}:${minute}`;
}

/** The hour (0-23) in Karachi: before 11 the van is on its morning run. */
export function karachiHour(at: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: KARACHI_TZ, hour: '2-digit', hour12: false }).format(at)) % 24;
}

export function defaultRunKind(at: Date): 'morning' | 'afternoon' {
  return karachiHour(at) < 11 ? 'morning' : 'afternoon';
}

/** Today's weekday (0 = Sunday), date and month (1-12) in Karachi, for "جمعرات 29 اکتوبر". */
export function karachiDayParts(at: Date): { weekday: number; date: number; month: number } {
  const [y, m, d] = karachiDate(at).split('-').map(Number) as [number, number, number];
  return { weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), date: d, month: m };
}

/** A school day n days after another (both YYYY-MM-DD). Calendar arithmetic only, so no time zone issues. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Weekday (0 = Sunday), date and month for a YYYY-MM-DD school day. */
export function dayPartsOf(date: string): { weekday: number; date: number; month: number } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), date: d, month: m };
}

/** "HH:MM:SS" (Postgres time) or "HH:MM" -> "7:10" (12-hour, Western digits); null stays null. */
export function shortTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number) as [number, number];
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}`;
}

/** Moves a stop time by some minutes, wrapping round the day; returns "HH:MM". Starts at a sensible default. */
export function nudgeTime(time: string | null | undefined, minutes: number, fallback: string): string {
  const [h, m] = (time ?? fallback).split(':').map(Number) as [number, number];
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
