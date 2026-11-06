// One gesture = one scene. Turns a stream of wheel deltas into single steps: it waits for ~30 px of
// intent, steps once, then ignores the rest of that gesture (trackpad momentum). A new gesture starts
// after a short quiet gap, when the scroll swings harder again, or when the direction flips.

export class WheelStepper {
  private acc = 0;
  private last = -Infinity;
  private prevAbs = 0;
  private used = false;
  private start = 0;

  constructor(private readonly threshold = 30, private readonly gapMs = 200) {}

  /** Feed one wheel event (pixels, + is down). Returns +1 / -1 when a step should happen, else 0. */
  push(dy: number, now: number): -1 | 0 | 1 {
    const a = Math.abs(dy);
    const fresh = now - this.last > this.gapMs || (a > this.prevAbs * 1.8 + 4 && now - this.start > 140) || (this.acc !== 0 && Math.sign(dy) !== Math.sign(this.acc));
    this.last = now;
    this.prevAbs = a;
    if (fresh) { this.acc = 0; this.used = false; this.start = now; }
    if (this.used) return 0;
    this.acc += dy;
    if (Math.abs(this.acc) > this.threshold) { this.used = true; return this.acc > 0 ? 1 : -1; }
    return 0;
  }
}

/** A swipe on a phone: one step when it is long enough and mostly vertical. */
export function swipeStep(dy: number, dx: number, min = 36): -1 | 0 | 1 {
  if (Math.abs(dy) <= min || Math.abs(dy) <= Math.abs(dx)) return 0;
  return dy > 0 ? 1 : -1;
}
