// The parent app's data. Reads go straight to Supabase: row-level security shows only this family's
// children and, once approved, their van, its trip and positions, and their own stop.
// Chutti, invites and family members go through the "app" Edge Function.
import { karachiDate, type ParentEvent, type TripStep } from '@pohnch/core';
import { backend } from './backend';

export type Child = { id: string; first_name: string; school_name: string; lat: number | null; lng: number | null };
export type Membership = { id: string; status: 'pending' | 'approved' | 'declined' | 'left'; van_id: string; stop_id: string | null };
export type ParentVan = { id: string; name: string; school_name: string; plate: string | null; driver_id: string; verified_at: string | null; switched_off_at: string | null };
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

/** Renames a child or changes their school (row-level security: only their family can). */
export async function updateChild(id: string, c: { firstName: string; schoolName: string }): Promise<void> {
  check(await db().supabase.from('children').update({ first_name: c.firstName, school_name: c.schoolName }).eq('id', id));
}

/** Removes a child and everything about them (their van place, chutti days and trip steps go too). */
export async function removeChild(id: string): Promise<void> {
  check(await db().supabase.from('children').delete().eq('id', id));
}

export type FamilyMember = { family_id: string; user_id: string; display_name: string; is_owner: boolean; is_me: boolean; added_at: string };

/** The people in my families, by name (never phone numbers): owners first. */
export async function familyMembers(): Promise<FamilyMember[]> {
  return (check(await db().supabase.rpc('my_family_members')) ?? []) as FamilyMember[];
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
  return check(await db().supabase.from('vans').select('id, name, school_name, plate, driver_id, verified_at, switched_off_at').eq('id', vanId).maybeSingle()) as ParentVan | null;
}

/** The driver's name ("Rafiq bhai"); visible once the family follows the van. */
export async function driverName(driverId: string): Promise<string | null> {
  const row = check(await db().supabase.from('profiles').select('display_name').eq('id', driverId).maybeSingle()) as { display_name: string } | null;
  return row?.display_name ?? null;
}

export async function myStop(stopId: string): Promise<MyStop | null> {
  return check(await db().supabase.from('stop_points').select('id, label, lat, lng, morning_time, afternoon_time').eq('id', stopId).maybeSingle()) as MyStop | null;
}

/** The van's real trips on one school day (YYYY-MM-DD), for the week's history. */
export async function tripsOn(vanId: string, date: string): Promise<ParentTrip[]> {
  return check(
    await db().supabase.from('trips').select('id, kind, status, started_at, ended_at').eq('van_id', vanId).eq('service_date', date).eq('is_practice', false).order('started_at'),
  ) as ParentTrip[];
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
  return (await recentPositions(tripId)).slice(0, 6).map((r) => r.speed);
}

export type TrailPoint = { lat: number; lng: number; speed: number | null; recorded_at: string };

/** The van's last ~2-3 minutes (newest first): speeds for the ETA, points for the trail on the map. */
export async function recentPositions(tripId: string, limit = 30): Promise<TrailPoint[]> {
  return check(
    await db().supabase.from('positions').select('lat, lng, speed, recorded_at').eq('trip_id', tripId).order('recorded_at', { ascending: false }).limit(limit),
  ) as TrailPoint[];
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

/** The van's school on the map (placed by the driver), or null. */
export async function schoolPoint(vanId: string): Promise<{ lat: number; lng: number } | null> {
  const rows = check(await db().supabase.rpc('school_point', { p_van: vanId })) as { lat: number; lng: number }[] | null;
  return rows?.[0] ?? null;
}

/** "We're ready": tells the driver this child is at the door (once per trip; a repeat changes nothing). */
export async function sayReady(tripId: string, childId: string): Promise<void> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  check(await supabase.from('ready_signals').upsert({ trip_id: tripId, child_id: childId, created_by: uid }, { onConflict: 'trip_id,child_id', ignoreDuplicates: true }));
}

export async function isReady(tripId: string, childId: string): Promise<boolean> {
  const rows = check(await db().supabase.from('ready_signals').select('child_id').eq('trip_id', tripId).eq('child_id', childId)) as unknown[];
  return rows.length > 0;
}

/** The van's whole-van days off from a date on (set by the driver; readable once the family follows the van). */
export async function vanDaysOff(vanId: string, from: string): Promise<string[]> {
  const rows = check(
    await db().supabase.from('van_days_off').select('service_date').eq('van_id', vanId).gte('service_date', from).order('service_date').limit(10),
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
  /** The owner removes someone; someone added removes themselves to leave. */
  removeFamilyMember: (familyId: string, memberId: string) => db().api('family.removeMember', { familyId, memberId }),
};

export type NotificationPrefs = { offSteps: string[]; sound: boolean };

/** This person's alert settings (defaults when they never changed anything). */
export async function notificationPrefs(): Promise<NotificationPrefs> {
  const { supabase } = db();
  const row = check(await supabase.from('notification_prefs').select('off_steps, sound').maybeSingle()) as { off_steps: string[]; sound: boolean } | null;
  return { offSteps: row?.off_steps ?? [], sound: row?.sound ?? true };
}

export async function saveNotificationPrefs(p: NotificationPrefs): Promise<void> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  check(await supabase.from('notification_prefs').upsert({ user_id: uid, off_steps: p.offSteps, sound: p.sound, updated_at: new Date().toISOString() }));
}

/** The language pushes are written in (and the app's own language, which the caller switches). */
export async function setAlertLanguage(lang: 'ur' | 'en'): Promise<void> {
  const { supabase } = db();
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  check(await supabase.from('profiles').update({ lang }).eq('id', uid));
}

/** Saves an iPhone Live Activity token so the server can update the card on a locked phone. */
export async function registerActivityToken(t: { token: string; kind: 'update' | 'start' | 'android'; tripId?: string; childId?: string }): Promise<void> {
  const { supabase } = db();
  check(
    await supabase
      .from('live_activity_tokens')
      .upsert({ token: t.token, kind: t.kind, trip_id: t.tripId ?? null, child_id: t.childId ?? null }, { onConflict: 'token', ignoreDuplicates: true }),
  );
}
