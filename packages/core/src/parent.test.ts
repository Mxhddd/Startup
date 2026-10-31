import { describe, expect, it } from 'vitest';
import { canUndoChutti, distanceM, etaMinutes, timelineFor, type ParentEvent } from './index';

const home = { latitude: 24.9, longitude: 67.1 };

describe('distance and minutes', () => {
  it('measures about 1.1 km for 0.01° of latitude', () => {
    expect(Math.round(distanceM(home, { latitude: 24.91, longitude: 67.1 }))).toBe(1112);
  });

  it("uses the van's recent speed, Karachi road detours, and stops ahead", () => {
    const van = { latitude: 24.91, longitude: 67.1 }; // 1.1 km away
    // 1112 m x 1.35 / 6 m/s = 250 s, plus 2 stops x 45 s = 340 s -> 6 min
    expect(etaMinutes({ van, target: home, recentSpeeds: [6, 6, 6], stopsAhead: 2 })).toBe(6);
  });

  it('ignores stops at traffic lights and assumes 20 km/h with no speed yet', () => {
    const van = { latitude: 24.91, longitude: 67.1 };
    expect(etaMinutes({ van, target: home, recentSpeeds: [0, 0, null], stopsAhead: 0 })).toBe(5);
  });

  it('says "at your door" when the van is within 150 m and yours is the next stop', () => {
    const near = { latitude: 24.9008, longitude: 67.1 };
    expect(etaMinutes({ van: near, target: home, recentSpeeds: [], stopsAhead: 0 })).toBe('door');
    expect(etaMinutes({ van: near, target: home, recentSpeeds: [], stopsAhead: 1 })).toBe(1);
  });

  it('never says 0 minutes', () => {
    expect(etaMinutes({ van: { latitude: 24.9015, longitude: 67.1 }, target: home, recentSpeeds: [14], stopsAhead: 0 })).toBe(1);
  });
});

describe("a child's timeline", () => {
  const ev = (step: ParentEvent['step'], childId: string | null, at: string, extra: Partial<ParentEvent> = {}): ParentEvent =>
    ({ step, childId, happenedAt: at, by: 'Rafiq bhai', undone: false, ...extra });

  it("shows the van-wide steps and only this child's own tap", () => {
    const t = timelineFor('morning', 'ali', [ev('left', null, '07:05'), ev('picked', 'sara', '07:08'), ev('picked', 'ali', '07:12')]);
    expect(t.items).toEqual([
      { step: 'left', at: '07:05', by: 'Rafiq bhai' },
      { step: 'picked', at: '07:12', by: 'Rafiq bhai' },
      { step: 'reached_school', at: null, by: null },
    ]);
  });

  it('does not show a tap that was undone', () => {
    const t = timelineFor('morning', 'ali', [ev('picked', 'ali', '07:12', { undone: true })]);
    expect(t.items[1]?.at).toBeNull();
  });

  it('shows "arriving" until the child is in, and the latest late reason', () => {
    expect(timelineFor('morning', 'ali', [ev('arriving', 'ali', '07:11', { by: null })]).arriving).toBe(true);
    expect(timelineFor('morning', 'ali', [ev('arriving', 'ali', '07:11'), ev('picked', 'ali', '07:12')]).arriving).toBe(false);
    expect(timelineFor('morning', 'ali', [ev('late', null, '07:20', { reason: 'traffic' })]).late).toBe('traffic');
  });

  it('uses the afternoon steps in the afternoon', () => {
    expect(timelineFor('afternoon', 'ali', []).items.map((i) => i.step)).toEqual(['left_school', 'dropped']);
  });
});

describe('chutti undo', () => {
  it('is allowed for future days, and today until the van leaves', () => {
    expect(canUndoChutti('2026-11-03', '2026-11-02', true)).toBe(true);
    expect(canUndoChutti('2026-11-02', '2026-11-02', false)).toBe(true);
    expect(canUndoChutti('2026-11-02', '2026-11-02', true)).toBe(false);
  });
});
