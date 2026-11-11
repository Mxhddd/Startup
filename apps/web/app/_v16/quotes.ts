// Real words from pilot families and drivers, added only with their permission (first names only).
// A quote shows under its panel on the home page's front door (parents or drivers) and in the
// quotes section; while there are none, those places stay hidden. Add an entry like:
//   { role: 'parent', name: 'Uroosa, Gulshan', en: 'I stopped calling the driver in the first week.', ur: 'پہلے ہفتے میں ہی ڈرائیور کو کال کرنا چھوڑ دیا۔' },
export type Quote = { role: 'parent' | 'driver'; name: string; en: string; ur: string };
export const QUOTES: Quote[] = [];

/** The first quote for a role, in one language, or null when there is none yet. */
export function quoteFor(list: Quote[], role: Quote['role'], lang: 'ur' | 'en'): { name: string; text: string } | null {
  const q = list.find((x) => x.role === role);
  return q ? { name: q.name, text: q[lang] } : null;
}
