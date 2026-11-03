import { describe, expect, it } from 'vitest';
import { nudges } from './nudges';

const base = { toStop: null, toSchool: null, speed: null, morning: true, allDone: false };

describe('driver nudges', () => {
  it('says "at the stop" only when close and stopped', () => {
    expect(nudges({ ...base, toStop: 40, speed: 0.5 }).atStop).toBe(true);
    expect(nudges({ ...base, toStop: 40, speed: 8 }).atStop).toBe(false);
    expect(nudges({ ...base, toStop: 90, speed: 0 }).atStop).toBe(false);
  });
  it('speaks the next stop from 250 m', () => {
    expect(nudges({ ...base, toStop: 240, speed: 9 }).nearStop).toBe(true);
    expect(nudges({ ...base, toStop: 400, speed: 9 }).nearStop).toBe(false);
  });
  it('points at "reached school" near the school once everyone is in, mornings only', () => {
    expect(nudges({ ...base, toSchool: 100, allDone: true }).atSchool).toBe(true);
    expect(nudges({ ...base, toSchool: 100, allDone: false }).atSchool).toBe(false);
    expect(nudges({ ...base, toSchool: 100, allDone: true, morning: false }).atSchool).toBe(false);
  });
});
