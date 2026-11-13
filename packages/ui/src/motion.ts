// The motion spec: every animation in both apps takes its springs and timings from here, so a press,
// a sheet and a tick all feel like one family. Springs follow physics (they settle, never "end"), which
// is what makes iOS feel smooth: an interrupted animation carries its speed into the next one.
//
// damping: how quickly it calms down (higher = less bounce). stiffness: how hard it pulls (higher = faster).
// mass: how heavy it feels.

export const springs = {
  /** A finger goes down: quick and firm, no bounce. */
  press: { damping: 32, stiffness: 900, mass: 0.5 },
  /** The finger lifts: back up with a small, lively overshoot. */
  release: { damping: 16, stiffness: 480, mass: 0.6 },
  /** The bottom sheet and anything the size of the screen: heavy, calm, no wobble. */
  sheet: { damping: 30, stiffness: 380, mass: 0.9 },
  /** A tick or badge that pops in: one clear bounce. */
  pop: { damping: 13, stiffness: 420, mass: 0.6 },
  /** Things moving to make room (a row turning done, a list reflowing). */
  layout: { damping: 26, stiffness: 300, mass: 0.8 },
  /** Numbers rolling to their new value. */
  number: { damping: 22, stiffness: 320, mass: 0.7 },
} as const;

/** Timings for things that are not springs (fades, the hold fill, the undo countdown). In ms. */
export const durations = {
  fade: 140,
  enter: 200,
  /** A screen pushing in or out (v21: 360 → 240, so a tap lands at once). */
  screen: 240,
  /** The gap between items of a list coming in one after another. */
  stagger: 35,
  /** The van marker's breathing halo, one full cycle. */
  pulse: 2000,
  /** The van gliding between two positions (positions come every 5 s). */
  glide: 4800,
} as const;

/** v21: the website's two easing curves (tokens.css --calm and --glide), so the apps and pohnch.pk move alike.
 *  Pass to Reanimated's Easing.bezier(...curve). */
export const curves = { calm: [0.22, 0.8, 0.2, 1], glide: [0.65, 0, 0.35, 1] } as const;

/** How far a pressed thing sinks: big buttons barely, small ones a little more (they need the feedback). */
export const pressScale = { big: 0.975, small: 0.95, chip: 0.92 } as const;

/** The delay for the n-th item of a list, capped so a long list never waits. */
export function staggerDelay(index: number, cap = 8): number {
  return Math.min(Math.max(0, index), cap) * durations.stagger;
}

/** Rubber band: past an edge, a drag moves less and less (like iOS scroll views). */
export function rubberBand(overshoot: number, dimension: number, coefficient = 0.55): number {
  'worklet';
  const sign = overshoot < 0 ? -1 : 1;
  const x = Math.abs(overshoot);
  return sign * (1 - 1 / ((x * coefficient) / dimension + 1)) * dimension;
}

/** Where a flung sheet will come to rest, from its position and speed (px/s): pick the nearer snap. */
export function pickSnap(position: number, velocity: number, snaps: readonly number[]): number {
  'worklet';
  const projected = position + velocity * 0.2; // where it would coast to in about 200 ms
  let best = snaps[0] ?? 0;
  for (const s of snaps) if (Math.abs(s - projected) < Math.abs(best - projected)) best = s;
  return best;
}
