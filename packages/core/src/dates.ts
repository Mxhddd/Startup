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
