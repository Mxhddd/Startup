import { describe, expect, it, vi } from 'vitest';
import { handle, jwtAal, type Deps } from './handler.ts';
import { hashToken, isInviteToken, newInviteToken } from './tokens.ts';

const DRIVER = '0b1c2d3e-4f50-4617-8899-aabbccddeeff';
const TRIP = '11111111-2222-4333-8444-555555555555';
const CLIENT = '99999999-8888-4777-8666-555555555555';
const VAN = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function setup(rpcResult: { data?: unknown; error?: { message: string } | null } = {}) {
  const logs: string[] = [];
  const rpc = vi.fn(async (fn: string, _args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> =>
    fn === 'rate_hit' ? { data: true, error: null } : { data: rpcResult.data ?? null, error: rpcResult.error ?? null });
  const deps: Deps = {
    userFromToken: async (jwt) => (jwt === 'good-token' ? DRIVER : null),
    rpc,
    siteUrl: 'https://pohnch.pk',
    log: (l) => logs.push(l),
  };
  const post = (action: string, body: unknown, token = 'good-token') =>
    handle(
      new Request(`https://x.supabase.co/functions/v1/app/${action}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      deps,
    );
  return { deps, rpc, logs, post };
}

describe('the app Edge Function', () => {
  it('refuses a request without a valid login', async () => {
    const { post, rpc } = setup();
    const res = await post('tap', {}, 'stolen');
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes a tap to record_tap with the logged-in driver as the actor', async () => {
    const { post, rpc } = setup({ data: 1 });
    const res = await post('tap', { tripId: TRIP, step: 'reached_school', clientId: CLIENT, happenedAt: '2026-11-02T02:40:00Z' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ stored: 1 });
    expect(rpc).toHaveBeenCalledWith('record_tap', expect.objectContaining({ p_actor: DRIVER, p_trip: TRIP, p_step: 'reached_school', p_children: null }));
  });

  it('ignores any actor the app tries to send in the body', async () => {
    const { post, rpc } = setup({ data: 1 });
    await post('tap', { tripId: TRIP, step: 'reached_school', clientId: CLIENT, happenedAt: '2026-11-02T02:40:00Z', actor: VAN, p_actor: VAN });
    expect(rpc).toHaveBeenCalledWith('record_tap', expect.objectContaining({ p_actor: DRIVER }));
  });

  it('needs children for "in the van", and at most 6 at one stop', async () => {
    const { post } = setup();
    const base = { tripId: TRIP, step: 'picked', clientId: CLIENT, happenedAt: '2026-11-02T02:12:00Z' };
    expect((await post('tap', base)).status).toBe(400);
    expect((await post('tap', { ...base, childIds: Array(7).fill(TRIP) })).status).toBe(400);
    expect((await post('tap', { ...base, childIds: [TRIP] })).status).toBe(200);
  });

  it('rejects bad input with the field name only', async () => {
    const { post } = setup();
    const res = await post('tap', { tripId: 'not-a-uuid', step: 'left', clientId: CLIENT, happenedAt: 'x' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_input', field: 'tripId' });
  });

  it('does not let the app send "arriving" (that comes from the map)', async () => {
    const { post } = setup();
    expect((await post('tap', { tripId: TRIP, step: 'arriving', clientId: CLIENT, happenedAt: '2026-11-02T02:12:00Z' })).status).toBe(400);
  });

  it('turns database refusals into clear replies', async () => {
    const { post } = setup({ error: { message: 'not_your_van' } });
    const res = await post('trip.end', { tripId: TRIP });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'not_your_van' });
  });

  it('hides unexpected database errors', async () => {
    const { post } = setup({ error: { message: 'duplicate key value violates unique constraint "x" detail: secret stuff' } });
    const res = await post('trip.end', { tripId: TRIP });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });

  it('makes an invite link with a fresh token, stores only its hash, and never logs the token', async () => {
    const { post, rpc, logs } = setup({ data: 'invite-id' });
    const res = await post('invite.van', { vanId: VAN });
    const { url } = (await res.json()) as { url: string };
    const token = url.split('/i/')[1] ?? '';
    expect(url.startsWith('https://pohnch.pk/i/')).toBe(true);
    expect(isInviteToken(token)).toBe(true);
    const [, args] = rpc.mock.calls.find(([fn]) => fn === 'create_van_invite') as unknown as [string, { p_token_hash: string }];
    expect(args.p_token_hash).toBe('\\x' + (await hashToken(token)));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(token);
    expect(logs.join('\n')).not.toContain(token);
  });

  it('logs only the action and the status (here: no account with that number)', async () => {
    const { post, logs } = setup();
    await post('family.add', { phone: '0300 1234567' });
    expect(logs).toEqual(['app family.add 404']);
    expect(logs.join('')).not.toContain('1234567');
  });

  it('normalises Pakistani phone numbers before looking them up', async () => {
    const { post, rpc } = setup({ data: DRIVER });
    await post('family.add', { phone: '0300-1234567' });
    expect(rpc).toHaveBeenCalledWith('user_id_by_phone', { p_phone: '+923001234567' });
  });

  it('v21: adds a family member by a Gmail address (lower-cased), never by phone then', async () => {
    const { post, rpc } = setup({ data: DRIVER });
    await post('family.add', { email: ' Nani.Jaan@Gmail.com ' });
    expect(rpc).toHaveBeenCalledWith('user_id_by_email', { p_email: 'nani.jaan@gmail.com' });
    expect(rpc).not.toHaveBeenCalledWith('user_id_by_phone', expect.anything());
  });

  it('v21: refuses something that is not an email address', async () => {
    const { post, rpc } = setup({ data: DRIVER });
    const r = await post('family.add', { email: 'not-an-email' });
    expect(r.status).toBe(400);
    expect(rpc).not.toHaveBeenCalledWith('user_id_by_email', expect.anything());
  });

  it('answers unknown actions and GETs without touching the database', async () => {
    const { deps, rpc } = setup();
    expect((await handle(new Request('https://x/functions/v1/app/nope', { method: 'POST', headers: { authorization: 'Bearer good-token' }, body: '{}' }), deps)).status).toBe(404);
    expect((await handle(new Request('https://x/functions/v1/app/tap'), deps)).status).toBe(405);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('invite tokens', () => {
  it('are 32 random bytes in base64url (43 characters) and differ each time', () => {
    const a = newInviteToken();
    const b = newInviteToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it('hash to 32 bytes of SHA-256, the same every time', async () => {
    const h = await hashToken('abc');
    expect(h).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('pushes after steps', () => {
  function withNotify(data: unknown) {
    const s = setup({ data });
    const notify = vi.fn(async () => undefined);
    s.deps.notify = notify;
    return { ...s, notify };
  }

  it("pushes a newly stored tap to the children's families", async () => {
    const { post, notify } = withNotify(1);
    await post('tap', { tripId: TRIP, step: 'picked', childIds: [VAN], clientId: CLIENT, happenedAt: '2026-11-02T02:12:00Z' });
    expect(notify).toHaveBeenCalledWith({ tripId: TRIP, step: 'picked', children: [VAN] });
  });

  it('stays quiet for a tap the offline queue sent twice', async () => {
    const { post, notify } = withNotify(0);
    await post('tap', { tripId: TRIP, step: 'reached_school', clientId: CLIENT, happenedAt: '2026-11-02T02:40:00Z' });
    expect(notify).not.toHaveBeenCalled();
  });

  it('tells every family when the morning trip starts', async () => {
    const { post, notify } = withNotify(TRIP);
    await post('trip.start', { vanId: VAN, kind: 'morning', clientId: CLIENT });
    expect(notify).toHaveBeenCalledWith({ tripId: TRIP, step: 'left', children: null });
  });

  it('sends "at your door" for children whose stop the van reached', async () => {
    const { post, notify } = withNotify([{ child_id: VAN }]);
    await post('position', { tripId: TRIP, lat: 24.9, lng: 67.1, recordedAt: '2026-11-02T02:10:00Z' });
    expect(notify).toHaveBeenCalledWith({ tripId: TRIP, step: 'arriving', children: [VAN] });
  });
});

describe('rate limits', () => {
  it('refuses with 429 when the database says the person is over the limit', async () => {
    const { deps, rpc } = setup();
    rpc.mockImplementation(async (fn: string) => (fn === 'rate_hit' ? { data: false, error: null } : { data: 1, error: null }));
    const res = await handle(
      new Request('https://x/functions/v1/app/family.add', { method: 'POST', headers: { authorization: 'Bearer good-token' }, body: JSON.stringify({ phone: '03001234567' }) }),
      deps,
    );
    expect(res.status).toBe(429);
    expect(rpc).not.toHaveBeenCalledWith('user_id_by_phone', expect.anything());
  });

  it("counts each call against that action's own limit", async () => {
    const { post, rpc } = setup({ data: 1 });
    await post('family.add', { phone: '03001234567' });
    expect(rpc).toHaveBeenCalledWith('rate_hit', { p_actor: DRIVER, p_bucket: 'family.add', p_max: 10, p_window_s: 86400 });
  });

  it('lets the call through if the limit check itself fails (a tap matters more)', async () => {
    const { deps, rpc } = setup();
    rpc.mockImplementation(async (fn: string) => {
      if (fn === 'rate_hit') throw new Error('db down');
      return { data: 1, error: null };
    });
    const res = await handle(
      new Request('https://x/functions/v1/app/trip.end', { method: 'POST', headers: { authorization: 'Bearer good-token' }, body: JSON.stringify({ tripId: TRIP }) }),
      deps,
    );
    expect(res.status).toBe(200);
  });
});

describe('leaving a van', () => {
  it('passes the parent and child to leave_van', async () => {
    const { post, rpc } = setup({ data: null });
    expect((await post('van.leave', { childId: VAN })).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('leave_van', { p_actor: DRIVER, p_child: VAN });
  });

  it('tells the families after a day off is saved (v8)', async () => {
    const { post, rpc, deps } = setup({ data: null });
    const dayOff = vi.fn(async () => undefined);
    deps.dayOff = dayOff;
    expect((await post('dayoff.set', { vanId: VAN, date: '2099-01-02', off: true })).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('set_van_day_off', { p_actor: DRIVER, p_van: VAN, p_date: '2099-01-02', p_off: true });
    expect(dayOff).toHaveBeenCalledWith(expect.objectContaining({ vanId: VAN, date: '2099-01-02', off: true }));
  });

  it('does not tell anyone when the day off was refused', async () => {
    const { post, deps } = setup({ error: { message: 'not_your_van' } });
    const dayOff = vi.fn(async () => undefined);
    deps.dayOff = dayOff;
    expect((await post('dayoff.set', { vanId: VAN, date: '2099-01-02', off: true })).status).toBe(403);
    expect(dayOff).not.toHaveBeenCalled();
  });

  it('removes a family member through remove_family_member', async () => {
    const { post, rpc } = setup({ data: null });
    expect((await post('family.removeMember', { familyId: VAN, memberId: TRIP })).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('remove_family_member', { p_actor: DRIVER, p_family: VAN, p_member: TRIP });
  });

  it('deletes an account only with confirm: true, and says when a van still has families', async () => {
    const { post, rpc } = setup({ data: null });
    expect((await post('account.delete', {})).status).toBe(400);
    expect(rpc).not.toHaveBeenCalledWith('delete_account', expect.anything());
    expect((await post('account.delete', { confirm: true })).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('delete_account', { p_actor: DRIVER });
    const busy = setup({ error: { message: 'van_has_families' } });
    const res = await busy.post('account.delete', { confirm: true });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'van_has_families' });
  });

  it('peeks at a van invite by the hash of its token, and never logs the token (v9)', async () => {
    const token = newInviteToken();
    const { post, rpc, logs } = setup({ data: [{ van_name: 'V1', school_name: 'School', driver_name: 'Rafiq bhai', verified: true }] });
    const res = await post('invite.peek', { token });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ vanName: 'V1', schoolName: 'School', driverName: 'Rafiq bhai', verified: true });
    const args = rpc.mock.calls.find((c) => c[0] === 'peek_van_invite')?.[1] as { p_token_hash: string };
    expect(args.p_token_hash).not.toContain(token);
    expect(logs.join(' ')).not.toContain(token);
    expect((await setup().post('invite.peek', { token: 'short' })).status).toBe(400);
  });
});

describe('v20 security in the app function', () => {
  const tok = (aal: string) => `x.${btoa(JSON.stringify({ sub: 'u', aal })).replace(/=+$/, '')}.y`;
  const make = (rate: unknown) => {
    const rpc = vi.fn(async (fn: string) => (fn === 'rate_hit' ? { data: rate, error: null } : { data: null, error: null }));
    const deps: Deps = { userFromToken: async () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', rpc, siteUrl: 'https://pohnch.pk', log: () => {} };
    const post = (action: string, token: string, body: unknown = {}) => handle(new Request(`https://x/functions/v1/app/${action}`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body) }), deps);
    return { rpc, post };
  };
  it('reads the login step from the token', () => {
    expect(jwtAal(tok('aal2'))).toBe('aal2');
    expect(jwtAal('not-a-token')).toBe(null);
  });
  it('refuses team actions from a session without the authenticator step', async () => {
    const { post, rpc } = make(true);
    const r = await post('admin.switchOff', tok('aal1'), { vanId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', off: true });
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: 'needs_second_step' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('lets the sensitive actions wait when the rate limit cannot be checked, but not a tap', async () => {
    const { post } = make(null);
    expect((await post('family.add', tok('aal1'), { phone: '03001234567' })).status).toBe(503);
    expect((await post('tap', tok('aal1'), {})).status).not.toBe(503);
  });
});
