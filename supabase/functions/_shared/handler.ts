// The "app" Edge Function: the one door for every write that matters.
// 1. Check the caller's login token and find who they are.
// 2. Check the input.
// 3. Call the matching database function, which checks their role (supabase/migrations/..._actions.sql).
// Logs say only which action ran and how it ended: never tokens, phone numbers or children's names.
import { BadInput, bool, date, isoTime, num, oneOf, optionalUuid, phone, uuid, uuids } from './validate.ts';
import { byteaHex, hashToken, isInviteToken, newInviteToken } from './tokens.ts';
import type { DayOffJob, NotifyJob } from './notify.ts';
import type { PushStep } from './push.ts';

export type Deps = {
  /** Returns the user id for a valid login token, or null. */
  userFromToken: (jwt: string) => Promise<string | null>;
  /** Calls a database function with the server's key. */
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  siteUrl: string;
  log: (line: string) => void;
  newToken?: () => string;
  /** Sends the pushes for a stored step (notify.ts). Optional so tests can leave it out. */
  notify?: (job: NotifyJob) => Promise<void>;
  /** Updates iPhone Live Activities on locked phones (liveActivity.ts). Optional, like notify. */
  /** Tells the van's families about a whole-van day off (notify.ts). Optional, like notify. */
  dayOff?: (job: DayOffJob) => Promise<void>;
  live?: (job: { tripId: string; step: PushStep | null; van: { lat: number; lng: number; speed: number | null } | null }) => Promise<void>;
};

type Body = Record<string, unknown>;
type Ctx = { actor: string; body: Body; deps: Deps };
type Action = (ctx: Ctx) => Promise<unknown>;

const STEPS = ['left', 'picked', 'reached_school', 'left_school', 'dropped'] as const;
const CHILD_STEPS = ['picked', 'dropped'];

// Database error codes -> HTTP status. Anything else is a 500 with no detail.
const KNOWN: Record<string, number> = {
  not_your_van: 403, not_your_child: 403, not_admin: 403, not_family_owner: 403, stop_list_mismatch: 422,
  van_switched_off: 403, van_not_verified: 403,
  trip_not_found: 404, membership_not_found: 404, user_not_found: 404, member_not_found: 404,
  van_has_families: 409,
  invite_invalid: 410,
  trip_not_running: 409, trip_already_running: 409, trip_already_done: 409, van_day_off: 409,
  already_decided: 409, child_already_on_a_van: 409, van_already_left: 409, family_full: 409,
  child_not_on_van: 422, children_required: 422, step_not_tappable: 422, van_step_has_no_children: 422,
  stop_not_on_van: 422, position_out_of_range: 422, date_in_past: 422,
};

class DbError extends Error {}

/** Today's date in Karachi (YYYY-MM-DD), for "today" and "tomorrow" in pushes. */
function karachiToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

async function call(deps: Deps, fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await deps.rpc(fn, args);
  if (error) throw new DbError(error.message);
  return data;
}

async function inviteLink(deps: Deps, make: (hashHex: string) => Promise<unknown>): Promise<{ url: string }> {
  const token = (deps.newToken ?? newInviteToken)();
  await make(byteaHex(await hashToken(token)));
  return { url: `${deps.siteUrl.replace(/\/$/, '')}/i/${token}` };
}

export const actions: Record<string, Action> = {
  'trip.start': async ({ actor, body, deps }) => {
    const kind = oneOf(body, 'kind', ['morning', 'afternoon'] as const);
    const tripId = (await call(deps, 'start_trip', {
      p_actor: actor, p_van: uuid(body, 'vanId'), p_kind: kind,
      p_client_id: uuid(body, 'clientId'), p_practice: bool(body, 'practice', false),
    })) as string;
    // "The van has left" / "left school" for every family on the van (none for practice trips).
    await deps.notify?.({ tripId, step: kind === 'morning' ? 'left' : 'left_school', children: null });
    await deps.live?.({ tripId, step: kind === 'morning' ? 'left' : 'left_school', van: null });
    return { tripId };
  },
  'trip.end': async ({ actor, body, deps }) => {
    await call(deps, 'end_trip', { p_actor: actor, p_trip: uuid(body, 'tripId') });
    return { ok: true };
  },
  tap: async ({ actor, body, deps }) => {
    const step = oneOf(body, 'step', STEPS);
    const children = CHILD_STEPS.includes(step) ? uuids(body, 'childIds') : null;
    const tripId = uuid(body, 'tripId');
    const stored = (await call(deps, 'record_tap', {
      p_actor: actor, p_trip: tripId, p_step: step, p_children: children,
      p_client_id: uuid(body, 'clientId'), p_happened_at: isoTime(body, 'happenedAt'),
    })) as number;
    // Only a newly stored step sends a push: a tap resent by the offline queue stays quiet.
    if (stored > 0) {
      await deps.notify?.({ tripId, step, children });
      await deps.live?.({ tripId, step, van: null });
    }
    return { stored };
  },
  'tap.undo': async ({ actor, body, deps }) => ({ undone: await call(deps, 'undo_tap', { p_actor: actor, p_client_id: uuid(body, 'clientId') }) }),
  late: async ({ actor, body, deps }) => {
    const tripId = uuid(body, 'tripId');
    const reason = oneOf(body, 'reason', ['traffic', 'breakdown', 'roadClosed'] as const);
    const stored = (await call(deps, 'report_late', { p_actor: actor, p_trip: tripId, p_reason: reason, p_client_id: uuid(body, 'clientId') })) as number;
    if (stored > 0) await deps.notify?.({ tripId, step: 'late', children: null, reason });
    return { stored };
  },
  position: async ({ actor, body, deps }) => {
    const tripId = uuid(body, 'tripId');
    const rows = (await call(deps, 'record_position', {
      p_actor: actor, p_trip: tripId,
      p_lat: num(body, 'lat', -90, 90), p_lng: num(body, 'lng', -180, 180),
      p_heading: num(body, 'heading', 0, 360, true), p_speed: num(body, 'speed', 0, 80, true),
      p_recorded_at: isoTime(body, 'recordedAt'),
    })) as { child_id: string }[] | null;
    const arriving = (rows ?? []).map((r) => r.child_id);
    // "The van is at your door" for the families whose stop the van just reached.
    if (arriving.length) await deps.notify?.({ tripId, step: 'arriving', children: arriving });
    // A fresh arrival time on lock screens (at most about once a minute per card; the database decides).
    await deps.live?.({ tripId, step: arriving.length ? 'arriving' : null, van: { lat: Number(body.lat), lng: Number(body.lng), speed: typeof body.speed === 'number' ? body.speed : null } });
    return { arriving };
  },
  'invite.van': async ({ actor, body, deps }) => {
    const van = uuid(body, 'vanId');
    return inviteLink(deps, (hash) => call(deps, 'create_van_invite', { p_actor: actor, p_van: van, p_token_hash: hash }));
  },
  'invite.driver': async ({ actor, body, deps }) => {
    const child = uuid(body, 'childId');
    return inviteLink(deps, (hash) => call(deps, 'create_driver_invite', { p_actor: actor, p_child: child, p_token_hash: hash }));
  },
  // A parent joins a van with one child, or a driver takes a parent's request into their van.
  'invite.accept': async ({ actor, body, deps }) => {
    if (!isInviteToken(body.token)) throw new BadInput('token');
    const hash = byteaHex(await hashToken(body.token));
    const child = optionalUuid(body, 'childId');
    if (child) return { membershipId: await call(deps, 'accept_van_invite', { p_actor: actor, p_token_hash: hash, p_child: child }) };
    return { membershipId: await call(deps, 'accept_driver_invite', { p_actor: actor, p_token_hash: hash, p_van: uuid(body, 'vanId') }) };
  },
  'membership.decide': async ({ actor, body, deps }) => {
    await call(deps, 'decide_membership', { p_actor: actor, p_membership: uuid(body, 'membershipId'), p_approve: bool(body, 'approve'), p_stop: optionalUuid(body, 'stopId') });
    return { ok: true };
  },
  'absence.set': async ({ actor, body, deps }) => {
    await call(deps, 'set_absence', { p_actor: actor, p_child: uuid(body, 'childId'), p_date: date(body, 'date') });
    return { ok: true };
  },
  'absence.clear': async ({ actor, body, deps }) => {
    await call(deps, 'clear_absence', { p_actor: actor, p_child: uuid(body, 'childId'), p_date: date(body, 'date') });
    return { ok: true };
  },
  'dayoff.set': async ({ actor, body, deps }) => {
    const vanId = uuid(body, 'vanId');
    const day = date(body, 'date');
    const off = bool(body, 'off');
    await call(deps, 'set_van_day_off', { p_actor: actor, p_van: vanId, p_date: day, p_off: off });
    // The day off is saved; telling the families never fails the driver's tap.
    if (deps.dayOff) await deps.dayOff({ vanId, date: day, today: karachiToday(), off });
    return { ok: true };
  },
  'family.add': async ({ actor, body, deps }) => {
    const member = (await call(deps, 'user_id_by_phone', { p_phone: phone(body, 'phone') })) as string | null;
    // The person must have opened Pohnch once (so they have an account) before they can be added.
    if (!member) throw new DbError('user_not_found');
    await call(deps, 'add_family_member', { p_actor: actor, p_member: member });
    return { ok: true };
  },
  // The family's owner removes someone, or someone who was added leaves (memberId = themselves).
  'family.removeMember': async ({ actor, body, deps }) => {
    await call(deps, 'remove_family_member', { p_actor: actor, p_family: uuid(body, 'familyId'), p_member: uuid(body, 'memberId') });
    return { ok: true };
  },
  // Deleting my own account and its data. The app asks for a hold first and sends confirm: true.
  'account.delete': async ({ actor, body, deps }) => {
    if (body.confirm !== true) throw new BadInput('confirm');
    await call(deps, 'delete_account', { p_actor: actor });
    return { ok: true };
  },
  'admin.verify': async ({ actor, body, deps }) => {
    await call(deps, 'verify_van', { p_actor: actor, p_van: uuid(body, 'vanId') });
    return { ok: true };
  },
  'admin.endTrip': async ({ actor, body, deps }) => {
    await call(deps, 'admin_end_trip', { p_actor: actor, p_trip: uuid(body, 'tripId') });
    return { ok: true };
  },
  // A parent takes their child off the van; a driver removes a rider.
  'van.leave': async ({ actor, body, deps }) => {
    await call(deps, 'leave_van', { p_actor: actor, p_child: uuid(body, 'childId') });
    return { ok: true };
  },
  'rider.remove': async ({ actor, body, deps }) => {
    await call(deps, 'remove_rider', { p_actor: actor, p_membership: uuid(body, 'membershipId') });
    return { ok: true };
  },
  'admin.switchOff': async ({ actor, body, deps }) => {
    await call(deps, 'switch_off_van', { p_actor: actor, p_van: uuid(body, 'vanId'), p_off: bool(body, 'off') });
    return { ok: true };
  },
};

// How often one person may call each action (count per window). Generous for real use, tight enough
// to stop a runaway phone or someone probing (e.g. family.add looking up phone numbers).
const HOUR = 3600;
const DAY = 86400;
export const LIMITS: Record<string, [max: number, windowS: number]> = {
  position: [1500, HOUR], tap: [600, HOUR], 'tap.undo': [200, HOUR], late: [30, HOUR],
  'trip.start': [20, HOUR], 'trip.end': [40, HOUR],
  'invite.van': [20, DAY], 'invite.driver': [20, DAY], 'invite.accept': [30, HOUR],
  'membership.decide': [200, HOUR], 'absence.set': [60, HOUR], 'absence.clear': [60, HOUR], 'dayoff.set': [30, DAY],
  'family.add': [10, DAY], 'family.removeMember': [20, DAY], 'account.delete': [5, DAY], 'van.leave': [20, HOUR], 'rider.remove': [60, HOUR],
  'admin.verify': [300, HOUR], 'admin.switchOff': [300, HOUR], 'admin.endTrip': [300, HOUR],
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** POST /app/<action> with a JSON body and "Authorization: Bearer <login token>". */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  const name = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  const action = actions[name];
  const done = (status: number, body: unknown) => {
    deps.log(`app ${action ? name : 'unknown'} ${status}`);
    return json(status, body);
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return done(405, { error: 'method_not_allowed' });
  if (!action) return done(404, { error: 'unknown_action' });

  const auth = req.headers.get('authorization') ?? '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const actor = jwt ? await deps.userFromToken(jwt) : null;
  if (!actor) return done(401, { error: 'not_logged_in' });

  let body: Body;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    body = parsed as Body;
  } catch {
    return done(400, { error: 'bad_json' });
  }

  // Rate limit (counted in the database, per person and action). If the check itself fails we let the
  // call through: a driver's tap matters more than the limit.
  const [max, windowS] = LIMITS[name] ?? [300, HOUR];
  const limit = await deps.rpc('rate_hit', { p_actor: actor, p_bucket: name, p_max: max, p_window_s: windowS }).catch(() => ({ data: true, error: null }));
  if (limit.data === false) return done(429, { error: 'too_many' });

  try {
    return done(200, await action({ actor, body, deps }));
  } catch (e) {
    if (e instanceof BadInput) return done(400, { error: 'bad_input', field: e.field });
    if (e instanceof DbError) {
      const code = Object.keys(KNOWN).find((k) => e.message.includes(k));
      if (code) return done(KNOWN[code] as number, { error: code });
      // Constraint errors (e.g. a reason not in the list) and anything unexpected: no detail leaves the server.
      return done(500, { error: 'server_error' });
    }
    return done(500, { error: 'server_error' });
  }
}
