import { describe, expect, it } from 'vitest';
import { karachiClock, karachiDate } from './dates';

describe('karachiDate', () => {
  it('uses Karachi time, not UTC: 8 pm UTC is already the next day in Karachi (UTC+5)', () => {
    expect(karachiDate(new Date('2026-11-02T20:00:00Z'))).toBe('2026-11-03');
  });

  it('keeps the same day before 7 pm UTC', () => {
    expect(karachiDate(new Date('2026-11-02T18:59:00Z'))).toBe('2026-11-02');
  });
});

describe('karachiClock', () => {
  it('shows a morning pick-up as 7:12 with Western digits', () => {
    expect(karachiClock(new Date('2026-11-02T02:12:00Z'))).toBe('7:12');
  });

  it('uses a 12-hour clock for the afternoon run', () => {
    expect(karachiClock(new Date('2026-11-02T09:05:00Z'))).toBe('2:05');
  });
});

import { defaultRunKind, karachiHour } from './dates';
describe('morning or afternoon', () => {
  it('follows Karachi time, whatever the phone is set to', () => {
    expect(karachiHour(new Date('2026-11-02T02:00:00Z'))).toBe(7);
    expect(defaultRunKind(new Date('2026-11-02T02:00:00Z'))).toBe('morning');
    expect(defaultRunKind(new Date('2026-11-02T08:30:00Z'))).toBe('afternoon');
  });
});
