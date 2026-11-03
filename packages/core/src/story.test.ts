import { describe, expect, it } from 'vitest';
import { arrivedAt, storyOf, waitClock } from './story';

const ev = (step: string, at: string, childId: string | null = null, undone = false) => ({ step: step as 'arriving', childId, happenedAt: at, by: null, undone });

describe('the wait at the door', () => {
  it('finds when the van arrived for this child, ignoring undone and other children', () => {
    const events = [ev('arriving', '2026-11-03T02:10:00Z', 'k1'), ev('arriving', '2026-11-03T02:20:00Z', 'k2'), ev('arriving', '2026-11-03T02:30:00Z', 'k1', true)];
    expect(arrivedAt('k1', events)).toBe('2026-11-03T02:10:00Z');
    expect(arrivedAt('k9', events)).toBeNull();
  });
  it('counts up as m:ss', () => {
    expect(waitClock('2026-11-03T02:10:00Z', Date.parse('2026-11-03T02:11:20Z'))).toBe('1:20');
    expect(waitClock('2026-11-03T02:10:00Z', Date.parse('2026-11-03T02:09:00Z'))).toBe('0:00');
  });
});

describe("today's story", () => {
  it('tells a finished morning with the minutes from pick-up to school', () => {
    const items = [
      { step: 'left' as const, at: '2026-11-03T02:00:00Z', by: 'Rafiq' },
      { step: 'picked' as const, at: '2026-11-03T02:12:00Z', by: 'Rafiq' },
      { step: 'reached_school' as const, at: '2026-11-03T02:46:00Z', by: 'Rafiq' },
    ];
    expect(storyOf('morning', items)).toEqual({ rows: items, minutes: 34 });
  });
  it('waits until the run is over for the child', () => {
    expect(storyOf('afternoon', [{ step: 'left_school', at: '2026-11-03T08:00:00Z', by: null }, { step: 'dropped', at: null, by: null }])).toBeNull();
  });
});
