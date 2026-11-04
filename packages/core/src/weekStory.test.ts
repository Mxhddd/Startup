import { describe, expect, it } from 'vitest';
import { weekStory } from './story';

describe('weekStory', () => {
  it('counts the days ridden, the average ride and scales the bars to the longest', () => {
    const s = weekStory([
      { date: '2026-11-04', minutes: 20, rode: true },
      { date: '2026-11-02', minutes: 10, rode: true },
      { date: '2026-11-03', minutes: null, rode: false },
    ]);
    expect(s.schoolDays).toBe(3);
    expect(s.rode).toBe(2);
    expect(s.avgMinutes).toBe(15);
    expect(s.bars.map((b) => b.date)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
    expect(s.bars[2]!.height).toBe(1);
    expect(s.bars[0]!.height).toBe(0.5);
    expect(s.bars[1]).toEqual({ date: '2026-11-03', rode: false, height: 0.18 });
  });
  it('a quiet week has no average and short bars', () => {
    const s = weekStory([{ date: '2026-11-04', minutes: null, rode: false }]);
    expect(s.avgMinutes).toBeNull();
    expect(s.bars[0]!.height).toBe(0.18);
    expect(weekStory([]).bars).toEqual([]);
  });
  it('carries numbers only (no names or places)', () => {
    const s = weekStory([{ date: '2026-11-04', minutes: 12, rode: true }]);
    expect(Object.keys(s).sort()).toEqual(['avgMinutes', 'bars', 'rode', 'schoolDays']);
    expect(Object.keys(s.bars[0]!).sort()).toEqual(['date', 'height', 'rode']);
  });
});
