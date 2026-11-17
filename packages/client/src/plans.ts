// Pohnch Plus (pricing v2). Families pay from day one: no free tier, no free month. The 'billing'
// switch (app_flags) turns charging on for everyone or one van; while it is off, the pilot is
// unchanged. Payments are recorded by the Pohnch team (pilot) or, later, a Play Billing server
// function; the apps only read. Nothing here returns a phone number or a hash.
import { ApiError, type PlanKind } from '@pohnch/core';
import { backend } from './backend';

function db() {
  if (!backend) throw Object.assign(new Error('notConfigured'), { kind: 'notConfigured' });
  return backend;
}
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new ApiError(r.error.message.split(/\s/)[0] ?? 'error', 400);
  return r.data;
}

/** Is charging switched on for me (everyone, or my van)? */
export async function billingOn(): Promise<boolean> {
  try {
    return check(await db().supabase.rpc('flag_on', { p_key: 'billing' })) === true;
  } catch {
    return false;
  }
}

export type ChildPlan = {
  childId: string;
  firstName: string;
  vanId: string | null;
  plan: PlanKind | null;
  paidUntil: string | null;
  state: 'none' | 'active' | 'grace' | 'ended';
  monthly: number;
  founding: boolean;
  introAllowed: boolean;
  billing: boolean;
};

/** My children and what each one's plan is. */
export async function myPlans(): Promise<ChildPlan[]> {
  const rows = (check(await db().supabase.rpc('my_plans')) ?? []) as {
    child_id: string; first_name: string; van_id: string | null; plan: PlanKind | null; paid_until: string | null;
    state: ChildPlan['state']; monthly: number; founding: boolean; intro_allowed: boolean; billing: boolean;
  }[];
  return rows.map((r) => ({
    childId: r.child_id, firstName: r.first_name, vanId: r.van_id, plan: r.plan, paidUntil: r.paid_until, state: r.state,
    monthly: r.monthly, founding: r.founding, introAllowed: r.intro_allowed, billing: r.billing,
  }));
}

/** For the driver: which riders have alerts (paid, or billing off for the van). */
export async function vanPaidChildren(vanId: string): Promise<Record<string, boolean>> {
  const rows = (check(await db().supabase.rpc('van_paid_children', { p_van: vanId })) ?? []) as { child_id: string; paid: boolean }[];
  return Object.fromEntries(rows.map((r) => [r.child_id, r.paid]));
}

export type BonusMonth = { month: string; payingChildren: number; trackedPct: number | null; amount: number; paid: boolean; open: boolean };

/** For the driver: this month so far, then closed months. */
export async function myBonus(): Promise<BonusMonth[]> {
  const rows = (check(await db().supabase.rpc('my_bonus')) ?? []) as { month: string; paying_children: number; tracked_pct: number | null; amount: number; paid: boolean; open: boolean }[];
  return rows.map((r) => ({ month: r.month, payingChildren: r.paying_children, trackedPct: r.tracked_pct, amount: r.amount, paid: r.paid, open: r.open }));
}
