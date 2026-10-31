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
