// The parent app's data. Reads go straight to Supabase: row-level security shows only this family's
// children and, once approved, their van, its trip and positions, and their own stop.
// Chutti, invites and family members go through the "app" Edge Function.
import { karachiDate, type ParentEvent, type TripStep } from '@pohnch/core';
import { backend } from './backend';

export type Child = { id: string; first_name: string; school_name: string; lat: number | null; lng: number | null };
export type Membership = { id: string; status: 'pending' | 'approved' | 'declined' | 'left'; van_id: string; stop_id: string | null };
export type ParentVan = { id: string; name: string; school_name: string; driver_id: string; verified_at: string | null; switched_off_at: string | null };
export type MyStop = { id: string; label: string; lat: number; lng: number; morning_time: string | null; afternoon_time: string | null };
export type ParentTrip = { id: string; kind: 'morning' | 'afternoon'; status: 'running' | 'ended' | 'cancelled'; started_at: string; ended_at: string | null };
export type Position = { lat: number; lng: number; heading: number | null; speed: number | null; recorded_at: string };

function db() {
  if (!backend) throw Object.assign(new Error('notConfigured'), { kind: 'notConfigured' });
  return backend;
}
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw r.error;
  return r.data;
}

export async function ensureFamily(): Promise<string> {
  return check(await db().supabase.rpc('ensure_family')) as string;
}

/** This person's own children (their families'), not the riders they may see as a driver. */
export async function myChildren(): Promise<Child[]> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];
  const fams = check(await supabase.from('family_members').select('family_id').eq('user_id', uid)) as { family_id: string }[];
  if (fams.length === 0) return [];
  return check(
    await supabase.from('child_points').select('id, first_name, school_name, lat, lng').in('family_id', fams.map((f) => f.family_id)).order('first_name'),
  ) as Child[];
}

export async function addChild(c: { firstName: string; schoolName: string; lat: number; lng: number }): Promise<string> {
  const { supabase } = db();
  const familyId = await ensureFamily();
  const row = check(await supabase.from('children').insert({ family_id: familyId, first_name: c.firstName, school_name: c.schoolName }).select('id').single()) as { id: string };
  await setHomePin(row.id, c.lat, c.lng);
  return row.id;
}

export async function setHomePin(childId: string, lat: number, lng: number): Promise<void> {
  check(await db().supabase.rpc('set_home_pin', { p_child: childId, p_lat: lat, p_lng: lng }));
}

export async function membershipOf(childId: string): Promise<Membership | null> {
  const rows = check(
    await db().supabase.from('memberships').select('id, status, van_id, stop_id').eq('child_id', childId).in('status', ['pending', 'approved']).limit(1),
  ) as Membership[];
  return rows[0] ?? null;
}

export async function van(vanId: string): Promise<ParentVan | null> {
  return check(await db().supabase.from('vans').select('id, name, school_name, driver_id, verified_at, switched_off_at').eq('id', vanId).maybeSingle()) as ParentVan | null;
}

/** The driver's name ("Rafiq bhai"); visible once the family follows the van. */
export async function driverName(driverId: string): Promise<string | null> {
  const row = check(await db().supabase.from('profiles').select('display_name').eq('id', driverId).maybeSingle()) as { display_name: string } | null;
  return row?.display_name ?? null;
}

export async function myStop(stopId: string): Promise<MyStop | null> {
  return check(await db().supabase.from('stop_points').select('id, label, lat, lng, morning_time, afternoon_time').eq('id', stopId).maybeSingle()) as MyStop | null;
}

export async function tripsToday(vanId: string): Promise<ParentTrip[]> {
  return check(
    await db().supabase.from('trips').select('id, kind, status, started_at, ended_at').eq('van_id', vanId).eq('service_date', karachiDate(new Date())).eq('is_practice', false).order('started_at'),
  ) as ParentTrip[];
}

export async function eventsOf(tripId: string, driver: { id: string; name: string | null }): Promise<ParentEvent[]> {
  const rows = check(
    await db().supabase.from('trip_events').select('step, child_id, happened_at, created_by, undone_at, reason').eq('trip_id', tripId).order('happened_at'),
  ) as { step: TripStep; child_id: string | null; happened_at: string; created_by: string | null; undone_at: string | null; reason: string | null }[];
  return rows.map((r) => ({
    step: r.step,
    childId: r.child_id,
    happenedAt: r.happened_at,
    by: r.created_by && r.created_by === driver.id ? driver.name : null,
    undone: r.undone_at !== null,
    reason: r.reason,
  }));
}

export async function latestPosition(tripId: string): Promise<Position | null> {
  return check(await db().supabase.from('latest_positions').select('lat, lng, heading, speed, recorded_at').eq('trip_id', tripId).maybeSingle()) as Position | null;
}

export async function recentSpeeds(tripId: string): Promise<(number | null)[]> {
  const rows = check(await db().supabase.from('positions').select('speed').eq('trip_id', tripId).order('recorded_at', { ascending: false }).limit(6)) as { speed: number | null }[];
  return rows.map((r) => r.speed);
}

export async function stopsAhead(childId: string): Promise<number | null> {
  return check(await db().supabase.rpc('stops_ahead', { p_child: childId })) as number | null;
}

export async function absenceDates(childId: string): Promise<string[]> {
  const rows = check(
    await db().supabase.from('absences').select('service_date').eq('child_id', childId).gte('service_date', karachiDate(new Date())),
  ) as { service_date: string }[];
  return rows.map((r) => r.service_date);
}

/**
 * Live updates for one van: calls onChange when a position, a step or the trip itself changes.
 * The app then re-reads what it needs (positions arrive as map data, so re-reading the view is simpler
 * and keeps row-level security in charge). Returns a function that stops listening.
 */
export function watchVan(vanId: string, tripId: string | null, onChange: (what: 'position' | 'event' | 'trip') => void): () => void {
  const { supabase } = db();
  let ch = supabase.channel(`van-${vanId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `van_id=eq.${vanId}` }, () => onChange('trip'));
  if (tripId) {
    ch = ch
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'positions', filter: `trip_id=eq.${tripId}` }, () => onChange('position'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_events', filter: `trip_id=eq.${tripId}` }, () => onChange('event'));
  }
  ch.subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}

export const parentApi = {
  setAbsence: (childId: string, date: string) => db().api('absence.set', { childId, date }),
  clearAbsence: (childId: string, date: string) => db().api('absence.clear', { childId, date }),
  joinVan: (token: string, childId: string) => db().api<{ membershipId: string }>('invite.accept', { token, childId }),
  inviteDriver: (childId: string) => db().api<{ url: string }>('invite.driver', { childId }),
  addFamilyMember: (phone: string) => db().api('family.add', { phone }),
  leaveVan: (childId: string) => db().api('van.leave', { childId }),
};
