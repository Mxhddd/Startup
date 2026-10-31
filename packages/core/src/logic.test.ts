import { describe, expect, it } from 'vitest';
import { ageParts, bearing, headingDelta, holdProgress, isolateLtr, lerpLatLng, signalState, splitRuns, undoSecondsLeft } from './index';

describe('hold to confirm', () => {
  it('fills from 0 to 1 over 800 ms and stays full', () => {
    expect(holdProgress(1000, 1000)).toBe(0);
    expect(holdProgress(1000, 1400)).toBe(0.5);
    expect(holdProgress(1000, 1800)).toBe(1);
    expect(holdProgress(1000, 9000)).toBe(1);
  });
});

describe('undo window', () => {
  it('counts 5, 4 ... 1 and then closes', () => {
    expect(undoSecondsLeft(0, 0)).toBe(5);
    expect(undoSecondsLeft(0, 100)).toBe(5);
    expect(undoSecondsLeft(0, 4100)).toBe(1);
    expect(undoSecondsLeft(0, 5000)).toBe(0);
    expect(undoSecondsLeft(0, 7000)).toBe(0);
  });
});

describe('van signal', () => {
  it('is live up to 30 s, then stale with its age', () => {
    expect(signalState(0, 30_000)).toEqual({ stale: false, secondsAgo: 30 });
    expect(signalState(0, 40_000)).toEqual({ stale: true, secondsAgo: 40 });
  });
  it('splits ages into a number and a unit', () => {
    expect(ageParts(40)).toEqual({ n: 40, unit: 's' });
    expect(ageParts(185)).toEqual({ n: 3, unit: 'min' });
    expect(ageParts(7300)).toEqual({ n: 2, unit: 'h' });
  });
});

describe('mixed Urdu and digits', () => {
  it('splits a time out of an Urdu sentence without losing characters', () => {
    const text = 'رفیق بھائی نے مارک کیا · 7:12';
    const runs = splitRuns(text);
    expect(runs.map((r) => r.text).join('')).toBe(text);
    expect(runs.filter((r) => r.latin).map((r) => r.text)).toEqual(['7:12']);
  });
  it('keeps a phone number as one run', () => {
    expect(splitRuns('واٹس ایپ 0300 1478729').filter((r) => r.latin).map((r) => r.text)).toEqual(['0300 1478729']);
  });
  it('wraps Latin text in isolate marks', () => {
    expect(isolateLtr('7:12')).toBe('⁦7:12⁩');
  });
});

describe('van marker motion', () => {
  it('glides halfway between two points', () => {
    expect(lerpLatLng({ latitude: 24, longitude: 67 }, { latitude: 25, longitude: 68 }, 0.5)).toEqual({ latitude: 24.5, longitude: 67.5 });
  });
  it('points north and east correctly', () => {
    expect(bearing({ latitude: 24.86, longitude: 67 }, { latitude: 24.9, longitude: 67 })).toBeCloseTo(0, 5);
    expect(bearing({ latitude: 0, longitude: 67 }, { latitude: 0, longitude: 67.1 })).toBeCloseTo(90, 5);
  });
  it('turns the short way round', () => {
    expect(headingDelta(350, 10)).toBe(20);
    expect(headingDelta(10, 350)).toBe(-20);
    expect(headingDelta(0, 180)).toBe(-180);
  });
});
