import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dirOf, en, otherLang, t, ur } from './index';

describe('messages', () => {
  it('has the same keys in Urdu and English, so no screen is missing a word', () => {
    expect(Object.keys(ur).sort()).toEqual(Object.keys(en).sort());
  });

  // v21: a repeated key silently replaces the earlier text (JSON keeps the last one), so never allow one.
  it('never repeats a key in either file', () => {
    for (const f of ['en.json', 'ur.json']) {
      const keys = [...readFileSync(new URL(`./${f}`, import.meta.url), 'utf8').matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
      const seen = new Set<string>();
      const repeated = keys.filter((k) => (seen.has(k!) ? true : (seen.add(k!), false)));
      expect(repeated, f).toEqual([]);
    }
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

describe('placeholders', () => {
  it('fills {min} and {name} in both languages', () => {
    expect(t('en', 'eta.home', { min: 6 })).toBe('Home in 6 min');
    expect(t('ur', 'eta.home', { min: 6 })).toBe('6 منٹ میں گھر');
    expect(t('en', 'undo.marked', { name: 'Ali', step: 'In the van' })).toBe('Ali: In the van');
  });

  it('uses the same placeholders in Urdu and English for every key', () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(names(ur[key]), key).toEqual(names(en[key]));
    }
  });
});
