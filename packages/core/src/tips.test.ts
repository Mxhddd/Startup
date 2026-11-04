import { describe, expect, it } from 'vitest';
import { tipsDue } from './tips';

describe('tipsDue', () => {
  const day = 24 * 3600_000;
  it('shows the first time, and through the first week', () => {
    expect(tipsDue(null, 0)).toBe(true);
    expect(tipsDue({ firstSeen: 0, done: false }, 6 * day)).toBe(true);
  });
  it('hides after a week, or once dismissed', () => {
    expect(tipsDue({ firstSeen: 0, done: false }, 7 * day)).toBe(false);
    expect(tipsDue({ firstSeen: 0, done: true }, day)).toBe(false);
  });
});
