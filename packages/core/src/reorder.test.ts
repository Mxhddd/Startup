import { describe, expect, it } from 'vitest';
import { moveId } from './reorder';

describe('moving a stop to a new place', () => {
  it('moves down and up, keeping the others in order', () => {
    expect(moveId(['a', 'b', 'c', 'd'], 'a', 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveId(['a', 'b', 'c', 'd'], 'd', 0)).toEqual(['d', 'a', 'b', 'c']);
  });
  it('stays the same for the same place or an unknown id, and clamps past the ends', () => {
    const order = ['a', 'b'];
    expect(moveId(order, 'a', 0)).toBe(order);
    expect(moveId(order, 'z', 1)).toBe(order);
    expect(moveId(['a', 'b', 'c'], 'a', 9)).toEqual(['b', 'c', 'a']);
  });
});
