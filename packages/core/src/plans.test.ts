import { describe, expect, it } from 'vitest';
import { driverBonus, familyMonthly, featuresFor, introAllowed, planState, PRICES, PLUS_FEATURES } from './plans';

describe('Pohnch Plus (pricing v2)', () => {
  it('has no free tier and no free month', () => {
    expect(featuresFor(false, true)).toEqual([]);
    expect(featuresFor(true, true)).toEqual(PLUS_FEATURES);
    expect(PRICES.intro).toBeGreaterThan(0);
    expect(PRICES.founding).toBeGreaterThan(0);
  });
  it('keeps the pilot as it is while billing is switched off', () => {
    expect(featuresFor(false, false)).toEqual(PLUS_FEATURES);
  });
  it('is active until paid_until, then 3 days of grace, then ended', () => {
    expect(planState(null, '2026-12-01')).toBe('none');
    expect(planState('2026-12-01', '2026-12-01')).toBe('active');
    expect(planState('2026-12-01', '2026-12-04')).toBe('grace');
    expect(planState('2026-12-01', '2026-12-05')).toBe('ended');
    expect(planState('2026-12-30', '2027-01-02')).toBe('grace');
  });
  it('gives the intro once per phone and once per seat', () => {
    expect(introAllowed({ phone: false, seat: false })).toBe(true);
    expect(introAllowed({ phone: true, seat: false })).toBe(false);
    expect(introAllowed({ phone: false, seat: true })).toBe(false);
  });
  it('prices siblings lower', () => {
    expect(familyMonthly(0)).toBe(0);
    expect(familyMonthly(1)).toBe(349);
    expect(familyMonthly(3)).toBe(349 + 2 * 199);
    expect(familyMonthly(2, 249)).toBe(249 + 199);
  });
  it('pays the driver bonus only when the van tracked 80% of trips', () => {
    expect(driverBonus(5, 80)).toBe(200);
    expect(driverBonus(5, 79)).toBe(0);
    expect(driverBonus(5, null)).toBe(0);
    expect(driverBonus(-1, 95)).toBe(0);
  });
});
