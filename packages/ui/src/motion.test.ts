import { describe, expect, it } from 'vitest';
import { durations, pickSnap, pressScale, rubberBand, springs, staggerDelay } from './motion';

describe('motion', () => {
  it('staggers list items and caps the wait', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBe(2 * durations.stagger);
    expect(staggerDelay(40)).toBe(8 * durations.stagger);
    expect(staggerDelay(-3)).toBe(0);
  });

  it('rubber bands: the further past the edge, the less it moves, never past the dimension', () => {
    const a = rubberBand(50, 400);
    const b = rubberBand(500, 400);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(50);
    expect(b - a).toBeLessThan(500 - 50);
    expect(rubberBand(1e9, 400)).toBeLessThanOrEqual(400);
    expect(rubberBand(-50, 400)).toBeCloseTo(-a);
  });

  it('a flick picks the snap it is heading for, a slow drag the nearest', () => {
    const snaps = [0, 300];
    expect(pickSnap(200, 0, snaps)).toBe(300); // nearest
    expect(pickSnap(200, -1500, snaps)).toBe(0); // flicked up
    expect(pickSnap(100, 1500, snaps)).toBe(300); // flicked down
  });

  it('presses sink a little, never so much that the label jumps', () => {
    for (const v of Object.values(pressScale)) {
      expect(v).toBeGreaterThan(0.9);
      expect(v).toBeLessThan(1);
    }
    expect(springs.press.damping).toBeGreaterThan(springs.release.damping); // press is firm, release lively
  });
});
