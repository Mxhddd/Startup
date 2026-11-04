// v9 glide: where to draw the van between real positions, so it never jumps and never stalls.
//
// Positions arrive every ~5 s. Between them the van keeps rolling the way it was going (dead
// reckoning: the last speed and direction, gently slowing), for at most MAX_AHEAD_MS. When a new real
// position arrives, the drawn van eases from where it is drawn now into the new path over EASE_MS,
// so a correction is a smooth curve, not a hop.
import { lerpLatLng, type LatLng } from './motion';

export const MAX_AHEAD_MS = 4000;
export const EASE_MS = 1600;
/** Below this (m/s) the van counts as stopped: no rolling ahead. */
export const ROLL_MIN_MPS = 0.8;

export type Fix = { at: number; p: LatLng };
export type GlideState = {
  /** The newest real position and the one before it. */
  last: Fix;
  prev: Fix | null;
  /** Where the van was drawn when `last` arrived, and when. */
  from: LatLng;
  fromAt: number;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const M_PER_DEG = 111_320;

/** Metres per second between two fixes (flat-earth, fine over a few hundred metres). */
export function speedOf(a: Fix, b: Fix): number {
  const dt = (b.at - a.at) / 1000;
  if (dt <= 0) return 0;
  const dy = (b.p.latitude - a.p.latitude) * M_PER_DEG;
  const dx = (b.p.longitude - a.p.longitude) * M_PER_DEG * Math.cos((a.p.latitude * Math.PI) / 180);
  return Math.hypot(dx, dy) / dt;
}

/** Where the real van probably is now: the last fix, carried forward along its last motion. */
export function predicted(s: Pick<GlideState, 'last' | 'prev'>, now: number): LatLng {
  const { last, prev } = s;
  if (!prev || last.at <= prev.at || speedOf(prev, last) < ROLL_MIN_MPS) return last.p;
  const ahead = Math.min(Math.max(0, now - last.at), MAX_AHEAD_MS);
  // Carry on at the last velocity, slowing gently (a van seldom keeps exactly the same speed).
  const fade = Math.exp(-ahead / 6000);
  const k = ((ahead / (last.at - prev.at)) * (1 + fade)) / 2;
  return {
    latitude: last.p.latitude + (last.p.latitude - prev.p.latitude) * k,
    longitude: last.p.longitude + (last.p.longitude - prev.p.longitude) * k,
  };
}

/** Where to draw the van at `now`. */
export function glidePosition(s: GlideState, now: number): LatLng {
  const target = predicted(s, now);
  const t = Math.min(1, Math.max(0, (now - s.fromAt) / EASE_MS));
  return lerpLatLng(s.from, target, easeInOut(t));
}
