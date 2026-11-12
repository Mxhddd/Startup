import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AREA_IDS as CORE_AREAS, checkInterest as coreCheck } from '../../../packages/core/src/interest';
import { AREA_IDS, checkInterest, handleInterest, resetInterestCaches, visitorIp, type InterestDeps } from './interest.ts';

const deps = (data: unknown = 'ok') => {
  const rpc = vi.fn(async () => ({ data, error: null })) as unknown as InterestDeps['rpc'] & ReturnType<typeof vi.fn>;
  return { rpc, hashIp: async (ip: string) => `h:${ip}`.padEnd(64, '0') } as InterestDeps & { rpc: ReturnType<typeof vi.fn> };
};
const H = (o: Record<string, string> = {}) => new Headers({ origin: 'https://www.pohnch.pk', 'x-forwarded-for': '1.2.3.4, 10.0.0.1', ...o });
const post = (body: unknown, d = deps()) => handleInterest('POST', new URL('https://x/functions/v1/interest'), H(), JSON.stringify(body), d);

describe('interest function', () => {
  beforeEach(() => resetInterestCaches());
  it('saves a parent sign-up with the IP hashed, never stored', async () => {
    const d = deps();
    const r = await post({ kind: 'join', role: 'parent', area: 'gulshan', school: 'City', kids: 2, driverPhone: 'yes', whatsapp: '0300 1234567', lang: 'ur' }, d);
    expect(r.status).toBe(200);
    const args = d.rpc.mock.calls[0]![1];
    expect(args).toMatchObject({ p_role: 'parent', p_area: 'gulshan', p_whatsapp: '+923001234567', p_lang: 'ur' });
    expect(String(args.p_ip_hash)).toContain('h:1.2.3.4');
    expect(JSON.stringify(args)).not.toContain('"1.2.3.4"');
  });
  it('pretends to accept a bot (hidden field filled) and saves nothing', async () => {
    const d = deps();
    const r = await post({ kind: 'join', role: 'parent', area: 'dha', website: 'http://spam' }, d);
    expect(r.status).toBe(200); expect(d.rpc).not.toHaveBeenCalled();
  });
  it("saves a school's interest (v18) and needs its number", async () => {
    const d = deps();
    expect((await post({ kind: 'join', role: 'school', area: 'gulshan', school: 'City School', whatsapp: '0300 1112233' }, d)).status).toBe(200);
    expect(d.rpc.mock.calls[0]![1]).toMatchObject({ p_role: 'school', p_school: 'City School', p_kids: null, p_driver_phone: null, p_whatsapp: '+923001112233' });
    expect((await post({ kind: 'join', role: 'school', area: 'gulshan', school: 'City School' })).body).toEqual({ error: 'whatsapp' });
  });
  it('names the wrong field, refuses the sixth sign-up, counts honest answers', async () => {
    expect((await post({ kind: 'join', role: 'parent', area: 'mars' })).body).toEqual({ error: 'area' });
    expect((await post({ kind: 'join', role: 'parent', area: 'dha' }, deps('limited'))).status).toBe(429);
    const d = deps(null); expect((await post({ kind: 'doubt', n: 3 }, d)).status).toBe(200); expect(d.rpc).toHaveBeenCalledWith('interest_doubt', { p_n: 3 });
    expect((await post({ kind: 'doubt', n: 9 })).status).toBe(400);
  });
  it('serves the summary with caching and answers CORS only for the site', async () => {
    const r = await handleInterest('GET', new URL('https://x/interest?summary=1'), H(), '', deps({ areas: { dha: 4 }, proof: null }));
    expect(r.body).toEqual({ areas: { dha: 4 }, proof: null });
    expect(r.headers['cache-control']).toContain('max-age=300');
    expect(r.headers['access-control-allow-origin']).toBe('https://www.pohnch.pk');
    const evil = await handleInterest('OPTIONS', new URL('https://x/interest'), H({ origin: 'https://evil.example' }), '', deps());
    expect(evil.headers['access-control-allow-origin']).not.toBe('https://evil.example');
  });
  it('rejects oversized or broken bodies', async () => {
    expect((await handleInterest('POST', new URL('https://x/i'), H(), 'x'.repeat(3000), deps())).status).toBe(413);
    expect((await handleInterest('POST', new URL('https://x/i'), H(), '{bad', deps())).status).toBe(400);
  });
  it('checks exactly like the website does (same areas, same answers)', () => {
    expect([...AREA_IDS]).toEqual([...CORE_AREAS]);
    const cases = [{ role: 'school', area: 'dha', school: 'Bay View' }, { role: 'school', area: 'dha', whatsapp: '03001112233' }, { role: 'school', area: 'dha', school: 'Bay View', whatsapp: '03001112233' }, { role: 'parent', area: 'dha', kids: 9 }, { role: 'driver', area: 'malir', whatsapp: '0311-2223334' }, { role: 'parent', area: 'gulshan', whatsapp: '123' }, { role: 'x', area: 'dha' }, { role: 'parent', area: 'dha', school: '<b>' }];
    for (const c of cases) expect(checkInterest(c)).toEqual(coreCheck(c));
  });
});

describe('v20 security in the interest function', () => {
  beforeEach(() => resetInterestCaches());
  const join = { kind: 'join', role: 'parent', area: 'gulshan', kids: 1 };
  it("trusts Cloudflare's IP header over anything the visitor writes", () => {
    expect(visitorIp(new Headers({ 'cf-connecting-ip': '5.6.7.8', 'x-forwarded-for': '1.1.1.1' }))).toBe('5.6.7.8');
    expect(visitorIp(new Headers({}))).toBe('unknown');
  });
  it('needs a passed bot check once Turnstile is set up', async () => {
    const d = { ...deps(), verifyHuman: vi.fn(async (t: string) => t === 'good') };
    expect((await post(join, d)).status).toBe(403);
    expect((await post({ ...join, turnstile: 'bad' }, d)).status).toBe(403);
    expect((await post({ ...join, turnstile: 'good' }, d)).status).toBe(200);
    expect(d.rpc).toHaveBeenCalledTimes(1);
  });
  it('tells a flood to wait when the hourly cap is reached', async () => {
    expect((await post(join, deps('busy'))).status).toBe(503);
  });
  it('serves the summary from memory for 5 minutes', async () => {
    let t = 0; const d = { ...deps({ areas: {}, meter: {}, proof: null }), now: () => t };
    const get = () => handleInterest('GET', new URL('https://x/interest?summary=1'), H(), '', d);
    await get(); await get(); t += 6 * 60 * 1000; await get();
    expect(d.rpc).toHaveBeenCalledTimes(2);
  });
  it('counts at most 12 honest-answer openings an hour from one place', async () => {
    const d = deps(null);
    for (let i = 0; i < 20; i++) await post({ kind: 'doubt', n: 2 }, d);
    expect(d.rpc).toHaveBeenCalledTimes(12);
  });
});
