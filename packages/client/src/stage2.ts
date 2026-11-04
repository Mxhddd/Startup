// v10 stage 2 (behind the switch, off until gate 1). Every call goes to a database function that
// checks who is asking and refuses with 'stage2_off' while the switch is off. Nothing here returns a
// child's name or a phone number to anyone who couldn't see it in stage 1.
import { ApiError } from '@pohnch/core';
import { backend } from './backend';

function db() {
  if (!backend) throw Object.assign(new Error('notConfigured'), { kind: 'notConfigured' });
  return backend;
}
/** Database refusals ('stage2_off', 'not_your_child'...) come back as ApiError codes the screens can word. */
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new ApiError(r.error.message.split(/\s/)[0] ?? 'error', 400);
  return r.data;
}

/** Is stage 2 switched on for me (everyone, or my van)? */
export async function stage2On(): Promise<boolean> {
  try {
    return check(await db().supabase.rpc('flag_on', { p_key: 'stage2' })) === true;
  } catch {
    return false;
  }
}

export type LiveStatus = { status: 'none' | 'trial' | 'active' | 'ended'; trialEnds: string | null; daysLeft: number };
export async function liveStatus(): Promise<LiveStatus> {
  const rows = check(await db().supabase.rpc('live_status')) as { status: LiveStatus['status']; trial_ends: string | null; days_left: number }[];
  const r = rows?.[0];
  return { status: r?.status ?? 'none', trialEnds: r?.trial_ends ?? null, daysLeft: r?.days_left ?? 0 };
}
export async function startLiveTrial(): Promise<string> {
  return check(await db().supabase.rpc('start_live_trial')) as string;
}

export type NearVan = {
  van_id: string; van_name: string; driver_name: string; school_name: string; same_school: boolean; walk_m: number;
  reliability: number | null; rating: number | null; ratings: number; monthly_fee: number | null; seats_left: number | null;
};
export async function vansNear(childId: string): Promise<NearVan[]> {
  return (check(await db().supabase.rpc('vans_near', { p_child: childId })) ?? []) as NearVan[];
}
export async function requestSeat(vanId: string, childId: string): Promise<string> {
  return check(await db().supabase.rpc('request_seat', { p_van: vanId, p_child: childId })) as string;
}

export async function requestVan(childId: string): Promise<string> {
  return check(await db().supabase.rpc('request_van', { p_child: childId })) as string;
}
export async function requestProgress(requestId: string): Promise<number> {
  return check(await db().supabase.rpc('request_progress', { p_request: requestId })) as number;
}
export async function withdrawVanRequest(requestId: string): Promise<void> {
  check(await db().supabase.rpc('withdraw_van_request', { p_request: requestId }));
}

export async function rateVan(vanId: string, stars: number, tags: string[]): Promise<void> {
  check(await db().supabase.rpc('rate_van', { p_van: vanId, p_stars: stars, p_tags: tags }));
}

export type FeeMonth = { month: string; amount: number; paid: boolean; van_name: string };
export async function childFees(childId: string): Promise<FeeMonth[]> {
  return (check(await db().supabase.rpc('child_fees', { p_child: childId })) ?? []) as FeeMonth[];
}
export type VanFee = { membership_id: string; first_name: string; amount: number; paid: boolean };
export async function vanFees(vanId: string): Promise<VanFee[]> {
  return (check(await db().supabase.rpc('van_fees', { p_van: vanId })) ?? []) as VanFee[];
}
export async function setVanFee(vanId: string, fee: number, seats?: number): Promise<void> {
  check(await db().supabase.rpc('set_van_fee', { p_van: vanId, p_fee: fee, p_seats: seats ?? null }));
}
export async function markFeePaid(membershipId: string, paid: boolean): Promise<void> {
  check(await db().supabase.rpc('mark_fee_paid', { p_membership: membershipId, p_paid: paid }));
}

export async function sendHelpAlert(tripId: string): Promise<string> {
  return check(await db().supabase.rpc('send_help_alert', { p_trip: tripId })) as string;
}
