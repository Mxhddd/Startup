import { describe, expect, it } from 'vitest';
import { ALL_SCENES, FORK, SPINE, asRoad, pastFork, pathFor, roadFor } from './roads';

describe('roads', () => {
  it('puts everyone on the same road up to the fork', () => {
    for (const r of [null, 'yes', 'unsure', 'driver'] as const) expect(pathFor(r).slice(0, SPINE.length)).toEqual([...SPINE]);
    expect(pathFor(null)[FORK]).toBe('fork');
  });
  it('takes the "not sure" road when no sign was picked (scrolling on = show me more)', () => {
    expect(pathFor(null)).toEqual(pathFor('unsure'));
    expect(pathFor(null)[FORK + 1]).toBe('doubts');
  });
  it('sends "yes" straight from how-it-starts to joining', () => {
    expect(pathFor('yes').slice(FORK + 1)).toEqual(['how', 'end']);
  });
  it('gives drivers their own scenes, then home and join', () => {
    expect(pathFor('driver').slice(FORK + 1)).toEqual(['drvCalls', 'drvStart', 'home', 'end']);
  });
  it('ends every road on the join panel, with no scene twice', () => {
    for (const r of ['yes', 'unsure', 'driver'] as const) {
      const p = pathFor(r);
      expect(p[p.length - 1]).toBe('end');
      expect(new Set(p).size).toBe(p.length);
    }
  });
  it('switches road only when a jump needs it', () => {
    expect(roadFor('how', null)).toBe('yes');
    expect(roadFor('promises', 'driver')).toBe('unsure');
    expect(roadFor('drvStart', 'yes')).toBe('driver');
    expect(roadFor('home', 'driver')).toBe('driver');
    expect(roadFor('end', 'yes')).toBe('yes');
    expect(roadFor('van', 'yes')).toBe('yes');
  });
  it('reaches every scene from some road', () => {
    for (const id of ALL_SCENES) expect(pathFor(roadFor(id, null)).includes(id)).toBe(true);
  });
  it('knows when a scene is past the fork, and reads roads from strings', () => {
    const p = pathFor('yes');
    expect(pastFork(p, FORK)).toBe(false);
    expect(pastFork(p, FORK + 1)).toBe(true);
    expect(asRoad('driver')).toBe('driver');
    expect(asRoad('x')).toBeNull();
    expect(asRoad(null)).toBeNull();
  });
});
