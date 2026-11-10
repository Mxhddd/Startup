// The home page's scroll choreography (v16): where the 3D camera is, what hour it is, how much colour
// and route there is, and where the van is, for any scroll position. The page measures a single
// number S = section index + progress through that section (0..1, measured where the middle of the
// screen is), and worldAt(S) returns the world for it. Pure maths over a few anchor values, tested.
import { clamp, ease, lerp, span } from './hour';
import type { Pose, WorldState } from './world3d';

export const SECTIONS = ['hero', 'calls', 'sides', 'morning', 'lock', 'try', 'fork', 'promises', 'never', 'calc', 'band', 'join', 'faq'] as const;
export type SectionId = (typeof SECTIONS)[number];
export const sIndex = (id: SectionId): number => SECTIONS.indexOf(id);

export type Ctx = {
  liveHour: number;                       // the hero's hour, from Karachi's clock
  heroT: number;                          // seconds since the hero appeared (the van drives in)
  uHome: number; uFork: number;           // where your home and the roundabout are on the route
  routeAt: (u: number) => [number, number];
};

const P = (tx: number, tz: number, dist: number, az: number, el: number, fov = 22): Pose => ({ tx, tz, dist, az, el, fov });
export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const e = ease(clamp(t));
  // a long move lifts a little (pull out, then dive in), like a map app
  const far = Math.hypot(b.tx - a.tx, b.tz - a.tz);
  const lift = Math.sin(Math.PI * e) * Math.min(0.6, far / 400);
  return { tx: lerp(a.tx, b.tx, e), tz: lerp(a.tz, b.tz, e), dist: lerp(a.dist, b.dist, e) * (1 + lift), az: lerp(a.az, b.az, e), el: lerp(a.el, b.el, e) + lift * 0.15, fov: lerp(a.fov ?? 22, b.fov ?? 22, e) };
}

/** The world at scroll position S. */
export function worldAt(S: number, c: Ctx): WorldState {
  const i = Math.max(0, Math.min(SECTIONS.length - 1, Math.floor(S)));
  const t = clamp(S - i);
  const id = SECTIONS[i]!;
  const [hx, hz] = c.routeAt(c.uHome);
  const base: WorldState = { pose: P(hx + 20, hz - 6, 230, 1.15, 0.6), hour: 0.5, grey: 0, lit: 1, u: c.uHome, brake: false, school: 0, homePin: 1 };
  const heroU = lerp(Math.max(0, c.uHome - 0.16), c.uHome - 0.012, ease(clamp(c.heroT / 9)));
  const HERO = P(hx + 26, hz - 10, 240, 1.12, 0.6);
  const CALLS = P(hx - 4, hz + 4, 120, 1.32, 0.42, 24);
  const OVER = P(-20, 10, 360, 1.05, 0.88, 26);
  const vanPose = (u: number, dist: number, az: number, el: number) => { const [x, z] = c.routeAt(u); return P(x, z, dist, az, el, 24); };

  switch (id) {
    case 'hero':
      return { ...base, pose: mixPose(HERO, CALLS, span(t, 0.55, 1) * 0.6), hour: c.liveHour, u: heroU, brake: c.heroT > 7.5 && c.heroT < 9.5 };
    case 'calls': {
      // grey morning, calls stack up; at 0.62 Pohnch switches on: colour returns, the route draws itself
      const sw = span(t, 0.58, 0.82);
      const pose = t < 0.6 ? mixPose(mixPose(HERO, CALLS, 0.6), CALLS, span(t, 0, 0.3)) : mixPose(CALLS, OVER, span(t, 0.62, 1));
      return { ...base, pose, hour: lerp(c.liveHour > 2.5 && t < 0.2 ? 3 : 0.12, 0.45, sw), grey: 1 - sw, lit: span(t, 0.6, 0.88), u: lerp(c.uHome - 0.012, 0.0, span(t, 0, 0.2)), homePin: 1 };
    }
    case 'sides': {
      // close on the van at the first stop; the camera circles it slowly
      const u = lerp(0.02, c.uHome * 0.6, span(t, 0.3, 0.75));
      const A = vanPose(0.02, 150, 0.75, 0.5), B = vanPose(c.uHome * 0.6, 140, 1.6, 0.52);
      return { ...base, pose: t < 0.12 ? mixPose(OVER, A, span(t, 0, 0.12)) : mixPose(A, B, span(t, 0.12, 1)), hour: lerp(0.45, 0.6, t), u, brake: t > 0.78 };
    }
    case 'morning': {
      // the van drives the whole route as you scroll; the camera follows it
      const u = lerp(c.uHome * 0.6, 1, ease(span(t, 0.04, 0.92)));
      const az = lerp(1.6, 2.2, t), dist = lerp(120, 150, Math.sin(Math.PI * t));
      const follow = vanPose(u, dist, az, 0.62);
      const pose = t < 0.06 ? mixPose(vanPose(c.uHome * 0.6, 140, 1.6, 0.52), follow, span(t, 0, 0.06)) : follow;
      const stops = [c.uHome, c.uHome + 0.01, 1];
      const brake = stops.some((s) => Math.abs(u - s) < 0.012) && t < 0.95;
      return { ...base, pose, hour: lerp(0.6, 1.05, t), u, brake, school: span(t, 0.88, 1) };
    }
    case 'lock': {
      // back at your door, close and low, the van parked outside
      const A = vanPose(1, 120, 2.2, 0.62), B = P(hx, hz + 2, 95, 1.25, 0.4, 26);
      return { ...base, pose: mixPose(A, B, span(t, 0, 0.25)), hour: lerp(1.05, 0.8, span(t, 0, 0.25)), u: c.uHome, brake: true, school: 1 - span(t, 0, 0.2) };
    }
    case 'try': {
      const A = P(hx, hz + 2, 95, 1.25, 0.4, 26), B = P(-40, 30, 300, 1.2, 0.8, 26);
      return { ...base, pose: mixPose(A, B, t), hour: lerp(0.8, 1.0, t), u: lerp(c.uHome, c.uFork, span(t, 0.2, 1)) };
    }
    case 'fork': {
      const [fx, fz] = c.routeAt(c.uFork);
      const A = P(-40, 30, 300, 1.2, 0.8, 26), B = P(fx + 2, fz - 2, 120, 1.3, 0.78, 24);
      return { ...base, pose: mixPose(A, B, span(t, 0, 0.35)), hour: 1.0, u: c.uFork, brake: true };
    }
    case 'promises': {
      // behind the van, low: its back window carries the promise stickers
      const uP = c.uFork + 0.06; const [vx, vz] = c.routeAt(uP);
      const B = P(vx, vz + 2, 48, -1.57 + 0.0, 0.2, 30);
      const [fx, fz] = c.routeAt(c.uFork);
      return { ...base, pose: mixPose(P(fx + 2, fz - 2, 120, 1.3, 0.78, 24), B, span(t, 0, 0.22)), hour: lerp(1.05, 1.35, t), u: uP, brake: true };
    }
    case 'never': case 'calc': case 'band': {
      const k = (i - sIndex('never') + t) / 3;
      const drift = P(lerp(0, 40, k), lerp(-10, 20, k), lerp(320, 380, k), lerp(1.0, 1.5, k), 0.82, 26);
      const [vx, vz] = c.routeAt(c.uFork + 0.06);
      const pose = k < 0.12 ? mixPose(P(vx, vz + 2, 48, -1.57, 0.2, 30), drift, span(k, 0, 0.12)) : drift;
      return { ...base, pose, hour: lerp(1.4, 2.1, k), u: lerp(c.uFork + 0.06, 0.95, k), homePin: 0 };
    }
    case 'join': case 'faq': {
      const k = id === 'join' ? t : 1;
      return { ...base, pose: P(lerp(40, -20, ease(k)), lerp(20, 0, ease(k)), lerp(380, 460, k), lerp(1.5, 1.8, k), lerp(0.82, 0.95, k), 26), hour: lerp(2.1, 3, span(k, 0, 0.5)), u: 1, homePin: 0, school: 0.6 };
    }
  }
  return base;
}

/** S for a scroll position: the section under the middle of the screen, and how far through it that point is. */
export function scrollS(scrollY: number, vh: number, tops: number[], heights: number[]): number {
  const mid = scrollY + vh * 0.5;
  let i = 0;
  for (let k = 0; k < tops.length; k++) if (mid >= tops[k]!) i = k;
  return i + clamp((mid - tops[i]!) / Math.max(1, heights[i]!));
}

/** Progress through a pinned (sticky) section: 0 when it reaches the top, 1 when it starts to leave. */
export function pinned(scrollY: number, vh: number, top: number, height: number): number {
  return clamp((scrollY - top) / Math.max(1, height - vh));
}
