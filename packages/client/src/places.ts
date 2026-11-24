// v24: schools from the shared list, addresses by typing, the person's contact number, and linking a
// website sign-up to this account. Typing an address never uses the phone's location.
import { KARACHI_BBOX, type SchoolRow } from '@pohnch/core';
import { backend } from './backend';

function db() {
  if (!backend) throw Object.assign(new Error('notConfigured'), { kind: 'notConfigured' });
  return backend;
}
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw r.error;
  return r.data;
}

export type School = SchoolRow & { lat: number | null; lng: number | null; verified: boolean };

/** Every school this person can pick (the checked list plus ones they added). Small: fetched once. */
export async function listSchools(): Promise<School[]> {
  return (check(await db().supabase.from('school_points').select('id, name, short, area, verified, lat, lng').order('name').limit(3000)) ?? []) as School[];
}

/** "My school isn't listed": adds it (or finds it if someone already did); the team checks it later. */
export async function addSchool(name: string, area?: string): Promise<string> {
  return check(await db().supabase.rpc('add_school', { p_name: name, p_area: area ?? null })) as string;
}

export type Place = { id: string; name: string; detail: string; lat: number; lng: number };

/** Address search in Karachi (OpenStreetMap, through Photon: free, no key). Results for the list under
 *  the search field; tapping one moves the map, then the person places the pin on their own gate. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const [w, s, e, n] = KARACHI_BBOX;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&bbox=${w},${s},${e},${n}`;
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw Object.assign(new Error('search_failed'), { kind: 'network' });
  const body = (await res.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[] };
  return (body.features ?? []).map((f, i) => {
    const p = f.properties;
    const name = p.name ?? [p.housenumber, p.street].filter(Boolean).join(' ') ?? q;
    const detail = [p.street && p.name ? p.street : null, p.district ?? p.suburb ?? p.locality, p.city].filter(Boolean).join(', ');
    return { id: `${p.osm_type ?? ''}${p.osm_id ?? i}`, name: name || q, detail, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
  });
}

/** The WhatsApp number the team can reach this person on (needed for Google sign-in accounts). */
export async function myContactPhone(): Promise<string | null> {
  const row = check(await db().supabase.from('contact_phones').select('phone').maybeSingle()) as { phone: string } | null;
  return row?.phone ?? null;
}
export async function setContactPhone(e164: string): Promise<void> {
  check(await db().supabase.rpc('set_contact_phone', { p_phone: e164 }));
}

export type LinkedInterest = { role: string; area: string | null; school: string | null; kids: number | null };
/** After login: a website sign-up with this phone number becomes part of this account. */
export async function linkMyInterest(): Promise<LinkedInterest | null> {
  const rows = check(await db().supabase.rpc('link_my_interest')) as LinkedInterest[] | null;
  return rows?.[0] ?? null;
}

/** Run once after each login: link any website sign-up with the same number (never blocks the app), and
 *  say whether the team has a way to reach this person. Google sign-in accounts have no phone number,
 *  so they are asked for a WhatsApp number once. */
export async function afterLogin(): Promise<{ needsPhone: boolean }> {
  await linkMyInterest().catch(() => null);
  const { data } = await db().supabase.auth.getUser();
  if (data.user?.phone) return { needsPhone: false };
  const contact = await myContactPhone().catch(() => 'unknown');
  return { needsPhone: !contact };
}
