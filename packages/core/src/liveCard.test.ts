import { describe, expect, it } from 'vitest';
import { buildLiveCard, type LiveText } from './liveCard';
import type { TimelineItem } from './parent';

const text: LiveText = {
  lead: (p) => `lead:${p}`,
  unit: 'min to your door',
  door: 'at your door',
  ahead: (n) => `${n} stops before you`,
  next: 'your stop is next',
  stale: (s) => `last seen ${s} s ago`,
  marks: (k) => (k === 'morning' ? 'Van left|In the van|At school' : 'Left school|In the van|Home'),
};
const items = (picked: boolean, school = false): TimelineItem[] => [
  { step: 'left', at: 'x', by: 'R' },
  { step: 'picked', at: picked ? 'y' : null, by: picked ? 'R' : null },
  { step: 'reached_school', at: school ? 'z' : null, by: null },
];
const base = { name: 'Ali', kind: 'morning' as const, now: 1_000_000, startedAt: 1_000_000 - 4 * 60_000, stopsAhead: 2, stale: false, secondsAgo: 3, lastStep: 'Van left · Rafiq', text };

describe('the Live Activity card', () => {
  it('counts down to the door: arrival time, progress so far, stops ahead', () => {
    const c = buildLiveCard({ ...base, items: items(false), eta: 6 });
    expect(c.state).toBe('coming');
    expect(c.arriveAt).toBe(1_000_000 + 6 * 60_000);
    expect(c.progress).toBeCloseTo(4 / 10);
    expect(c.headline).toBe('min to your door');
    expect(c.ahead).toBe('2 stops before you');
    expect(c.initial).toBe('A');
  });

  it('says "at your door" when the van is there', () => {
    const c = buildLiveCard({ ...base, items: items(false), eta: 'door', stopsAhead: 0 });
    expect(c.state).toBe('arriving');
    expect(c.headline).toBe('at your door');
    expect(c.progress).toBe(1);
  });

  it('stops counting once the child is in the van (morning), and at school', () => {
    expect(buildLiveCard({ ...base, items: items(true), eta: null }).state).toBe('inVan');
    const s = buildLiveCard({ ...base, items: items(true, true), eta: null });
    expect(s.state).toBe('atSchool');
    expect(s.arriveAt).toBe(0);
  });

  it('never pretends: a stale signal stops the timer and says when the van was last seen', () => {
    const c = buildLiveCard({ ...base, items: items(false), eta: 6, stale: true, secondsAgo: 45 });
    expect(c.state).toBe('stale');
    expect(c.arriveAt).toBe(0);
    expect(c.footer).toBe('last seen 45 s ago');
  });
});

import { stepsDone } from './liveCard';
describe('the step row (v9)', () => {
  it('fills one, two, then three steps as the run goes on', () => {
    expect(stepsDone('coming')).toBe(1);
    expect(stepsDone('inVan')).toBe(2);
    expect(stepsDone('atSchool')).toBe(3);
    const c = buildLiveCard({ ...base, items: items(true), eta: null });
    expect(c.steps).toBe(2);
    expect(c.marks).toBe('Van left|In the van|At school');
  });
});

