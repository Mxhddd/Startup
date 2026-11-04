import { describe, expect, it } from 'vitest';
import { ALERT_STEPS, MOMENTS } from '@pohnch/core';
import { FEEL } from './feedbackTable';
import manifest from './sounds.json';

const files = new Set((manifest as { name: string }[]).map((s) => s.name));

describe('sound and haptic for every moment (v9)', () => {
  it('names only sounds that exist in the kit', () => {
    for (const [kind, f] of Object.entries(FEEL)) if (f.sound) expect(files.has(f.sound), kind).toBe(true);
  });
  it('gives every trip step its own tone, the same family as its alert', () => {
    for (const step of ALERT_STEPS) {
      expect(FEEL[step].sound).toBe(`m_${MOMENTS[step].sound}`);
      expect(files.has(`a_${MOMENTS[step].sound}`), step).toBe(true);
    }
  });
});

describe('the sound kit is mastered (scripts/sounds/make-tones.py)', () => {
  const kit = manifest as { group: string; name: string; seconds: number; lufs: number; peak_db: number; edge: number }[];
  it('keeps each group short, at its loudness, never clipping, ending in silence', () => {
    const limits: Record<string, { max: number; lufs: number }> = { ui: { max: 0.7, lufs: -24 }, moment: { max: 2.0, lufs: -20 }, alert: { max: 2.5, lufs: -16 } };
    for (const s of kit) {
      const l = limits[s.group] as { max: number; lufs: number };
      expect(s.seconds, s.name).toBeLessThanOrEqual(l.max);
      expect(Math.abs(s.lufs - l.lufs), s.name).toBeLessThanOrEqual(1);
      expect(s.peak_db, s.name).toBeLessThanOrEqual(-1);
      expect(s.edge, s.name).toBeLessThan(0.001);
    }
  });
});
