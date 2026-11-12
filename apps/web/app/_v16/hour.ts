// The hour of the day as one number the whole page shares: 0 = dawn, 1 = late morning, 2 = golden
// afternoon, 3 = night. The 3D light, the sky and the page colours all read it. Also: the hour in
// Karachi right now (the hero's "live clock"), and small easing helpers. Pure maths, tested.

export const clamp = (v: number, a = 0, b = 1): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Calm ease: slow start, slow end (cubic in-out). */
export const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Progress of v between a and b, clamped to 0..1. */
export const span = (v: number, a: number, b: number): number => clamp((v - a) / (b - a));

/** Karachi clock time (hours, 0..24) for a given moment. */
export function karachiHours(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h + m / 60;
}

/** Maps clock time to the page's hour scale: night until 5, dawn 5-7, day to 15, golden to 18:30, night after 19:30. */
export function hourOfClock(t: number): number {
  if (t < 5 || t >= 19.5) return 3;
  if (t < 7) return lerp(0, 0.5, (t - 5) / 2);
  if (t < 12) return lerp(0.5, 1, (t - 7) / 5);
  if (t < 15) return 1 + (t - 12) / 3 * 0.3;
  if (t < 18.5) return lerp(1.3, 2, (t - 15) / 3.5);
  return lerp(2, 3, (t - 18.5) / 1);
}

/** Calls a school year for a number of calls each school morning (190 school days). */
export const SCHOOL_DAYS = 190;
export const callsAYear = (perMorning: number): number => Math.max(0, Math.round(perMorning)) * SCHOOL_DAYS;

/** The sky colour for an hour (for the lite page, which has no 3D): dawn peach, day sand, golden, night ink. */
const SKY: [number, number, number][] = [[243, 210, 188], [237, 227, 208], [239, 192, 142], [16, 22, 47]];
export function skyHex(hour: number): string {
  const h = clamp(hour, 0, 3), i = Math.min(2, Math.floor(h)), t = h - i, a = SKY[i]!, b = SKY[i + 1]!;
  return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k]!, t))).join(',')})`;
}

/* ---------- "Right now in Karachi" (v18): what school vans are doing at this hour, by the clock ---------- */
export type NowKey = 'night' | 'early' | 'morning' | 'school' | 'afternoon' | 'evening' | 'sunday';
/** Karachi's clock (hour 0–23, minute, weekday 0 = Sunday) for a moment. */
export function karachiClock(now: Date): { h: number; m: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { h: Number(get('hour')), m: Number(get('minute')), day: Math.max(0, day) };
}
/** What the vans are doing at this time (by the clock, not live): night, getting ready, the morning run,
 *  school time, the afternoon run, evening; Sunday has no school run. */
export function nowKey(h: number, m: number, day: number): NowKey {
  const t = h + m / 60;
  if (t < 5.5 || t >= 20) return 'night';
  if (day === 0) return 'sunday';
  if (t < 6.5) return 'early';
  if (t < 8) return 'morning';
  if (t < 12.5) return 'school';
  if (t < 15) return 'afternoon';
  return 'evening';
}
/** "07:12" style, Western digits (the site's rule for times). */
export const hhmm = (h: number, m: number): string => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
