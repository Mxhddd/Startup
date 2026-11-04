import { describe, expect, it } from 'vitest';
import { bestOrder, blendEta, getReadyDue, isRaining, karachiMinutes, lateBy, onTimeStreak, seasonFor, stuckInTraffic, upcomingHolidays } from './v12';

// 07:00 in Karachi = 02:00 UTC.
const at = (hhmm: string) => Date.parse(`2026-11-04T${hhmm}:00Z`) - 5 * 3600_000;

describe('v12 rules', () => {
  it('reads Karachi time', () => {
    expect(karachiMinutes(at('07:00'))).toBe(420);
  });
  it('late warning: only from 5 minutes late, and never early', () => {
    expect(lateBy(12, at('07:00'), '07:10')).toBe(0);
    expect(lateBy(14, at('07:00'), '07:10')).toBe(0);
    expect(lateBy(18, at('07:00'), '07:10')).toBe(8);
    expect(lateBy(null, at('07:00'), '07:10')).toBe(0);
    expect(lateBy(30, at('07:00'), null)).toBe(0);
  });
  it('learned ETA: uses history early on, the live estimate when close', () => {
    const start = at('07:00');
    expect(blendEta(null, 15, start, at('07:05'))).toBe(10);
    expect(blendEta(2, 15, start, at('07:05'))).toBe(2);
    expect(blendEta(20, 15, start, at('07:05'))).toBeGreaterThan(10);
    expect(blendEta(20, 15, start, at('07:05'))).toBeLessThan(20);
    expect(blendEta(null, null, null, at('07:05'))).toBeNull();
  });
  it('get-ready: once, when the van is that close', () => {
    expect(getReadyDue(6, 5, false)).toBe(false);
    expect(getReadyDue(5, 5, false)).toBe(true);
    expect(getReadyDue('door', 5, false)).toBe(true);
    expect(getReadyDue(3, 5, true)).toBe(false);
  });
  it('best order: untangles a crossing route and says how much is saved', () => {
    const s = [
      { id: 'a', lat: 24.90, lng: 67.00 },
      { id: 'c', lat: 24.92, lng: 67.00 },
      { id: 'b', lat: 24.91, lng: 67.00 },
      { id: 'd', lat: 24.93, lng: 67.00 },
    ];
    const r = bestOrder(s, { lat: 24.95, lng: 67.0 });
    expect(r.order).toEqual(['a', 'b', 'c', 'd']);
    expect(r.savedKm).toBeGreaterThan(1);
    expect(bestOrder(s.slice(0, 2)).order).toEqual(['a', 'c']);
  });
  it('holidays: the next ones within two weeks, not Sundays', () => {
    expect(upcomingHolidays('2026-11-01').map((h) => h.key)).toEqual(['iqbal']);
    expect(upcomingHolidays('2026-11-10')).toEqual([]);
    expect(upcomingHolidays('2026-08-10').map((h) => h.key)).toContain('independence');
  });
  it('seasons for the sky', () => {
    expect(seasonFor('2026-03-01')).toBe('ramadan');
    expect(seasonFor('2026-03-21')).toBe('eid');
    expect(seasonFor('2026-08-10')).toBe('independence');
    expect(seasonFor('2026-07-20')).toBe('monsoon');
    expect(seasonFor('2026-11-04')).toBeNull();
  });
  it('on-time streak: days off do not break it', () => {
    expect(onTimeStreak([{ rode: true, off: false }, { rode: false, off: true }, { rode: true, off: false }, { rode: false, off: false }, { rode: true, off: false }])).toBe(2);
  });
  it('stuck in traffic: barely moving for 5 minutes away from stops', () => {
    const now = at('07:20');
    const fixes = (speed: number, atStop = false) => Array.from({ length: 12 }, (_, i) => ({ speed, atStop, at: now - i * 30_000 }));
    expect(stuckInTraffic(fixes(0.5), now)).toBe(true);
    expect(stuckInTraffic(fixes(0.5, true), now)).toBe(false);
    expect(stuckInTraffic(fixes(8), now)).toBe(false);
    expect(stuckInTraffic(fixes(0.5).slice(0, 5), now)).toBe(false);
  });
  it('rain from the weather reading', () => {
    expect(isRaining({ rain: 1.2 })).toBe(true);
    expect(isRaining({ weather_code: 63 })).toBe(true);
    expect(isRaining({ rain: 0, weather_code: 1 })).toBe(false);
    expect(isRaining(null)).toBe(false);
  });
});
