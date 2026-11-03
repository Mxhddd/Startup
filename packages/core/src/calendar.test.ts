import { describe, expect, it } from 'vitest';
import { canPlanDay, chuttiChanges, monthGrid, nextMonth } from './calendar';

describe('planned chutti', () => {
  it('lays out November 2026 from Sunday (the 1st is a Sunday)', () => {
    const g = monthGrid(2026, 11);
    expect(g[0]).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
    expect(g[g.length - 1]?.[1]).toBe('2026-11-30');
    expect(g.every((w) => w.length === 7)).toBe(true);
  });
  it('pads a month that starts mid-week', () => {
    const g = monthGrid(2026, 12); // 1 Dec 2026 is a Tuesday
    expect(g[0]?.slice(0, 3)).toEqual([null, null, '2026-12-01']);
  });
  it('plans from today up to 60 days ahead, never the past', () => {
    expect(canPlanDay('2026-11-03', '2026-11-03')).toBe(true);
    expect(canPlanDay('2026-11-02', '2026-11-03')).toBe(false);
    expect(canPlanDay('2027-01-02', '2026-11-03')).toBe(true);
    expect(canPlanDay('2027-01-03', '2026-11-03')).toBe(false);
  });
  it('works out what to add and what to clear', () => {
    expect(chuttiChanges(['2026-11-06', '2026-11-10'], ['2026-11-13', '2026-11-06'])).toEqual({ add: ['2026-11-13'], clear: ['2026-11-10'] });
    expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
  });
});
