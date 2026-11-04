// v12: the small rules behind the new features (tested in v12.test.ts). No screens, no network.

/** Minutes from midnight for "HH:MM" or "HH:MM:SS". */
export function clockMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Minutes past midnight in Karachi for a moment (UTC+5, no daylight saving). */
export function karachiMinutes(now: number): number {
  const d = new Date(now + 5 * 3600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Late warning: how many minutes after the stop's planned time the van will arrive, by the current
 * estimate. 0 when on time or early. Only says "late" from `threshold` minutes (default 5) so small
 * wobbles don't alarm anyone.
 */
export function lateBy(etaMinutes: number | null, now: number, planned: string | null | undefined, threshold = 5): number {
  if (etaMinutes === null || !planned) return 0;
  const late = karachiMinutes(now) + etaMinutes - clockMinutes(planned);
  return late >= threshold ? Math.round(late) : 0;
}

/**
 * Learned ETA: blend the live estimate with what this stop usually takes (the median minutes from the
 * van's start to this child, from past runs). Early in a run the history helps most; as the van gets
 * close, the live estimate wins. Returns whole minutes, never negative; null if there's nothing to go on.
 */
export function blendEta(live: number | null, learnedTotal: number | null, startedAt: number | null, now: number): number | null {
  const learned = learnedTotal !== null && startedAt !== null ? Math.max(0, learnedTotal - (now - startedAt) / 60_000) : null;
  if (live === null) return learned === null ? null : Math.round(learned);
  if (learned === null) return Math.max(0, Math.round(live));
  // Weight history less as the live estimate gets small (close to the door).
  const w = Math.min(0.5, Math.max(0, (live - 3) / 20));
  return Math.max(0, Math.round(live * (1 - w) + learned * w));
}

/** Get-ready alert: due once the van is this many minutes away (or nearer), and not already sent. */
export function getReadyDue(eta: number | 'door' | null, prepMinutes: number, alreadySent: boolean): boolean {
  if (alreadySent || prepMinutes <= 0 || eta === null) return false;
  return eta === 'door' || eta <= prepMinutes;
}

type Pt = { id: string; lat: number; lng: number };
const R = 6371;
/** Distance in km between two points (haversine). */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function routeKm(order: Pt[], end?: { lat: number; lng: number } | null): number {
  let d = 0;
  for (let i = 1; i < order.length; i++) d += km(order[i - 1] as Pt, order[i] as Pt);
  if (end && order.length) d += km(order[order.length - 1] as Pt, end);
  return d;
}

/**
 * Best stop order for the morning: start from the current first stop, visit every stop, end at the
 * school (if its pin is set). Nearest neighbour, then 2-opt to untangle crossings. For a van's
 * handful of stops this finds the best or very nearly the best order. Returns the order and the km saved.
 */
export function bestOrder(stops: Pt[], school?: { lat: number; lng: number } | null): { order: string[]; km: number; savedKm: number } {
  if (stops.length < 3) return { order: stops.map((s) => s.id), km: routeKm(stops, school), savedKm: 0 };
  const start = stops[0] as Pt;
  const left = stops.slice(1);
  const route: Pt[] = [start];
  while (left.length) {
    const last = route[route.length - 1] as Pt;
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (km(last, left[i] as Pt) < km(last, left[bi] as Pt)) bi = i;
    route.push(left.splice(bi, 1)[0] as Pt);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const next = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
        if (routeKm(next, school) + 1e-9 < routeKm(route, school)) {
          route.splice(0, route.length, ...next);
          improved = true;
        }
      }
    }
  }
  const now = routeKm(stops, school);
  const best = routeKm(route, school);
  return { order: route.map((s) => s.id), km: best, savedKm: Math.max(0, Math.round((now - best) * 10) / 10) };
}

/**
 * Pakistan's public holidays (federal) for 2026-27. Islamic dates follow the moon and can move a day;
 * they are marked so the app says "about". Schools close on all of them.
 */
export const PK_HOLIDAYS: { date: string; key: string; moon?: boolean }[] = [
  { date: '2026-02-05', key: 'kashmir' }, { date: '2026-03-21', key: 'eidFitr', moon: true }, { date: '2026-03-23', key: 'pakistan' },
  { date: '2026-05-01', key: 'labour' }, { date: '2026-05-27', key: 'eidAdha', moon: true }, { date: '2026-05-28', key: 'takbeer' },
  { date: '2026-06-25', key: 'ashura', moon: true }, { date: '2026-08-14', key: 'independence' }, { date: '2026-08-25', key: 'milad', moon: true },
  { date: '2026-11-09', key: 'iqbal' }, { date: '2026-12-25', key: 'quaid' },
  { date: '2027-02-05', key: 'kashmir' }, { date: '2027-03-10', key: 'eidFitr', moon: true }, { date: '2027-03-23', key: 'pakistan' },
  { date: '2027-05-01', key: 'labour' }, { date: '2027-05-17', key: 'eidAdha', moon: true }, { date: '2027-05-28', key: 'takbeer' },
  { date: '2027-06-15', key: 'ashura', moon: true }, { date: '2027-08-14', key: 'independence' }, { date: '2027-08-15', key: 'milad', moon: true },
  { date: '2027-11-09', key: 'iqbal' }, { date: '2027-12-25', key: 'quaid' },
];

/** Holidays from today through the next `days` days (a weekday only: weekends have no runs anyway). */
export function upcomingHolidays(today: string, days = 14): { date: string; key: string; moon?: boolean }[] {
  const end = new Date(`${today}T00:00:00Z`).getTime() + days * 86400_000;
  return PK_HOLIDAYS.filter((h) => {
    const t = new Date(`${h.date}T00:00:00Z`).getTime();
    const wd = new Date(t).getUTCDay();
    return h.date >= today && t <= end && wd !== 0;
  });
}

export type Season = 'ramadan' | 'eid' | 'independence' | 'monsoon' | null;
const RAMADAN: [string, string][] = [['2026-02-18', '2026-03-19'], ['2027-02-08', '2027-03-09']];
const EID: [string, string][] = [['2026-03-20', '2026-03-23'], ['2026-05-26', '2026-05-29'], ['2027-03-10', '2027-03-13'], ['2027-05-16', '2027-05-19']];
/** The season the sky dresses for on a Karachi date (YYYY-MM-DD). */
export function seasonFor(date: string): Season {
  if (RAMADAN.some(([a, b]) => date >= a && date <= b)) return 'ramadan';
  if (EID.some(([a, b]) => date >= a && date <= b)) return 'eid';
  const md = date.slice(5);
  if (md >= '08-01' && md <= '08-14') return 'independence';
  if (md >= '07-01' && md <= '09-10') return 'monsoon';
  return null;
}

/** On-time streak: school days in a row (newest first) the child rode; days off don't break it. */
export function onTimeStreak(days: { rode: boolean; off: boolean }[]): number {
  let n = 0;
  for (const d of days) {
    if (d.off) continue;
    if (!d.rode) break;
    n++;
  }
  return n;
}

/**
 * Stuck in traffic: the van has barely moved for `minutes` while not at a stop. Speeds are the trip's
 * recent fixes in m/s, newest first, one per ~30 s when slow. Suggests a one-tap "traffic" delay.
 */
export function stuckInTraffic(recent: { speed: number | null; atStop: boolean; at: number }[], now: number, minutes = 5): boolean {
  const since = now - minutes * 60_000;
  const window = recent.filter((r) => r.at >= since);
  if (window.length < 4) return false;
  if (recent.some((r) => r.at < since) === false) return false; // need a full window of history
  return window.every((r) => !r.atStop && (r.speed ?? 0) < 1.5);
}

/** Rain from Open-Meteo's current reading: mm of rain in the last hour, or a rainy weather code. */
export function isRaining(current: { rain?: number | null; precipitation?: number | null; weather_code?: number | null } | null | undefined): boolean {
  if (!current) return false;
  const mm = Math.max(current.rain ?? 0, current.precipitation ?? 0);
  const code = current.weather_code ?? 0;
  return mm >= 0.3 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

/** Speed watch: 50 km/h (13.9 m/s) on Karachi's school roads. */
export const SPEED_LIMIT_MS = 13.9;
/** Warn the driver when over the limit, at most once every `coolMs` (2 min), so it nudges, not nags. */
export function speedWarn(speed: number | null | undefined, lastWarnAt: number | null, now: number, coolMs = 120_000): boolean {
  if (speed == null || speed <= SPEED_LIMIT_MS) return false;
  return lastWarnAt === null || now - lastWarnAt >= coolMs;
}
export const kmh = (ms: number) => Math.round(ms * 3.6);

/** The pre-trip checklist shows once per Karachi day, before the first real trip. */
export function preTripDue(lastDoneDate: string | null, today: string): boolean {
  return lastDoneDate !== today;
}

/** "07:10" moved by some minutes ("07:25"), kept within the day. */
export function shiftTime(t: string, minutes: number): string {
  const m = Math.min(23 * 60 + 59, Math.max(0, clockMinutes(t) + minutes));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
