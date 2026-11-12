import { describe, expect, it } from 'vitest';
import { INTRO_OPEN_AT, INTRO_OPEN_MS, introMode } from './introRules';
import { quoteFor, type Quote } from './quotes';

describe('the opening logo moment (v19)', () => {
  it('plays in full on every visit, never with reduced motion', () => {
    expect(introMode(false)).toBe('full');
    expect(introMode(true)).toBe('none');
  });
  it('lasts about 4 seconds before the city shows', () => {
    expect(INTRO_OPEN_AT + INTRO_OPEN_MS).toBe(4000);
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
