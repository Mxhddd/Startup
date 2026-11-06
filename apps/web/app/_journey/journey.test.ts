import { describe, expect, it } from 'vitest';
import { arcFor, camAt, ease, flightMs, type Pose } from './camera';
import { WheelStepper, swipeStep } from './gesture';

const A: Pose = { cx: 0, cy: 0, z: 1, r: 0 };
const B: Pose = { cx: 1000, cy: 500, z: 2, r: 0.1 };

describe('camera flights', () => {
  it('starts at A and lands exactly on B', () => {
    expect(camAt(A, B, 0.8, 1, 0)).toEqual({ cx: 0, cy: 0, z: 1, r: 0 });
    const end = camAt(A, B, 0.8, 1, 1);
    expect(end.cx).toBeCloseTo(1000); expect(end.cy).toBeCloseTo(500); expect(end.z).toBeCloseTo(2); expect(end.r).toBeCloseTo(0.1);
  });
  it('pulls up and out mid-way on a long move', () => {
    expect(camAt(A, B, 1, 1, 0.5).z).toBeLessThan(Math.min(A.z, B.z));
    expect(camAt(A, B, 0, 1, 0.5).z).toBeGreaterThanOrEqual(A.z);
  });
  it('pulls out more the further it goes, within limits', () => {
    expect(arcFor(0)).toBe(0);
    expect(arcFor(3)).toBeGreaterThan(arcFor(0.5));
    expect(arcFor(1000)).toBe(1.15);
    expect(flightMs(1.15)).toBeGreaterThan(flightMs(0));
  });
  it('eases smoothly from 0 to 1', () => {
    expect(ease(0)).toBe(0); expect(ease(1)).toBe(1); expect(ease(0.5)).toBeCloseTo(0.5);
  });
});

describe('one gesture = one scene', () => {
  it('ignores a tiny nudge', () => {
    const w = new WheelStepper();
    expect(w.push(10, 0)).toBe(0);
    expect(w.push(-10, 400)).toBe(0);
  });
  it('steps once for a long trackpad flick with momentum', () => {
    const w = new WheelStepper(); let steps = 0; let t = 0;
    for (let v = 60; v > 1; v *= 0.9) { steps += Math.abs(w.push(v, t)); t += 16; }
    expect(steps).toBe(1);
  });
  it('steps again for a new flick after a pause, and backwards too', () => {
    const w = new WheelStepper();
    expect(w.push(40, 0)).toBe(1);
    expect(w.push(40, 500)).toBe(1);
    expect(w.push(-40, 1000)).toBe(-1);
  });
  it('a swipe steps once in its direction; a sideways or short swipe does nothing', () => {
    expect(swipeStep(150, 10)).toBe(1);
    expect(swipeStep(-150, 10)).toBe(-1);
    expect(swipeStep(20, 0)).toBe(0);
    expect(swipeStep(80, 200)).toBe(0);
  });
});
