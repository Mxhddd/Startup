// The "app" Edge Function: the one door for every write that matters.
// 1. Check the caller's login token and find who they are.
// 2. Check the input.
// 3. Call the matching database function, which checks their role (supabase/migrations/..._actions.sql).
// Logs say only which action ran and how it ended: never tokens, phone numbers or children's names.
import { BadInput, bool, date, isoTime, num, oneOf, optionalUuid, phone, uuid, uuids } from './validate.ts';
import { byteaHex, hashToken, isInviteToken, newInviteToken } from './tokens.ts';

export type Deps = {
  /** Returns the user id for a valid login token, or null. */
  userFromToken: (jwt: string) => Promise<string | null>;
  /** Calls a database function with the server's key. */
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  siteUrl: string;
  log: (line: string) => void;
  newToken?: () => string;
};

type Body = Record<string, unknown>;
type Ctx = { actor: string; body: Body; deps: Deps };
type Action = (ctx: Ctx) => Promise<unknown>;

const STEPS = ['left', 'picked', 'reached_school', 'left_school', 'dropped'] as const;
const CHILD_STEPS = ['picked', 'dropped'];

// Database error codes -> HTTP status. Anything else is a 500 with no detail.
const KNOWN: Record<string, number> = {
  not_your_van: 403, not_your_child: 403, not_admin: 403, not_family_owner: 403,
  van_switched_off: 403, van_not_verified: 403,
  trip_not_found: 404, membership_not_found: 404, user_not_found: 404,
  invite_invalid: 410,
  trip_not_running: 409, trip_already_running: 409, trip_already_done: 409, van_day_off: 409,
  already_decided: 409, child_already_on_a_van: 409, van_already_left: 409, family_full: 409,
  child_not_on_van: 422, children_required: 422, step_not_tappable: 422, van_step_has_no_children: 422,
  stop_not_on_van: 422, position_out_of_range: 422, date_in_past: 422,
};

class DbError extends Error {}

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
  'trip.start': async ({ actor, body, deps }) => ({
    tripId: await call(deps, 'start_trip', {
      p_actor: actor, p_van: uuid(body, 'vanId'), p_kind: oneOf(body, 'kind', ['morning', 'afternoon'] as const),
      p_client_id: uuid(body, 'clientId'), p_practice: bool(body, 'practice', false),
    }),
  }),
  'trip.end': async ({ actor, body, deps }) => {
    await call(deps, 'end_trip', { p_actor: actor, p_trip: uuid(body, 'tripId') });
    return { ok: true };
  },
  tap: async ({ actor, body, deps }) => {
    const step = oneOf(body, 'step', STEPS);
    const children = CHILD_STEPS.includes(step) ? uuids(body, 'childIds') : null;
    return {
      stored: await call(deps, 'record_tap', {
        p_actor: actor, p_trip: uuid(body, 'tripId'), p_step: step, p_children: children,
        p_client_id: uuid(body, 'clientId'), p_happened_at: isoTime(body, 'happenedAt'),
      }),
    };
  },
  'tap.undo': async ({ actor, body, deps }) => ({ undone: await call(deps, 'undo_tap', { p_actor: actor, p_client_id: uuid(body, 'clientId') }) }),
  late: async ({ actor, body, deps }) => ({
    stored: await call(deps, 'report_late', {
      p_actor: actor, p_trip: uuid(body, 'tripId'), p_reason: oneOf(body, 'reason', ['traffic', 'breakdown', 'roadClosed'] as const), p_client_id: uuid(body, 'clientId'),
    }),
  }),
  position: async ({ actor, body, deps }) => {
    const rows = (await call(deps, 'record_position', {
      p_actor: actor, p_trip: uuid(body, 'tripId'),
      p_lat: num(body, 'lat', -90, 90), p_lng: num(body, 'lng', -180, 180),
      p_heading: num(body, 'heading', 0, 360, true), p_speed: num(body, 'speed', 0, 80, true),
      p_recorded_at: isoTime(body, 'recordedAt'),
    })) as { child_id: string }[] | null;
    // B6 sends the "arriving" pushes for these children.
    return { arriving: (rows ?? []).map((r) => r.child_id) };
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
    await call(deps, 'set_van_day_off', { p_actor: actor, p_van: uuid(body, 'vanId'), p_date: date(body, 'date'), p_off: bool(body, 'off') });
    return { ok: true };
  },
  'family.add': async ({ actor, body, deps }) => {
    const member = (await call(deps, 'user_id_by_phone', { p_phone: phone(body, 'phone') })) as string | null;
    // The person must have opened Pohnch once (so they have an account) before they can be added.
    if (!member) throw new DbError('user_not_found');
    await call(deps, 'add_family_member', { p_actor: actor, p_member: member });
    return { ok: true };
  },
  'admin.verify': async ({ actor, body, deps }) => {
    await call(deps, 'verify_van', { p_actor: actor, p_van: uuid(body, 'vanId') });
    return { ok: true };
  },
  'admin.switchOff': async ({ actor, body, deps }) => {
    await call(deps, 'switch_off_van', { p_actor: actor, p_van: uuid(body, 'vanId'), p_off: bool(body, 'off') });
    return { ok: true };
  },
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
