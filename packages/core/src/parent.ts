// The parent app's sums: how far, how many minutes, and what today's timeline shows.
import type { LatLng } from './motion';

/** Straight-line distance in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Karachi city driving: roads are ~35% longer than the straight line; a van averages 15-50 km/h;
// each stop before yours takes about 45 seconds.
const ROAD_FACTOR = 1.35;
const DEFAULT_SPEED_MS = 5.5; // about 20 km/h
const MIN_SPEED_MS = 3;
const MAX_SPEED_MS = 14;
const DWELL_S = 45;
/** Closer than this, the van is at your door. */
export const AT_DOOR_M = 150;

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/**
 * Minutes until the van reaches a point (your stop, or school). 'door' when it is already there.
 * recentSpeeds: the last few positions' speeds in m/s (stops at lights are ignored).
 */
export function etaMinutes(opts: { van: LatLng; target: LatLng; recentSpeeds: (number | null)[]; stopsAhead: number }): number | 'door' {
  const d = distanceM(opts.van, opts.target);
  if (d <= AT_DOOR_M && opts.stopsAhead === 0) return 'door';
  const moving = opts.recentSpeeds.filter((s): s is number => s !== null && s >= 1.4);
  const speed = Math.min(MAX_SPEED_MS, Math.max(MIN_SPEED_MS, median(moving) ?? DEFAULT_SPEED_MS));
  const seconds = (d * ROAD_FACTOR) / speed + Math.max(0, opts.stopsAhead) * DWELL_S;
  return Math.max(1, Math.round(seconds / 60));
}

export type TripStep = 'left' | 'picked' | 'arriving' | 'reached_school' | 'left_school' | 'dropped' | 'late';
export type ParentEvent = { step: TripStep; childId: string | null; happenedAt: string; by: string | null; undone: boolean; reason?: string | null };
export type TimelineItem = { step: Exclude<TripStep, 'arriving' | 'late'>; at: string | null; by: string | null };

const SEQUENCE: Record<'morning' | 'afternoon', TimelineItem['step'][]> = {
  morning: ['left', 'picked', 'reached_school'],
  afternoon: ['left_school', 'dropped'],
};

/**
 * Today's timeline for one child: each step of the run, done (with time and who) or still to come.
 * Van-wide steps count for everyone; picked/dropped only for this child. Undone taps don't count.
 */
export function timelineFor(kind: 'morning' | 'afternoon', childId: string, events: ParentEvent[]): {
  items: TimelineItem[];
  arriving: boolean;
  late: string | null;
} {
  const live = events.filter((e) => !e.undone && (e.childId === null || e.childId === childId));
  const latest = (step: TripStep) =>
    live.filter((e) => e.step === step).sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))[0];
  const items = SEQUENCE[kind].map((step) => {
    const e = latest(step);
    return { step, at: e?.happenedAt ?? null, by: e?.by ?? null };
  });
  const childStep = kind === 'morning' ? 'picked' : 'dropped';
  const done = items.find((i) => i.step === childStep)?.at != null;
  const lateEvent = latest('late');
  return { items, arriving: !done && !!latest('arriving'), late: lateEvent?.reason ?? null };
}

/** "Aaj chutti" can be undone until the van's morning "left" tap (the server enforces the same rule). */
export function canUndoChutti(date: string, today: string, vanLeftToday: boolean): boolean {
  if (date > today) return true;
  if (date < today) return false;
  return !vanLeftToday;
}

/**
 * The route-dots line for the Android ongoing notification and the Live Activity: dots done, the van as
 * a star, and the stops still ahead of yours, ending at your stop. Five places in all.
 */
export function routeDotsLine(stopsAhead: number | null, slots = 5): string {
  const ahead = Math.max(0, Math.min(slots - 2, stopsAhead ?? 0));
  const done = slots - 2 - ahead;
  return ['●'.repeat(done), '★', '○'.repeat(ahead), '◉'].join('');
}
