// The driver app's data. Reads go straight to Supabase (row-level security shows only this driver's
// van); every write that matters goes through the "app" Edge Function, and taps go through the
// offline queue first.
import { karachiDate, type EventRow, type RiderRow, type StopRow } from '@pohnch/core';
import { backend } from './backend';

export type Van = { id: string; name: string; school_name: string; plate: string | null; verified_at: string | null; switched_off_at: string | null };
export type Stop = StopRow & { lat: number; lng: number; morning_time: string | null; afternoon_time: string | null };
export type Request = { membershipId: string; childId: string; firstName: string; lat: number | null; lng: number | null };
export type Trip = { id: string; kind: 'morning' | 'afternoon'; status: 'running' | 'ended' | 'cancelled'; is_practice: boolean; started_at: string };

function db() {
  if (!backend) throw Object.assign(new Error('notConfigured'), { kind: 'notConfigured' });
  return backend;
}

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw r.error;
  return r.data;
}

/** The name this driver chose at first login ("Rafiq bhai"), for the greeting. */
export async function myName(): Promise<string | null> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;
  const row = check(await supabase.from('profiles').select('display_name').eq('id', uid).maybeSingle()) as { display_name: string } | null;
  return row?.display_name ?? null;
}

export async function myVan(): Promise<Van | null> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;
  return check(await supabase.from('vans').select('id, name, school_name, plate, verified_at, switched_off_at').eq('driver_id', uid).maybeSingle()) as Van | null;
}

export async function createVan(v: { name: string; schoolName: string; plate: string | null }): Promise<Van> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  return check(await supabase.from('vans').insert({ driver_id: uid, name: v.name, school_name: v.schoolName, plate: v.plate }).select().single()) as Van;
}

export async function updateVan(id: string, v: { name: string; schoolName: string; plate: string | null }): Promise<void> {
  check(await db().supabase.from('vans').update({ name: v.name, school_name: v.schoolName, plate: v.plate }).eq('id', id));
}

export async function stopsOf(vanId: string): Promise<Stop[]> {
  return check(await db().supabase.from('stop_points').select('*').eq('van_id', vanId).order('position')) as Stop[];
}

export async function addStop(vanId: string, s: { label: string; lat: number; lng: number }): Promise<void> {
  check(await db().supabase.rpc('add_stop', { p_van: vanId, p_label: s.label, p_lat: s.lat, p_lng: s.lng }));
}

export async function updateStop(id: string, s: { label?: string; morning_time?: string | null; afternoon_time?: string | null }): Promise<void> {
  check(await db().supabase.from('stops').update(s).eq('id', id));
}

export async function removeStop(id: string): Promise<void> {
  check(await db().supabase.from('stops').delete().eq('id', id));
}

export async function reorderStops(vanId: string, ids: string[]): Promise<void> {
  check(await db().supabase.rpc('reorder_stops', { p_van: vanId, p_ids: ids }));
}

/** Approved riders (with their stop) and waiting requests, first names only. */
export async function ridersOf(vanId: string): Promise<{ riders: RiderRow[]; requests: Request[] }> {
  const { supabase } = db();
  const rows = check(
    await supabase.from('memberships').select('id, child_id, stop_id, status').eq('van_id', vanId).in('status', ['pending', 'approved']),
  ) as { id: string; child_id: string; stop_id: string | null; status: string }[];
  const ids = rows.map((r) => r.child_id);
  const kids = ids.length
    ? (check(await supabase.from('child_points').select('id, first_name, lat, lng').in('id', ids)) as { id: string; first_name: string; lat: number | null; lng: number | null }[])
    : [];
  const byId = new Map(kids.map((k) => [k.id, k]));
  const riders: RiderRow[] = [];
  const requests: Request[] = [];
  for (const r of rows) {
    const k = byId.get(r.child_id);
    if (!k) continue;
    if (r.status === 'approved') riders.push({ childId: r.child_id, firstName: k.first_name, stopId: r.stop_id, membershipId: r.id });
    else requests.push({ membershipId: r.id, childId: r.child_id, firstName: k.first_name, lat: k.lat, lng: k.lng });
  }
  return { riders, requests };
}

export async function absencesOn(date: string): Promise<string[]> {
  const rows = check(await db().supabase.from('absences').select('child_id').eq('service_date', date)) as { child_id: string }[];
  return rows.map((r) => r.child_id);
}

export async function tripsToday(vanId: string): Promise<Trip[]> {
  return check(
    await db().supabase.from('trips').select('id, kind, status, is_practice, started_at').eq('van_id', vanId).eq('service_date', karachiDate(new Date())).order('started_at'),
  ) as Trip[];
}

export async function eventsOf(tripId: string): Promise<EventRow[]> {
  const rows = check(await db().supabase.from('trip_events').select('child_id, step, undone_at').eq('trip_id', tripId)) as { child_id: string | null; step: string; undone_at: string | null }[];
  return rows.map((r) => ({ childId: r.child_id, step: r.step, undone: r.undone_at !== null }));
}

/** The van's days off from a date onwards (YYYY-MM-DD, soonest first). */
export async function daysOffFrom(vanId: string, date: string): Promise<string[]> {
  const rows = check(
    await db().supabase.from('van_days_off').select('service_date').eq('van_id', vanId).gte('service_date', date).order('service_date'),
  ) as { service_date: string }[];
  return rows.map((r) => r.service_date);
}

/**
 * The van's last 7 days: real trips that ended, and how many were tracked start to finish
 * (the morning reached school; the afternoon dropped every child it set out with).
 */
export async function weekTrips(vanId: string, from: string): Promise<{ done: number; tracked: number }> {
  const rows = check(
    await db().supabase.from('trips').select('id, kind, status, trip_events(step, undone_at)').eq('van_id', vanId).eq('is_practice', false).eq('status', 'ended').gte('service_date', from),
  ) as { kind: 'morning' | 'afternoon'; trip_events: { step: string; undone_at: string | null }[] }[];
  const tracked = rows.filter((r) => {
    const steps = new Set(r.trip_events.filter((e) => !e.undone_at).map((e) => e.step));
    return r.kind === 'morning' ? steps.has('left') && steps.has('reached_school') : steps.has('left_school') && steps.has('dropped');
  }).length;
  return { done: rows.length, tracked };
}

/** The van's school on the map (placed by the driver), or null. */
export async function schoolPoint(vanId: string): Promise<{ lat: number; lng: number } | null> {
  const rows = check(await db().supabase.rpc('school_point', { p_van: vanId })) as { lat: number; lng: number }[] | null;
  return rows?.[0] ?? null;
}

export async function setSchoolPin(vanId: string, lat: number, lng: number): Promise<void> {
  check(await db().supabase.rpc('set_school_pin', { p_van: vanId, p_lat: lat, p_lng: lng }));
}

/** Children whose family said "we're ready" on this trip (ids only). */
export async function readyOn(tripId: string): Promise<string[]> {
  const rows = check(await db().supabase.from('ready_signals').select('child_id').eq('trip_id', tripId)) as { child_id: string }[];
  return rows.map((r) => r.child_id);
}

// ---- writes through the Edge Function
export const driverApi = {
  startTrip: (vanId: string, kind: 'morning' | 'afternoon', clientId: string) => db().api<{ tripId: string }>('trip.start', { vanId, kind, clientId }),
  endTrip: (tripId: string) => db().api('trip.end', { tripId }),
  late: (tripId: string, reason: 'traffic' | 'breakdown' | 'roadClosed', clientId: string) => db().api('late', { tripId, reason, clientId }),
  undo: (clientId: string) => db().api('tap.undo', { clientId }),
  inviteLink: (vanId: string) => db().api<{ url: string }>('invite.van', { vanId }),
  /** A parent's "invite my driver" link: their child's request joins this driver's van. */
  acceptFamilyInvite: (token: string, vanId: string) => db().api<{ membershipId: string }>('invite.accept', { token, vanId }),
  decide: (membershipId: string, approve: boolean, stopId: string | null) => db().api('membership.decide', { membershipId, approve, stopId }),
  dayOff: (vanId: string, date: string, off: boolean) => db().api('dayoff.set', { vanId, date, off }),
  removeRider: (membershipId: string) => db().api('rider.remove', { membershipId }),
  position: (body: { tripId: string; lat: number; lng: number; heading: number | null; speed: number | null; recordedAt: string }) =>
    db().api<{ arriving: string[] }>('position', body),
  /** Used by the offline queue to send anything it holds. */
  send: (action: string, body: Record<string, unknown>) => db().api(action, body),
};
