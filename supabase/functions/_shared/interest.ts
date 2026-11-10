// The `interest` Edge Function's logic (website "Join the pilot"), kept free of Deno so it can be tested.
//  GET  ?summary=1           -> { areas: {gulshan: 12}, proof: null | {vans, trips, alerts} } (cached 5 min)
//  POST {kind:'join', ...}    -> 200 {ok:true} | 400 {error:field} | 429 {error:'limited'}
//  POST {kind:'doubt', n}     -> 200 {ok:true} (counts one opening of honest answer n)
// The checks mirror packages/core/src/interest.ts (a test keeps the two in step). The hidden `website`
// field is a bot trap: if it is filled in, we answer "ok" and save nothing. Nothing is logged.

export const AREA_IDS = ['dha', 'clifton', 'saddar', 'pechs', 'bahadurabad', 'gulshan', 'jauhar', 'nazimabad', 'northNazimabad',
  'fbArea', 'northKarachi', 'scheme33', 'malir', 'korangi', 'lyari', 'orangi', 'keamari', 'other'] as const;
export const ALLOWED_ORIGINS = ['https://pohnch.pk', 'https://www.pohnch.pk', 'https://pohnch.vercel.app', 'http://localhost:3100'];

export type Interest = { role: 'parent' | 'driver'; area: string; school: string | null; kids: number | null; driverPhone: 'yes' | 'no' | 'unknown' | null; whatsapp: string | null };
type Body = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export function normalisePkMobile(input: string): string | null {
  const m = /^(?:\+92|0092|92|0)?(3\d{9})$/.exec(input.replace(/[\s\-()]/g, ''));
  return m ? `+92${m[1]}` : null;
}
export function checkInterest(b: Body): { ok: true; value: Interest } | { ok: false; field: string } {
  const role = b.role;
  if (role !== 'parent' && role !== 'driver') return { ok: false, field: 'role' };
  const area = b.area;
  if (typeof area !== 'string' || !(AREA_IDS as readonly string[]).includes(area)) return { ok: false, field: 'area' };
  const school = str(b.school).replace(/\s+/g, ' ');
  if (school.length > 80 || /[<>{}]/.test(school)) return { ok: false, field: 'school' };
  let kids: number | null = null, driverPhone: Interest['driverPhone'] = null;
  if (role === 'parent') {
    const n = typeof b.kids === 'number' ? b.kids : Number(str(b.kids) || '1');
    if (!Number.isInteger(n) || n < 1 || n > 6) return { ok: false, field: 'kids' };
    kids = n;
    const d = b.driverPhone ?? 'unknown';
    if (d !== 'yes' && d !== 'no' && d !== 'unknown') return { ok: false, field: 'driverPhone' };
    driverPhone = d;
  }
  const raw = str(b.whatsapp), whatsapp = raw ? normalisePkMobile(raw) : null;
  if (raw && !whatsapp) return { ok: false, field: 'whatsapp' };
  return { ok: true, value: { role, area, school: school || null, kids, driverPhone, whatsapp } };
}

export type InterestDeps = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  /** SHA-256 hex of the visitor's IP with a secret salt. */
  hashIp: (ip: string) => Promise<string>;
};
export type Reply = { status: number; body: unknown; headers: Record<string, string> };

export async function handleInterest(method: string, url: URL, headers: Headers, bodyText: string, deps: InterestDeps): Promise<Reply> {
  const origin = headers.get('origin') ?? '';
  const cors: Record<string, string> = { 'access-control-allow-origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1]!, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin', 'content-type': 'application/json' };
  const reply = (status: number, body: unknown, extra: Record<string, string> = {}): Reply => ({ status, body, headers: { ...cors, ...extra } });
  if (method === 'OPTIONS') return reply(204, null);
  if (method === 'GET' && url.searchParams.has('summary')) {
    const { data, error } = await deps.rpc('interest_summary');
    if (error) return reply(500, { error: 'server' });
    return reply(200, data ?? { areas: {}, proof: null }, { 'cache-control': 'public, max-age=300' });
  }
  if (method !== 'POST') return reply(405, { error: 'method' });
  if (bodyText.length > 2000) return reply(413, { error: 'size' });
  let b: Body;
  try { b = JSON.parse(bodyText) as Body; } catch { return reply(400, { error: 'json' }); }
  if (!b || typeof b !== 'object') return reply(400, { error: 'json' });
  if (b.kind === 'doubt') {
    const n = b.n;
    if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 6) return reply(400, { error: 'n' });
    await deps.rpc('interest_doubt', { p_n: n });
    return reply(200, { ok: true });
  }
  if (b.kind !== 'join') return reply(400, { error: 'kind' });
  if (str(b.website)) return reply(200, { ok: true }); // a bot filled the hidden field: pretend, save nothing
  const c = checkInterest(b);
  if (!c.ok) return reply(400, { error: c.field });
  const ip = (headers.get('x-forwarded-for') ?? '').split(',')[0]!.trim() || headers.get('cf-connecting-ip') || 'unknown';
  const v = c.value;
  const { data, error } = await deps.rpc('interest_add', {
    p_role: v.role, p_area: v.area, p_school: v.school, p_kids: v.kids, p_driver_phone: v.driverPhone, p_whatsapp: v.whatsapp,
    p_lang: b.lang === 'ur' ? 'ur' : 'en', p_ip_hash: await deps.hashIp(ip),
  });
  if (error) return reply(500, { error: 'server' });
  if (data === 'limited') return reply(429, { error: 'limited' });
  return reply(200, { ok: true });
}
