import { describe, expect, it } from 'vitest';
import { bestOrder, blendEta, getReadyDue, km, kmh, lookAhead, nextReminder, preTripDue, replayAt, shiftTime, speedWarn, isRaining, karachiMinutes, lateBy, onTimeStreak, seasonFor, stuckInTraffic, upcomingHolidays } from './v12';

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

describe('speed watch and pre-trip checklist', () => {
  it('warns over 50 km/h, then not again for 2 minutes', () => {
    expect(speedWarn(12, null, 0)).toBe(false);
    expect(speedWarn(15, null, 0)).toBe(true);
    expect(speedWarn(15, 0, 60_000)).toBe(false);
    expect(speedWarn(15, 0, 120_000)).toBe(true);
    expect(speedWarn(null, null, 0)).toBe(false);
    expect(kmh(13.9)).toBe(50);
  });
  it('asks for the checklist once a day', () => {
    expect(preTripDue(null, '2026-11-04')).toBe(true);
    expect(preTripDue('2026-11-03', '2026-11-04')).toBe(true);
    expect(preTripDue('2026-11-04', '2026-11-04')).toBe(false);
  });
});

describe('one-day time change', () => {
  it('moves a start time and keeps it inside the day', () => {
    expect(shiftTime('07:10', 15)).toBe('07:25');
    expect(shiftTime('07:10', -30)).toBe('06:40');
    expect(shiftTime('00:10', -30)).toBe('00:00');
    expect(shiftTime('13:45:00', 60)).toBe('14:45');
  });
});

describe('ride replay', () => {
  const path = [
    { lat: 24.9, lng: 67.0, at: '2026-11-04T02:00:00Z' },
    { lat: 24.91, lng: 67.0, at: '2026-11-04T02:10:00Z' },
    { lat: 24.91, lng: 67.01, at: '2026-11-04T02:20:00Z' },
  ];
  it('moves along the recorded path by time, heading the way it went', () => {
    expect(replayAt([], 0.5)).toBeNull();
    const start = replayAt(path, 0)!;
    expect(start.lat).toBeCloseTo(24.9);
    const quarter = replayAt(path, 0.25)!;
    expect(quarter.lat).toBeCloseTo(24.905);
    expect(quarter.heading).toBeCloseTo(0); // north
    const late = replayAt(path, 0.75)!;
    expect(late.lng).toBeCloseTo(67.005);
    expect(late.heading).toBeCloseTo(90); // east
    expect(replayAt(path, 2)!.lng).toBeCloseTo(67.01);
  });
});

describe('driver start reminder', () => {
  // Wednesday 4 Nov 2026, 06:00 in Karachi.
  const now = at('06:00');
  it('reminds 10 minutes before the first stop, today if still ahead', () => {
    expect(nextReminder('morning', '07:10', [], [], now)).toBe(at('07:00'));
  });
  it("skips a van day off and uses that day's changed time", () => {
    const thu = Date.parse('2026-11-05T00:00:00Z') - 5 * 3600_000 + (7 * 60 + 20) * 60_000;
    expect(nextReminder('morning', '07:10', ['2026-11-04'], [{ date: '2026-11-05', kind: 'morning', time: '07:30' }], now)).toBe(thu);
  });
  it('skips the weekend and public holidays, and gives nothing without a time', () => {
    const fri = Date.parse('2026-11-06T09:00:00Z');
    // Monday 9 November is Iqbal Day, so the next run is Tuesday.
    const tue = Date.parse('2026-11-10T00:00:00Z') - 5 * 3600_000 + (7 * 60) * 60_000;
    expect(nextReminder('morning', '07:10', [], [], fri)).toBe(tue);
    expect(nextReminder('morning', null, [], [], now)).toBeNull();
  });
});

describe('map camera look-ahead', () => {
  it('stays on the van when stopped and moves ahead when driving', () => {
    expect(lookAhead(24.9, 67, 0, 0)).toEqual({ lat: 24.9, lng: 67, pitch: 45 });
    const north = lookAhead(24.9, 67, 0, 10);
    expect(north.lat).toBeGreaterThan(24.9);
    expect(north.lng).toBeCloseTo(67);
    expect(km({ lat: 24.9, lng: 67 }, north)).toBeCloseTo(0.06, 2);
    const fast = lookAhead(24.9, 67, 90, 30);
    expect(km({ lat: 24.9, lng: 67 }, fast)).toBeCloseTo(0.14, 2);
    expect(fast.pitch).toBe(58);
  });
});

describe('learned ETA when the van is behind its usual time', () => {
  it('uses only the live estimate once the usual ride time has passed', () => {
    const now = at('07:30');
    // Usually 12 minutes from leaving; it left 20 minutes ago and is still 15 minutes away.
    expect(blendEta(15, 12, now - 20 * 60_000, now)).toBe(15);
  });
});
