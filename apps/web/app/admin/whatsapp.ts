// v22: the WhatsApp reply to a pilot sign-up, written for the team from what the person filled in
// (role, area, school, children, driver's phone), in the language they used on the site. The team member
// taps the number on /admin, WhatsApp opens with this text ready, and they only press Send.
import { t, type Lang, type MessageKey } from '@pohnch/messages';

export type SignUp = { role: 'parent' | 'driver' | 'school'; area: string; school: string | null; kids: number | null; driver_phone: string | null; whatsapp: string | null; lang: string };

/** The message text, in the sign-up's language. */
export function welcomeText(r: SignUp): string {
  const lang: Lang = r.lang === 'ur' ? 'ur' : 'en';
  const area = r.area === 'other' ? (lang === 'ur' ? 'کراچی' : 'Karachi') : t(lang, `area.${r.area}` as MessageKey);
  const school = r.school ? (lang === 'ur' ? ` (${r.school})` : ` (${r.school})`) : '';
  let said = t(lang, 'admin.wa.youSaid', { area, school });
  if (r.role === 'parent' && r.kids) said += r.kids === 1 ? t(lang, 'admin.wa.kids.one') : t(lang, 'admin.wa.kids.many', { n: r.kids });
  said += lang === 'ur' ? '۔' : '.';
  if (r.role === 'parent' && (r.driver_phone === 'yes' || r.driver_phone === 'no')) said += t(lang, `admin.wa.phone.${r.driver_phone}` as MessageKey);
  const next = t(lang, `admin.wa.next.${r.role}` as MessageKey);
  return [t(lang, 'admin.wa.hello'), said, next, t(lang, 'admin.wa.bye')].join('\n\n');
}

/** The wa.me link that opens a chat with this person and the message already typed. */
export function welcomeLink(r: SignUp): string | null {
  if (!r.whatsapp) return null;
  return `https://wa.me/${r.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(welcomeText(r))}`;
}
