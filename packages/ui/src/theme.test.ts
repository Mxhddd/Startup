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
