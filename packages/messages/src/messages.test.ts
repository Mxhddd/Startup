import { describe, expect, it } from 'vitest';
import { dirOf, en, otherLang, t, ur } from './index';

describe('messages', () => {
  it('has the same keys in Urdu and English, so no screen is missing a word', () => {
    expect(Object.keys(ur).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty text', () => {
    for (const table of [ur, en]) {
      for (const [key, value] of Object.entries(table)) {
        expect(value.trim(), key).not.toBe('');
      }
    }
  });

  it('looks up a key in the chosen language', () => {
    expect(t('ur', 'app.parent.name')).toBe('پہنچ');
    expect(t('en', 'app.parent.name')).toBe('Pohnch');
  });

  it('gives Urdu right-to-left and English left-to-right', () => {
    expect(dirOf('ur')).toBe('rtl');
    expect(dirOf('en')).toBe('ltr');
    expect(otherLang('ur')).toBe('en');
  });
});
