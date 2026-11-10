// "Join the pilot" on pohnch.pk: the areas of Karachi people can pick, the checks on what they send,
// and the rule for showing how many families wait in an area (only from 3, so no one can be singled
// out). The website checks the form with this before sending; the `interest` Edge Function checks
// again with its own copy (supabase/functions/_shared/interest.ts), and a test keeps the two equal.
import { normalisePkMobile } from './phone';

export const AREA_IDS = [
  'dha', 'clifton', 'saddar', 'pechs', 'bahadurabad', 'gulshan', 'jauhar', 'nazimabad', 'northNazimabad',
  'fbArea', 'northKarachi', 'scheme33', 'malir', 'korangi', 'lyari', 'orangi', 'keamari', 'other',
] as const;
export type AreaId = (typeof AREA_IDS)[number];

/** Where each area sits on the waiting map (0..1 across, 0..1 down; north at the top, the sea below). */
export const AREA_SPOTS: Record<Exclude<AreaId, 'other'>, [number, number]> = {
  dha: [0.44, 0.86], clifton: [0.32, 0.8], saddar: [0.27, 0.64], pechs: [0.42, 0.6], bahadurabad: [0.47, 0.52],
  gulshan: [0.6, 0.45], jauhar: [0.73, 0.52], nazimabad: [0.31, 0.42], northNazimabad: [0.37, 0.28], fbArea: [0.48, 0.33],
  northKarachi: [0.42, 0.13], scheme33: [0.66, 0.24], malir: [0.86, 0.46], korangi: [0.66, 0.76], lyari: [0.19, 0.6],
  orangi: [0.17, 0.3], keamari: [0.1, 0.72],
};

/** An area's count is shown only from this many families. */
export const SHOW_FROM = 3;

export type Interest = {
  role: 'parent' | 'driver';
  area: AreaId;
  school: string | null;
  kids: number | null;
  driverPhone: 'yes' | 'no' | 'unknown' | null;
  whatsapp: string | null;
};

export type InterestInput = { role?: unknown; area?: unknown; school?: unknown; kids?: unknown; driverPhone?: unknown; whatsapp?: unknown };
export type InterestCheck = { ok: true; value: Interest } | { ok: false; field: 'role' | 'area' | 'school' | 'kids' | 'driverPhone' | 'whatsapp' };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Checks and tidies what the form sends. Parents give children and the driver's phone; drivers don't. */
export function checkInterest(input: InterestInput): InterestCheck {
  const role = input.role;
  if (role !== 'parent' && role !== 'driver') return { ok: false, field: 'role' };
  const area = input.area;
  if (typeof area !== 'string' || !(AREA_IDS as readonly string[]).includes(area)) return { ok: false, field: 'area' };
  const school = str(input.school).replace(/\s+/g, ' ');
  if (school.length > 80 || /[<>{}]/.test(school)) return { ok: false, field: 'school' };
  let kids: number | null = null;
  let driverPhone: Interest['driverPhone'] = null;
  if (role === 'parent') {
    const n = typeof input.kids === 'number' ? input.kids : Number(str(input.kids) || '1');
    if (!Number.isInteger(n) || n < 1 || n > 6) return { ok: false, field: 'kids' };
    kids = n;
    const d = input.driverPhone ?? 'unknown';
    if (d !== 'yes' && d !== 'no' && d !== 'unknown') return { ok: false, field: 'driverPhone' };
    driverPhone = d;
  }
  const raw = str(input.whatsapp);
  const whatsapp = raw ? normalisePkMobile(raw) : null;
  if (raw && !whatsapp) return { ok: false, field: 'whatsapp' };
  return { ok: true, value: { role, area: area as AreaId, school: school || null, kids, driverPhone, whatsapp } };
}

/** The counts the waiting map may show: areas below SHOW_FROM are left out entirely. */
export function visibleCounts(counts: Partial<Record<string, number>>): Partial<Record<AreaId, number>> {
  const out: Partial<Record<AreaId, number>> = {};
  for (const id of AREA_IDS) {
    const n = counts[id];
    if (id !== 'other' && typeof n === 'number' && n >= SHOW_FROM) out[id] = Math.floor(n);
  }
  return out;
}
