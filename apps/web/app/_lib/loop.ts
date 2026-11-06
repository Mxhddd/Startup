// The school day the landing page scrolls through, as plain numbers: where each step sits on the loop
// (0 = leaving in the morning, 1 = home in the afternoon), its time, and the helpers the page uses to
// turn a scroll position into a step, a clock and minutes to your door. No React, no browser: tested.

export type LoopStep = { at: number; time: string; key: 1 | 2 | 3 | 4 | 5 | 6; half: 'am' | 'pm' };

/** The six steps of Ali's day (the same times as the brochure). */
export const LOOP_STEPS: readonly LoopStep[] = [
  { at: 0.04, time: '7:02', key: 1, half: 'am' },
  { at: 0.2, time: '7:09', key: 2, half: 'am' },
  { at: 0.3, time: '7:12', key: 3, half: 'am' },
  { at: 0.48, time: '7:41', key: 4, half: 'am' },
  { at: 0.64, time: '1:40', key: 5, half: 'pm' },
  { at: 0.94, time: '2:05', key: 6, half: 'pm' },
];

/** Index of the step the scroll has reached (-1 before the first). */
export function stepAt(progress: number, steps: readonly LoopStep[] = LOOP_STEPS): number {
  let i = -1;
  for (let k = 0; k < steps.length; k++) if (progress >= steps[k]!.at) i = k;
  return i;
}

function toMinutes(time: string, half: 'am' | 'pm'): number {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return ((half === 'pm' && h < 12 ? h + 12 : h) * 60) + m;
}

function fromMinutes(total: number): string {
  const h24 = Math.floor(total / 60);
  const m = Math.round(total - h24 * 60);
  const h = h24 > 12 ? h24 - 12 : h24;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** The clock at a scroll position: it runs between the steps' times (and jumps the school hours). */
export function clockAt(progress: number, steps: readonly LoopStep[] = LOOP_STEPS): string {
  const p = Math.min(1, Math.max(0, progress));
  const first = steps[0]!;
  const last = steps[steps.length - 1]!;
  if (p <= first.at) return first.time;
  if (p >= last.at) return last.time;
  const i = stepAt(p, steps);
  const a = steps[i]!;
  const b = steps[i + 1]!;
  const ma = toMinutes(a.time, a.half);
  const mb = toMinutes(b.time, b.half);
  // Between "reached school" and "left school" the day is at school: the clock waits, then jumps.
  if (a.half !== b.half) return p < (a.at + b.at) / 2 ? a.time : fromMinutes(mb - 5);
  return fromMinutes(ma + ((p - a.at) / (b.at - a.at)) * (mb - ma));
}

/** Minutes to your door in the morning half: 6 when the van leaves, 0 at your door, then null. */
export function etaAt(progress: number, steps: readonly LoopStep[] = LOOP_STEPS): number | null {
  const left = steps[0]!.at;
  const door = steps[1]!.at;
  if (progress < left) return 6;
  if (progress >= door) return null;
  return Math.max(0, Math.ceil(6 * (1 - (progress - left) / (door - left)) - 1e-9));
}

/** How warm the arch window's light is: 0 (cool neel, far away) to 1 (kesar, at your door). */
export function warmth(minutes: number | null, far = 6): number {
  if (minutes === null) return 1;
  return Math.min(1, Math.max(0, 1 - minutes / far));
}

/** Small seeded random numbers, so the paper-cut street is the same on every build. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One pointed arch (flat bottom) in a box at x,y of w x h: the ETA window and the street's lit window. */
export function arch(x: number, y: number, w: number, h: number): string {
  const n = (v: number) => Math.round(v * 10) / 10;
  return (
    `M${n(x)} ${n(y + h)} L${n(x)} ${n(y + h * 0.42)} C${n(x)} ${n(y + h * 0.18)} ${n(x + w * 0.28)} ${n(y + h * 0.07)} ${n(x + w / 2)} ${n(y)} ` +
    `C${n(x + w * 0.72)} ${n(y + h * 0.07)} ${n(x + w)} ${n(y + h * 0.18)} ${n(x + w)} ${n(y + h * 0.42)} L${n(x + w)} ${n(y + h)} Z`
  );
}
