import { describe, expect, it } from 'vitest';
import { ALERT_STEPS, MOMENTS, newMoment } from './moments';

describe('moments', () => {
  it('gives every alert step a moment, and keeps one colour per meaning', () => {
    for (const s of ALERT_STEPS) expect(MOMENTS[s]).toBeDefined();
    expect(MOMENTS.picked.tone).toBe('zamurrad');
    expect(MOMENTS.dropped.tone).toBe('zamurrad');
    expect(MOMENTS.reached_school.tone).toBe('kesar');
    expect(MOMENTS.late.tone).toBe('shingarf');
  });

  it('only "arriving" and "late" may break through Focus', () => {
    expect(ALERT_STEPS.filter((s) => MOMENTS[s].timeSensitive)).toEqual(['arriving', 'late']);
  });

  it('arrivals get the two-note sound and a celebration', () => {
    expect(MOMENTS.reached_school.sound).toBe('pohnch');
    expect(MOMENTS.dropped.sound).toBe('pohnch');
    expect(MOMENTS.reached_school.celebrate).toBe('burst');
  });

  it('notices a step that newly happened, not one that was already there', () => {
    const a = [{ step: 'left', at: 'x' }, { step: 'picked', at: null }, { step: 'reached_school', at: null }];
    const b = [{ step: 'left', at: 'x' }, { step: 'picked', at: 'y' }, { step: 'reached_school', at: null }];
    expect(newMoment(a, b)).toBe('picked');
    expect(newMoment(b, b)).toBeNull();
    expect(newMoment(null, b)).toBeNull(); // first load: nothing plays
  });
});
