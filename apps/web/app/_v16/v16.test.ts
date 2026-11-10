import { describe, expect, it } from 'vitest';
import { callsAYear, hourOfClock, span } from './hour';
import { SECTIONS, mixPose, pinned, scrollS, worldAt, type Ctx } from './scenes';

const ctx: Ctx = { liveHour: 0.6, heroT: 20, uHome: 0.3, uFork: 0.5, routeAt: (u) => [u * 100, 0] };

describe('the hour of the day', () => {
  it('is night before 5 and after 19:30, dawn at 6, golden at 18:30', () => {
    expect(hourOfClock(3)).toBe(3);
    expect(hourOfClock(21)).toBe(3);
    expect(hourOfClock(6)).toBeCloseTo(0.25);
    expect(hourOfClock(18.5)).toBeCloseTo(2);
  });
  it('rises steadily through the day', () => {
    let prev = -1;
    for (let h = 5; h < 19.5; h += 0.25) { const v = hourOfClock(h); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
  });
});

describe('scroll position', () => {
  const tops = [0, 900, 3000], heights = [900, 2100, 900];
  it('names the section under the middle of the screen and how far through it is', () => {
    expect(scrollS(0, 900, tops, heights)).toBeCloseTo(0.5);
    expect(scrollS(450, 900, tops, heights)).toBeCloseTo(1);
    expect(scrollS(450 + 1050, 900, tops, heights)).toBeCloseTo(1.5);
  });
  it('gives pinned progress 0 at the top and 1 when the section starts to leave', () => {
    expect(pinned(900, 900, 900, 2100)).toBe(0);
    expect(pinned(900 + 1200, 900, 900, 2100)).toBe(1);
    expect(pinned(900 + 600, 900, 900, 2100)).toBeCloseTo(0.5);
  });
});

describe('the world through the morning', () => {
  it('is grey with no route before Pohnch, and full colour with the route lit after it switches on', () => {
    const before = worldAt(1.3, ctx), after = worldAt(1.9, ctx);
    expect(before.grey).toBe(1); expect(before.lit).toBe(0);
    expect(after.grey).toBe(0); expect(after.lit).toBeGreaterThan(0.9);
  });
  it('drives the van forward through the morning and reaches school', () => {
    const m = SECTIONS.indexOf('morning');
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.05) { const u = worldAt(m + t, ctx).u; expect(u).toBeGreaterThanOrEqual(prev - 1e-9); prev = u; }
    expect(worldAt(m + 0.99, ctx).u).toBeGreaterThan(0.99);
    expect(worldAt(m + 0.99, ctx).school).toBeGreaterThan(0.8);
  });
  it('ends at night for joining', () => {
    expect(worldAt(SECTIONS.indexOf('join') + 0.9, ctx).hour).toBe(3);
  });
  it('never jumps the camera at a section boundary', () => {
    for (let i = 1; i < SECTIONS.length; i++) {
      const a = worldAt(i - 1e-6, ctx).pose, b = worldAt(i, ctx).pose;
      expect(Math.hypot(a.tx - b.tx, a.tz - b.tz), SECTIONS[i]).toBeLessThan(40);
    }
  });
  it('blends two camera poses from one to the other', () => {
    const a = { tx: 0, tz: 0, dist: 100, az: 0, el: 0.5 }, b = { tx: 100, tz: 0, dist: 100, az: 1, el: 0.5 };
    expect(mixPose(a, b, 0).tx).toBe(0); expect(mixPose(a, b, 1).tx).toBe(100); expect(mixPose(a, b, 1).dist).toBeCloseTo(100);
  });
});

describe('the calls calculator', () => {
  it('counts calls over 190 school days', () => {
    expect(callsAYear(10)).toBe(1900); expect(callsAYear(0)).toBe(0); expect(callsAYear(-2)).toBe(0);
    expect(span(5, 0, 10)).toBe(0.5);
  });
});
