import { describe, expect, it } from 'vitest';
import { glidePosition, MAX_AHEAD_MS, predicted, speedOf, type GlideState } from './glide';

const P = (lat: number, lng: number) => ({ latitude: lat, longitude: lng });
const north = 9 / 111_320; // 9 m in degrees of latitude

describe('glide v2: smooth, never jumping, never stalling', () => {
  const s: GlideState = { prev: { at: 0, p: P(24.9, 67.0) }, last: { at: 5000, p: P(24.9 + 5 * north, 67.0) }, from: P(24.9 + 4 * north, 67.0), fromAt: 5000 };

  it('measures the speed between two fixes', () => {
    expect(speedOf(s.prev!, s.last)).toBeCloseTo(9, 1);
  });
  it('starts where the van was drawn (no jump when a fix arrives)', () => {
    expect(glidePosition(s, 5000)).toEqual(s.from);
  });
  it('keeps rolling ahead after the fix, but not forever', () => {
    const at2s = predicted(s, 7000).latitude;
    expect(at2s).toBeGreaterThan(s.last.p.latitude);
    expect(predicted(s, 5000 + MAX_AHEAD_MS + 10_000).latitude).toBeCloseTo(predicted(s, 5000 + MAX_AHEAD_MS).latitude, 12);
  });
  it('stays put when the van has stopped', () => {
    const stopped: GlideState = { ...s, prev: { at: 0, p: s.last.p } };
    expect(predicted(stopped, 9000)).toEqual(s.last.p);
  });
  it('moves without sudden steps from frame to frame', () => {
    let prev = glidePosition(s, 5000).latitude;
    for (let t = 5016; t < 9000; t += 16) {
      const now = glidePosition(s, t).latitude;
      expect(Math.abs(now - prev) * 111_320).toBeLessThan(0.6); // under 0.6 m per frame at ~32 km/h
      prev = now;
    }
  });
});
