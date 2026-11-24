// v24 launch: picking places and schools by typing instead of hunting on a map, the van's plate, and the
// short invite code. Pure functions, shared by both apps and the website.
import type { AreaId } from './interest';

/** Rough centre of each area, to move the map there when a parent taps an area chip (not a home: the
 *  parent still puts the pin on their own gate). */
export const AREA_CENTRES: Record<Exclude<AreaId, 'other'>, { lat: number; lng: number }> = {
  dha: { lat: 24.8, lng: 67.06 }, clifton: { lat: 24.812, lng: 67.03 }, saddar: { lat: 24.856, lng: 67.022 },
  pechs: { lat: 24.866, lng: 67.065 }, bahadurabad: { lat: 24.882, lng: 67.072 }, gulshan: { lat: 24.922, lng: 67.093 },
  jauhar: { lat: 24.915, lng: 67.131 }, nazimabad: { lat: 24.912, lng: 67.03 }, northNazimabad: { lat: 24.94, lng: 67.04 },
  fbArea: { lat: 24.93, lng: 67.072 }, northKarachi: { lat: 24.978, lng: 67.06 }, scheme33: { lat: 24.95, lng: 67.13 },
  malir: { lat: 24.893, lng: 67.2 }, korangi: { lat: 24.832, lng: 67.13 }, lyari: { lat: 24.868, lng: 66.993 },
  orangi: { lat: 24.95, lng: 66.99 }, keamari: { lat: 24.825, lng: 66.98 },
};

/** The box addresses are searched in (Karachi and around), as [west, south, east, north]. */
export const KARACHI_BBOX = [66.8, 24.72, 67.45, 25.15] as const;

export type SchoolRow = { id: string; name: string; short: string | null; area: string | null; verified?: boolean };

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const initials = (s: string) => fold(s).split(' ').map((w) => w[0]).join('');

/** Schools matching what was typed: whole words in any order ("pechs beacon"), a short name ("bcp"), or
 *  initials ("tcs" for The City School). Best matches first, at most `limit`. */
export function matchSchools(query: string, schools: SchoolRow[], limit = 8): SchoolRow[] {
  const q = fold(query);
  if (!q) return schools.slice(0, limit);
  const words = q.split(' ');
  const scored: { s: SchoolRow; score: number }[] = [];
  for (const s of schools) {
    const name = fold(`${s.name} ${s.area ?? ''}`);
    let score = 0;
    if (s.short && s.short === q.replace(/\s/g, '')) score = 100;
    else if (fold(s.name).startsWith(q)) score = 80;
    else if (words.every((w) => name.includes(w))) score = 60 - Math.min(20, name.indexOf(words[0] as string));
    else if (q.length >= 2 && initials(s.name).startsWith(q.replace(/\s/g, ''))) score = 40;
    else if (words.every((w) => name.split(' ').some((nw) => nw.startsWith(w.slice(0, 3))))) score = 20;
    if (score > 0) scored.push({ s, score: score + (s.verified === false ? -5 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name)).slice(0, limit).map((x) => x.s);
}

/** A Pakistani van plate, cleaned: "bkr 123" -> "BKR-123", "cs-1234" -> "CS-1234", "kab 12 1234" -> "KAB-12-1234".
 *  Returns null when it can't be a plate (2-3 letters, an optional 2-digit year, then 1-4 digits). */
export function normalisePlate(input: string): string | null {
  const s = input.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  const m = /^([A-Z]{2,3}) ?(\d{1,4})(?: (\d{1,4}))?$/.exec(s);
  if (!m) return null;
  const [, letters, first, second] = m as unknown as [string, string, string, string | undefined];
  if (second === undefined) return `${letters}-${first}`;                       // BKR-123
  return first.length === 2 ? `${letters}-${first}-${second}` : null;           // KAB-12-1234 (year in the middle)
}

/** A typed invite code, cleaned the way the server reads it ("abcd efgh" -> "ABCDEFGH"), or null. */
export function normaliseInviteCode(input: string): string | null {
  const c = input.toUpperCase().replace(/[\s-]/g, '');
  return /^[A-HJ-NP-Z2-9]{8}$/.test(c) ? c : null;
}
