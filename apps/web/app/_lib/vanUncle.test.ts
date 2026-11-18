import { describe, expect, it } from 'vitest';
import { asType, QUESTIONS, resultOf, TYPES } from './vanUncle';

describe('Which Van Uncle quiz', () => {
  it('has 5 questions of 4 answers, and every type can win', () => {
    expect(QUESTIONS).toHaveLength(5);
    for (const q of QUESTIONS) expect(q).toHaveLength(4);
    for (const t of TYPES) expect(QUESTIONS.flat().filter((x) => x === t).length).toBeGreaterThanOrEqual(3);
  });
  it('picks the type with the most answers', () => {
    expect(resultOf([1, 2, 0, 3, 2])).toBe('paanch');
    expect(resultOf([3, 3, 1, 3, 0])).toBe('gayab');
    expect(resultOf([2, 0, 3, 1, 3])).toBe('dj');
  });
  it('breaks ties toward the earlier type and survives bad input', () => {
    expect(resultOf([])).toBe('toofan');
    expect(resultOf([9, -1])).toBe('toofan');
  });
  it('accepts only its own ids from a shared link', () => {
    expect(asType('dj')).toBe('dj');
    expect(asType('<script>')).toBeNull();
    expect(asType(undefined)).toBeNull();
  });
});
