import { describe, expect, it } from 'vitest';
import { colors, stepColors, tap, type } from './theme';
import { uiFont } from './lang';

// WCAG contrast ratio between two hex colours.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme', () => {
  it('every step colour has text with at least 4.5:1 contrast', () => {
    for (const [step, c] of Object.entries(stepColors)) {
      expect(contrast(c.fill, c.text), step).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('body and secondary text pass 4.5:1 on the ghee ground', () => {
    expect(contrast(colors.siyahi, colors.ghee)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.ink2, colors.ghee)).toBeGreaterThanOrEqual(4.5);
    for (const ground of [colors.white, colors.ghee, colors.kesarTint]) expect(contrast(colors.kesarText, ground)).toBeGreaterThanOrEqual(4.5);
    // v8 audit: every text-on-ground pair the screens use.
    const pairs: [string, string, string][] = [
      ['ghee on neel (driver headers)', colors.ghee, colors.neel],
      ['muted on neel (header lines)', colors.mutedOnDark, colors.neel],
      ['muted on siyahi', colors.mutedOnDark, colors.siyahi],
      ['ink2 on white', colors.ink2, colors.white],
      ['ink2 on sand (quiet buttons)', colors.ink2, colors.sand],
      ['siyahi on sand', colors.siyahi, colors.sand],
      ['neel on neelTint', colors.neel, colors.neelTint],
      ['zamurradOnTint on zamurradTint', colors.zamurradOnTint, colors.zamurradTint],
      ['danger on white', colors.dangerText, colors.white],
      ['danger on ghee', colors.dangerText, colors.ghee],
      ['siyahi on kesar', colors.siyahi, colors.kesar],
      ['absent text on absent ground', colors.absentText, colors.absentBg],
    ];
    for (const [name, fg, bg] of pairs) expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the size rules: taps at least 64 px, next tap 104 px, no text under 14 px', () => {
    expect(tap.min).toBeGreaterThanOrEqual(64);
    expect(tap.next).toBe(104);
    expect(type.minSize).toBe(14);
  });

  it('picks Noto Sans Arabic for Urdu and Manrope for English', () => {
    expect(uiFont('ur')).toMatch(/NotoSansArabic/);
    expect(uiFont('en', 'bold')).toMatch(/Manrope/);
  });
});

import { applyColorScheme, colorScheme, dayColors, nightColors } from './theme';
describe('the night palette (v8 dark mode)', () => {
  const n = { ...dayColors, ...nightColors } as Record<string, string>;
  const c = (fg: string, bg: string) => {
    const lum = (hex: string) => {
      const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * (v[0] as number) + 0.7152 * (v[1] as number) + 0.0722 * (v[2] as number);
    };
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x) as [number, number];
    return (a + 0.05) / (b + 0.05);
  };
  it('keeps every text-on-ground pair at 4.5:1 or more', () => {
    const pairs: [string, string, string][] = [
      ['text on ground', 'siyahi', 'ghee'], ['text on cards', 'siyahi', 'white'], ['secondary on ground', 'ink2', 'ghee'], ['secondary on cards', 'ink2', 'white'],
      ['links on cards', 'link', 'white'], ['links on ground', 'link', 'ghee'], ['links on neel tint', 'link', 'neelTint'], ['text on sand', 'siyahi', 'sand'],
      ['on brand', 'onBrand', 'neel'], ['on zamurrad', 'onFill', 'zamurrad'], ['on shingarf', 'onFill', 'shingarf'], ['on kesar', 'onKesar', 'kesar'],
      ['danger on ground', 'dangerText', 'ghee'], ['danger on cards', 'dangerText', 'white'], ['green note', 'zamurradOnTint', 'zamurradTint'],
      ['kesar text', 'kesarText', 'white'], ['kesar text on tint', 'kesarText', 'kesarTint'], ['absent', 'absentText', 'absentBg'], ['on the dark chip', 'onBrand', 'night'],
    ];
    for (const [name, fg, bg] of pairs) expect(c(n[fg] as string, n[bg] as string), name).toBeGreaterThanOrEqual(4.5);
  });
  it('switches every colour in place, and back', () => {
    applyColorScheme('dark');
    expect(colorScheme()).toBe('dark');
    expect(colors.ghee).toBe(nightColors.ghee);
    expect(colors.onBrand).toBe(dayColors.onBrand);
    applyColorScheme('light');
    expect(colors.ghee).toBe(dayColors.ghee);
  });
});

import { archPath, humpPath } from './theme';
describe('v10 Jharoka', () => {
  const lum = (hex: string) => {
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * (v[0] as number) + 0.7152 * (v[1] as number) + 0.0722 * (v[2] as number);
  };
  const ratio = (a: string, b: string) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]; return (h + 0.05) / (l + 0.05); };
  const pairs: [string, string, string][] = [
    ['text in a filled field', 'siyahi', 'inset'], ['label in a filled field', 'ink2', 'inset'],
    ['soft button text', 'link', 'neelTint'], ['text on the light end of a neel button', 'onBrand', 'neelHi'],
    ['text on the light end of a green button', 'onFill', 'zamurradHi'], ['text on the light end of a kesar button', 'onKesar', 'kesarHi'],
    ['text on the light end of a help button', 'onFill', 'shingarfHi'], ['header title', 'onBrand', 'headerTop'], ['header subtitle', 'mutedOnDark', 'headerBottom'],
  ];
  it('keeps every new text-on-surface pair at 4.5:1, by day and by night', () => {
    for (const scheme of [{}, nightColors]) {
      const p = { ...dayColors, ...scheme } as Record<string, string>;
      for (const [name, fg, bg] of pairs) expect(ratio(p[fg] as string, p[bg] as string), name).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('draws a closed pointed arch inside its box, with the point at the centre', () => {
    const d = archPath(100, 120);
    expect(d.startsWith('M0 120')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain('50 0'); // the apex
    expect(d).toContain('L50 -3.7'); // the finial, 6% of the rise above it
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.max(...nums)).toBeLessThanOrEqual(120);
    expect(archPath(100, 120, 62, false)).not.toContain('-3.7');
  });
  it('the arch never rises taller than its box', () => {
    expect(archPath(100, 40, 200)).toContain('L0 40');
  });
  it('the page hump spans the width and peaks at the centre', () => {
    const d = humpPath(390);
    expect(d.startsWith('M0 40 L0 30')).toBe(true);
    expect(d).toContain('195 0');
    expect(d).toContain('390 30 L390 40 Z');
  });
});

describe('child colours (v12)', () => {
  it('keeps every child colour readable, and goes round after three', async () => {
    const { childColors } = await import('./theme');
    for (let i = 0; i < 3; i++) {
      const c = childColors(i);
      expect(contrast(c.fill, c.ink), `fill ${i}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.tint, c.text), `tint ${i}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(childColors(3)).toEqual(childColors(0));
    expect(childColors(-1)).toEqual(childColors(2));
  });
});

