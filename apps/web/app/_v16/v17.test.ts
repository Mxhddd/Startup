import { describe, expect, it } from 'vitest';
import { introMode, markSeen, readSeen } from './introRules';
import { quoteFor, type Quote } from './quotes';

describe('the opening logo moment', () => {
  it('plays in full on the first visit, short after that, never with reduced motion', () => {
    expect(introMode(false, false)).toBe('full');
    expect(introMode(false, true)).toBe('short');
    expect(introMode(true, false)).toBe('none');
  });
  it('remembers a visit, and falls back to the full version when storage is blocked', () => {
    const m = new Map<string, string>(); const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    expect(readSeen(s)).toBe(false); markSeen(s); expect(readSeen(s)).toBe(true);
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readSeen(blocked)).toBe(false); expect(() => markSeen(blocked)).not.toThrow();
    expect(readSeen(null)).toBe(false);
  });
});

describe('quotes on the front door', () => {
  const list: Quote[] = [{ role: 'driver', name: 'Zaheer', en: 'Fewer calls.', ur: 'کم کالیں۔' }];
  it('shows a quote only for a role that has one, in the page language', () => {
    expect(quoteFor(list, 'driver', 'ur')).toEqual({ name: 'Zaheer', text: 'کم کالیں۔' });
    expect(quoteFor(list, 'parent', 'en')).toBeNull();
    expect(quoteFor([], 'driver', 'en')).toBeNull();
  });
});
