// v20: the website's stylesheets keep to one design system. Every var(--x) they use is defined (in
// tokens.css, by the page at run time, or in the same file); the off-theme red is gone; shingarf appears
// only for help, late and strikes; hard-coded paper and ink hexes don't creep back; and every word added
// for v20 exists in both languages.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { webWords } from './words';

const css = (f: string) => readFileSync(join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const FILES = ['tokens.css', 'home.css', 'pages.css', 'truckart.css'];
const all = FILES.map(css).join('\n');

/** Set at run time: by the page's scroll loop (--p, --story, --skyc), React style props, truckVars(), next/font. */
const RUNTIME = ['p', 'story', 'skyc', 'k', 'h', 'la', 'n', 'row', 'mx', 'my', 'rx', 'ry', 'c', 'chamak', 'chamak-s', 'vine', 'jhalar', 'roundel', 'rose', 'font-latin', 'font-urdu', 'font-display'];

describe('one design system', () => {
  it('uses only defined custom properties', () => {
    const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!.slice(2)).concat(RUNTIME));
    const used = new Set([...all.matchAll(/var\(\s*--([\w-]+)/g)].map((m) => m[1]!));
    expect([...used].filter((u) => !defined.has(u))).toEqual([]);
  });
  it('has no off-theme red, and the theme red only for help, late and strikes', () => {
    expect(all).not.toMatch(/#B5402E/i);
    const lines = all.split('\n').filter((l) => /var\(--shing\)|#A8321F|%23A8321F/i.test(l));
    for (const l of lines) expect(l, l.slice(0, 80)).toMatch(/hubhelp|\.log li::after|nolist|help|strike|--shing:/);
  });
  it('writes paper, ink and night through tokens, not hex codes (outside tokens.css)', () => {
    for (const f of ['home.css', 'pages.css']) {
      const body = css(f).replace(/url\("data:[^"]*"\)/g, '');
      for (const hex of ['#FBF7EF', '#F5EEE1', '#10162F', '#FFFDF8', '#1F2A5C', '#E8A33D', '#17705A']) expect(body.toUpperCase(), `${f} ${hex}`).not.toContain(hex);
    }
  });
  it('has one focus ring rule for the site', () => {
    expect(css('home.css').match(/:focus-visible\s*{[^}]*outline:\s*3px solid var\(--focus\)/g)?.length).toBe(1);
  });
});

describe('the words added in v20', () => {
  const KEYS = ['nav.main', 'chap.label', 'chap.skip', 'meter.checking', 'meter.error', 'wait.checking', 'wait.error', 'prog.checking', 'prog.errorH', 'prog.error',
    'sfh.h', 'sfh.prom', 'sfh.check', 'sfh.loc', 'sfh.never', 'sfh.help', 'drh.k', 'drh.h', 'drh.try', 'drh.how', 'drh.faq'];
  it('exist in English and Urdu', () => {
    for (const lang of ['en', 'ur'] as const) { const w = webWords(lang); for (const k of KEYS) expect(w[k], `${lang} ${k}`).toBeTruthy(); }
  });
  it('name the area wherever an area is meant', () => {
    for (const lang of ['en', 'ur'] as const) for (const k of ['meter.checking', 'meter.error']) expect(webWords(lang)[k]).toContain('{area}');
  });
});
