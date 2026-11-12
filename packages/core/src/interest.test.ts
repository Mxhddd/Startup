import { describe, expect, it } from 'vitest';
import { AREA_IDS, AREA_SPOTS, VAN_FAMILIES, areaMeter, checkInterest, visibleCounts } from './interest';

describe('join the pilot: checks', () => {
  it('accepts a parent with everything filled and tidies it', () => {
    const r = checkInterest({ role: 'parent', area: 'gulshan', school: '  The  City School ', kids: '2', driverPhone: 'yes', whatsapp: '0300-123 4567' });
    expect(r).toEqual({ ok: true, value: { role: 'parent', area: 'gulshan', school: 'The City School', kids: 2, driverPhone: 'yes', whatsapp: '+923001234567' } });
  });
  it('lets the WhatsApp number and school be left out', () => {
    const r = checkInterest({ role: 'parent', area: 'dha' });
    expect(r.ok && r.value).toMatchObject({ school: null, whatsapp: null, kids: 1, driverPhone: 'unknown' });
  });
  it('asks drivers only for the area, school and number', () => {
    const r = checkInterest({ role: 'driver', area: 'malir', kids: 4, driverPhone: 'no' });
    expect(r.ok && r.value).toMatchObject({ role: 'driver', kids: null, driverPhone: null });
  });
  it("takes a school's interest only with its name and an office WhatsApp number (v18)", () => {
    expect(checkInterest({ role: 'school', area: 'gulshan', school: ' City  School ', whatsapp: '0300 1112233', kids: 3, driverPhone: 'yes' }))
      .toEqual({ ok: true, value: { role: 'school', area: 'gulshan', school: 'City School', kids: null, driverPhone: null, whatsapp: '+923001112233' } });
    expect(checkInterest({ role: 'school', area: 'gulshan', whatsapp: '03001112233' })).toEqual({ ok: false, field: 'school' });
    expect(checkInterest({ role: 'school', area: 'gulshan', school: 'City School' })).toEqual({ ok: false, field: 'whatsapp' });
  });
  it('names the field that is wrong', () => {
    expect(checkInterest({ role: 'admin', area: 'dha' })).toEqual({ ok: false, field: 'role' });
    expect(checkInterest({ role: 'parent', area: 'mars' })).toEqual({ ok: false, field: 'area' });
    expect(checkInterest({ role: 'parent', area: 'dha', kids: 9 })).toEqual({ ok: false, field: 'kids' });
    expect(checkInterest({ role: 'parent', area: 'dha', whatsapp: '12345' })).toEqual({ ok: false, field: 'whatsapp' });
    expect(checkInterest({ role: 'parent', area: 'dha', school: 'x'.repeat(81) })).toEqual({ ok: false, field: 'school' });
    expect(checkInterest({ role: 'parent', area: 'dha', school: '<script>' })).toEqual({ ok: false, field: 'school' });
    expect(checkInterest({ role: 'parent', area: 'dha', driverPhone: 'maybe' })).toEqual({ ok: false, field: 'driverPhone' });
  });
});

describe('the waiting map', () => {
  it('shows an area only from 3 families, and never "somewhere else"', () => {
    expect(visibleCounts({ gulshan: 12, dha: 2, other: 40, nowhere: 9 })).toEqual({ gulshan: 12 });
  });
  it('has a place on the map for every area but "somewhere else"', () => {
    for (const id of AREA_IDS) if (id !== 'other') expect(AREA_SPOTS[id]).toBeDefined();
  });
});

describe('the live area meter (v19)', () => {
  it('shows families only in bands, never an exact number', () => {
    expect([0, 1, 2, 3, 9, 10, 40].map((n) => areaMeter(n, 0).f)).toEqual([null, 'few', 'few', '3-9', '3-9', '10+', '10+']);
  });
  it('says what an area still needs before a van can start', () => {
    expect(areaMeter(2, 0)).toEqual({ f: 'few', d: 'none', s: 'forming', m: 'several' });
    expect(areaMeter(6, 0)).toEqual({ f: '3-9', d: 'none', s: 'forming', m: 'few' });
    expect(areaMeter(5, 1)).toEqual({ f: '3-9', d: 'yes', s: 'needs-families', m: 'few' });
    expect(areaMeter(0, 2)).toEqual({ f: null, d: 'yes', s: 'needs-families', m: 'several' });
    expect(areaMeter(8, 0)).toEqual({ f: '3-9', d: 'none', s: 'needs-driver', m: null });
    expect(areaMeter(12, 1)).toEqual({ f: '10+', d: 'yes', s: 'ready', m: null });
    expect(VAN_FAMILIES).toBe(8);
  });
});
