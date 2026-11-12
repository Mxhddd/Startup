// v19: the area meter's words, the school-day dial and the hub's links (pure logic, no browser).
import { describe, expect, it } from 'vitest';
import { areaMeter } from '@pohnch/core';
import { meterLine, meterParts } from './areaMeter';
import { DAY, dayState, dialStart, SECTIONS } from './scenes';
import { HUB_HASH } from './Hub';
import { webWords as words } from './words';

const w = words('en');

describe('the area meter line', () => {
  it('says ranges and what the area needs, never a count', () => {
    expect(meterLine(w, 'Gulshan-e-Iqbal', areaMeter(5, 1))).toBe('Gulshan-e-Iqbal: 3–9 families waiting · a driver interested · needs a few more families');
    expect(meterLine(w, 'DHA', areaMeter(12, 0))).toBe('DHA: 10+ families waiting · no driver yet · needs a driver to start');
    expect(meterLine(w, 'DHA', areaMeter(9, 2))).toBe('DHA: 3–9 families waiting · a driver interested · ready to start a van');
    expect(meterLine(w, 'Clifton', areaMeter(1, 0))).toContain('a few families waiting');
  });
  it('invites the first family where no one has signed up', () => {
    expect(meterParts(w, undefined)).toBeNull();
    expect(meterLine(w, 'Saddar', undefined)).toBe('No one from Saddar yet. Be the first.');
  });
  it('a driver alone reads as no families yet', () => {
    expect(meterLine(w, 'Saddar', areaMeter(0, 1))).toContain('no families yet · a driver interested');
  });
  it('reads in Urdu too', () => {
    const u = words('ur');
    expect(meterLine(u, 'گلشن', areaMeter(5, 1))).toMatch(/^گلشن: /);
  });
});

describe('a school day', () => {
  it('puts the van where a parent would see it', () => {
    expect(dayState(400, 0.4).key).toBe('before');
    const onway = dayState(419, 0.4); expect(onway.key).toBe('onway'); expect(onway.m).toBe(10); expect(onway.u).toBeGreaterThan(0); expect(onway.u).toBeLessThan(0.4);
    expect(dayState(DAY.door, 0.4)).toMatchObject({ key: 'door', u: 0.4, brake: true });
    expect(dayState(445, 0.4).key).toBe('tosch');
    expect(dayState(DAY.school, 0.4)).toMatchObject({ key: 'school', u: 1 });
    expect(dayState(600, 0.4).key).toBe('class');
    expect(dayState(800, 0.4)).toMatchObject({ key: 'back', m: 10 });
    expect(dayState(DAY.home, 0.4).key).toBe('home');
    expect(dayState(DAY.end, 0.4).key).toBe('done');
  });
  it('opens at Karachi time on a school day, else at 06:30 marked as night', () => {
    expect(dialStart(429, 1)).toEqual({ min: 429, night: false });
    expect(dialStart(22 * 60, 1)).toEqual({ min: 390, night: true });
    expect(dialStart(5 * 60, 2).night).toBe(true);
    expect(dialStart(429, 0).night).toBe(true); // Sunday
  });
});

describe('the hub', () => {
  it('replaces the old trail of sections', () => {
    expect(SECTIONS).toEqual(['hero', 'calls', 'sides', 'morning', 'lock', 'hub', 'join']);
  });
  it('has a link for every topic the top bar and footer use', () => {
    for (const h of ['#safety', '#privacy', '#questions', '#cost', '#for-drivers', '#try', '#start']) expect(HUB_HASH[h]).toBeTruthy();
  });
  it('every topic has words in both languages', () => {
    for (const lang of ['en', 'ur'] as const) for (const t of ['how', 'try', 'safety', 'privacy', 'cost', 'drivers', 'questions']) expect(words(lang)[`hub.t.${t}`]).toBeTruthy();
    for (const k of ['area.eta', 'area.left']) for (const lang of ['en', 'ur'] as const) { expect(words(lang)[k]).toContain('{area}'); }
  });
});
