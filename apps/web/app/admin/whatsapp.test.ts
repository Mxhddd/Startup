import { describe, expect, it } from 'vitest';
import { welcomeLink, welcomeText, type SignUp } from './whatsapp';

const parent: SignUp = { role: 'parent', area: 'malir', school: 'Karachi Public School', kids: 2, driver_phone: 'unknown', whatsapp: '+923001234567', lang: 'en' };

describe('v22 WhatsApp reply to a sign-up', () => {
  it("uses what a parent filled in and asks for the driver's number", () => {
    const m = welcomeText(parent);
    expect(m).toContain('Malir (Karachi Public School), for 2 children.');
    expect(m).toContain("van driver's name and number");
    expect(m).toContain('pohnch.pk/app');
    expect(m).not.toContain('smartphone');
  });
  it('mentions the driver’s phone only when the parent told us', () => {
    expect(welcomeText({ ...parent, driver_phone: 'yes' })).toContain('has a smartphone');
    expect(welcomeText({ ...parent, kids: 1, driver_phone: 'no' })).toContain('for 1 child.');
  });
  it('writes to drivers and schools differently, and in Urdu for Urdu sign-ups', () => {
    expect(welcomeText({ ...parent, role: 'driver', kids: null })).toContain('Pohnch Driver app');
    expect(welcomeText({ ...parent, role: 'school', kids: null })).toContain('15-minute call');
    const ur = welcomeText({ ...parent, lang: 'ur' });
    expect(ur).toContain('ملیر');
    expect(ur).toContain('2 بچوں');
  });
  it('opens the right chat with the text typed in', () => {
    const l = welcomeLink(parent)!;
    expect(l.startsWith('https://wa.me/923001234567?text=')).toBe(true);
    expect(decodeURIComponent(l.split('text=')[1]!)).toBe(welcomeText(parent));
    expect(welcomeLink({ ...parent, whatsapp: null })).toBeNull();
  });
});
