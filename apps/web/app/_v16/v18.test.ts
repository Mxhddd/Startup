// v18 rules: the clock line, truck-art patterns, the painted words.
import { describe, expect, it } from 'vitest';
import { en, ur } from '@pohnch/messages';
import { hhmm, karachiClock, nowKey } from './hour';
import { chamakTile, roundelSvg, truckVars } from './truckart';
import { LINE_COUNT, SHOP_COUNT, worldWords } from './worldWords';

describe('Right now in Karachi', () => {
  it('names what the vans are doing at every hour of a weekday', () => {
    const seen = Array.from({ length: 24 }, (_, h) => nowKey(h, 0, 2));
    expect(seen.slice(0, 5)).toEqual(['night', 'night', 'night', 'night', 'night']);
    expect(nowKey(5, 30, 2)).toBe('early');
    expect(nowKey(6, 30, 2)).toBe('morning');
    expect(nowKey(7, 59, 2)).toBe('morning');
    expect(nowKey(8, 0, 2)).toBe('school');
    expect(nowKey(12, 30, 2)).toBe('afternoon');
    expect(nowKey(15, 0, 2)).toBe('evening');
    expect(nowKey(19, 59, 2)).toBe('evening');
    expect(nowKey(20, 0, 2)).toBe('night');
  });
  it('knows Sunday has no school run, but night is still night', () => {
    expect(nowKey(7, 15, 0)).toBe('sunday');
    expect(nowKey(23, 0, 0)).toBe('night');
  });
  it('reads Karachi time (UTC+5) whatever the visitor\'s zone', () => {
    // 2026-11-09 is a Monday; 02:12 UTC is 07:12 in Karachi
    expect(karachiClock(new Date('2026-11-09T02:12:00Z'))).toEqual({ h: 7, m: 12, day: 1 });
    expect(karachiClock(new Date('2026-11-08T20:00:00Z'))).toEqual({ h: 1, m: 0, day: 1 });
    expect(hhmm(7, 5)).toBe('07:05');
  });
  it('has the line in both languages for every state', () => {
    for (const k of ['night', 'early', 'morning', 'school', 'afternoon', 'evening', 'sunday', 'k', 'note']) {
      expect((en as Record<string, string>)[`web.now.${k}`]).toBeTruthy();
      expect((ur as Record<string, string>)[`web.now.${k}`]).toBeTruthy();
    }
  });
});

describe('truck art', () => {
  it('draws the same pattern from the same seed (server and browser agree)', () => {
    expect(chamakTile(3, 16)).toBe(chamakTile(3, 16));
    expect(chamakTile(3, 16)).not.toBe(chamakTile(4, 16));
    expect(roundelSvg(32)).toBe(roundelSvg(32));
  });
  it('never uses shingarf red for decoration', () => {
    const all = [chamakTile(1), chamakTile(4), chamakTile(7), roundelSvg()].join('').toUpperCase();
    expect(all).not.toContain('#A8321F');
    expect(all).not.toContain('#B5402E');
  });
  it('hands the page its patterns as CSS variables', () => {
    const v = truckVars() as Record<string, string>;
    expect(v['--chamak']).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(v['--roundel']).toBeTruthy();
  });
});

describe('words painted in the city', () => {
  it('come from the messages, Urdu and English for every Pohnch line', () => {
    const w = worldWords();
    expect(w.lines).toHaveLength(LINE_COUNT);
    for (const l of w.lines) { expect(l.ur).toMatch(/[؀-ۿ]/); expect(l.en).toMatch(/[a-z]/i); }
    expect(w.shops).toHaveLength(SHOP_COUNT);
    for (const s of w.shops) expect(s).toMatch(/[؀-ۿ]/);
    expect(w.plateEn).toBe('SCHOOL VAN');
  });
});
