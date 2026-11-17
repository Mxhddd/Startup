import { describe, expect, it } from 'vitest';
import { SEEN_KEY, firstVisitToday, karachiDay, shouldCount, uncounted } from './SiteCounter';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };

describe('v22 site counter', () => {
  it('counts a browser as a new visitor once per Karachi day', () => {
    const s = memory();
    expect(firstVisitToday(s, '2026-11-17')).toBe(true);
    expect(firstVisitToday(s, '2026-11-17')).toBe(false);
    expect(firstVisitToday(s, '2026-11-18')).toBe(true);
    expect(s.m.get(SEEN_KEY)).toBe('2026-11-18');
  });
  it('never counts when storage is blocked', () => {
    expect(firstVisitToday(null, '2026-11-17')).toBe(false);
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => undefined };
    expect(firstVisitToday(broken, '2026-11-17')).toBe(false);
  });
  it('uses the Karachi date (UTC+5)', () => {
    expect(karachiDay(new Date('2026-11-16T19:30:00Z'))).toBe('2026-11-17');
    expect(karachiDay(new Date('2026-11-16T18:59:00Z'))).toBe('2026-11-16');
  });
  it('counts only real visitors on pohnch.pk, never local builds, previews or test robots', () => {
    expect(shouldCount('pohnch.pk', false)).toBe(true);
    expect(shouldCount('www.pohnch.pk', undefined)).toBe(true);
    expect(shouldCount('pohnch.pk', true)).toBe(false);
    expect(shouldCount('localhost', false)).toBe(false);
    expect(shouldCount('pohnch-git-claude.vercel.app', false)).toBe(false);
  });
  it('never counts the team page or invite links', () => {
    expect(uncounted('/admin')).toBe(true);
    expect(uncounted('/invite/x')).toBe(true);
    expect(uncounted('/app')).toBe(false);
  });
});
