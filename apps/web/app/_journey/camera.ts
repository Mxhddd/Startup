// The city journey's camera: easing, and the flight between two scenes. A long move pulls up and out
// mid-way, then dives in (like a map app), with a gentle bank into the turn. Pure maths, tested.

export type Pose = { cx: number; cy: number; z: number; r: number };

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Slow in, fast middle, slow out (cubic). */
export const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** A softer, symmetric curve (half a cosine). */
export const easeIO = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * How much to pull out mid-flight: none for a short hop, more for a long one (in screens travelled).
 * `screens` is the distance between the two centres divided by the screen's larger side, at the
 * closer of the two zooms.
 */
export function arcFor(screens: number): number {
  return clamp(Math.log(1 + Math.max(0, screens)) * 0.75, 0, 1.15);
}

/** How long a flight lasts, in ms (longer when it pulls out further). */
export function flightMs(arc: number, long = false): number {
  return 1350 + arc * 520 + (long ? 300 : 0);
}

/** The camera at progress k (0..1) of a flight from A to B. `dir` (+1/-1) sets which way it banks. */
export function camAt(A: Pose, B: Pose, arc: number, dir: number, k: number, bankOn = true): Pose {
  const t = clamp(k, 0, 1);
  const e = easeIO(t);
  const e2 = ease(t);
  const lz = lerp(Math.log(A.z), Math.log(B.z), e2) - arc * Math.sin(Math.PI * e);
  const bank = bankOn ? Math.sin(Math.PI * e) * 0.05 * dir : 0;
  return { cx: lerp(A.cx, B.cx, e2), cy: lerp(A.cy, B.cy, e2), z: Math.exp(lz), r: lerp(A.r, B.r, e2) + bank };
}
