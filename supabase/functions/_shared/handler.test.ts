import { describe, expect, it, vi } from 'vitest';
import { handle, type Deps } from './handler.ts';
import { hashToken, isInviteToken, newInviteToken } from './tokens.ts';

const DRIVER = '0b1c2d3e-4f50-4617-8899-aabbccddeeff';
const TRIP = '11111111-2222-4333-8444-555555555555';
const CLIENT = '99999999-8888-4777-8666-555555555555';
const VAN = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function setup(rpcResult: { data?: unknown; error?: { message: string } | null } = {}) {
  const logs: string[] = [];
  const rpc = vi.fn(async () => ({ data: rpcResult.data ?? null, error: rpcResult.error ?? null }));
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
    const [, args] = rpc.mock.calls[0] as unknown as [string, { p_token_hash: string }];
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
