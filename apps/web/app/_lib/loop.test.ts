import { describe, expect, it } from 'vitest';
import { LOOP_STEPS, arch, clockAt, etaAt, seeded, stepAt, warmth } from './loop';

describe('the school-day loop', () => {
  it('finds the step the scroll has reached', () => {
    expect(stepAt(0)).toBe(-1);
    expect(stepAt(0.05)).toBe(0);
    expect(stepAt(0.3)).toBe(2);
    expect(stepAt(1)).toBe(LOOP_STEPS.length - 1);
  });

  it('runs the clock between the steps and waits at school', () => {
    expect(clockAt(0)).toBe('7:02');
    expect(clockAt(0.2)).toBe('7:09');
    expect(clockAt(0.25)).toBe('7:11');
    expect(clockAt(0.5)).toBe('7:41');
    expect(clockAt(0.6)).toBe('1:35');
    expect(clockAt(1)).toBe('2:05');
  });

  it('counts the minutes to your door down to 0, then stops', () => {
    expect(etaAt(0)).toBe(6);
    expect(etaAt(0.12)).toBe(3);
    expect(etaAt(0.199)).toBe(1);
    expect(etaAt(0.2)).toBeNull();
  });

  it('warms the window as the van comes closer', () => {
    expect(warmth(6)).toBe(0);
    expect(warmth(3)).toBe(0.5);
    expect(warmth(0)).toBe(1);
    expect(warmth(null)).toBe(1);
  });

  it('draws the same street on every build', () => {
    const a = seeded(3);
    const b = seeded(3);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(arch(0, 0, 100, 150)).toMatch(/^M0 150 L0 63 C0 27 28 10.5 50 0 /);
  });
});
