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
