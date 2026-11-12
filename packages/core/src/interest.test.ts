import { describe, expect, it } from 'vitest';
import { AREA_IDS, AREA_SPOTS, checkInterest, visibleCounts } from './interest';

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
