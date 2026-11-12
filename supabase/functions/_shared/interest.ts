// The `interest` Edge Function's logic (website "Join the pilot"), kept free of Deno so it can be tested.
//  GET  ?summary=1           -> { areas: {gulshan: 12}, meter: {gulshan: {f,d,s,m}}, proof: null | {vans, trips, alerts} } (cached 5 min)
//  POST {kind:'join', ...}    -> 200 {ok:true} | 400 {error:field} | 403 {error:'human'} | 429 {error:'limited'} | 503 {error:'busy'}
//  POST {kind:'doubt', n}     -> 200 {ok:true} (counts one opening of honest answer n)
// The checks mirror packages/core/src/interest.ts (a test keeps the two in step). The hidden `website`
// field is a bot trap: if it is filled in, we answer "ok" and save nothing. Nothing is logged.
// v20 security: once TURNSTILE_SECRET is set, a join must carry a passed Cloudflare Turnstile check; the
// visitor's IP is taken from Cloudflare's own header (a visitor can't fake it), not from the first
// X-Forwarded-For entry; the public summary is cached here for 5 minutes; the honest-answer counter is
// limited per place; a flood beyond the hourly cap is told to try later.

export const AREA_IDS = ['dha', 'clifton', 'saddar', 'pechs', 'bahadurabad', 'gulshan', 'jauhar', 'nazimabad', 'northNazimabad',
  'fbArea', 'northKarachi', 'scheme33', 'malir', 'korangi', 'lyari', 'orangi', 'keamari', 'other'] as const;
export const ALLOWED_ORIGINS = ['https://pohnch.pk', 'https://www.pohnch.pk', 'https://pohnch.vercel.app', 'http://localhost:3100'];

export type Interest = { role: 'parent' | 'driver' | 'school'; area: string; school: string | null; kids: number | null; driverPhone: 'yes' | 'no' | 'unknown' | null; whatsapp: string | null };
type Body = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export function normalisePkMobile(input: string): string | null {
  const m = /^(?:\+92|0092|92|0)?(3\d{9})$/.exec(input.replace(/[\s\-()]/g, ''));
  return m ? `+92${m[1]}` : null;
}
export function checkInterest(b: Body): { ok: true; value: Interest } | { ok: false; field: string } {
  const role = b.role;
  if (role !== 'parent' && role !== 'driver' && role !== 'school') return { ok: false, field: 'role' };
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
  if (role === 'school' && school.length < 2) return { ok: false, field: 'school' };
  if (role === 'school' && !whatsapp) return { ok: false, field: 'whatsapp' };
  return { ok: true, value: { role, area, school: school || null, kids, driverPhone, whatsapp } };
}

export type InterestDeps = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  /** SHA-256 hex of the visitor's IP with a secret salt. */
  hashIp: (ip: string) => Promise<string>;
  /** Checks a Cloudflare Turnstile token with Cloudflare. Absent until TURNSTILE_SECRET is set. */
  verifyHuman?: (token: string, ip: string) => Promise<boolean>;
  /** The clock (tests pass their own). */
  now?: () => number;
};

/** The visitor's IP. Supabase's functions sit behind Cloudflare, which sets cf-connecting-ip itself (a visitor
 *  can't fake it through Cloudflare), so that comes first; x-real-ip and then the first X-Forwarded-For entry
 *  are only fallbacks for other set-ups (and local tests). */
export function visitorIp(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  return (headers.get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'unknown';
}

const SUMMARY_MS = 5 * 60 * 1000;
let summaryCache: { at: number; data: unknown } | null = null;
const doubtHits = new Map<string, { at: number; n: number }>();
/** Forget the in-memory caches (tests). */
export function resetInterestCaches() { summaryCache = null; doubtHits.clear(); }
export type Reply = { status: number; body: unknown; headers: Record<string, string> };

export async function handleInterest(method: string, url: URL, headers: Headers, bodyText: string, deps: InterestDeps): Promise<Reply> {
  const origin = headers.get('origin') ?? '';
  const cors: Record<string, string> = { 'access-control-allow-origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1]!, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin', 'content-type': 'application/json' };
  const reply = (status: number, body: unknown, extra: Record<string, string> = {}): Reply => ({ status, body, headers: { ...cors, ...extra } });
  if (method === 'OPTIONS') return reply(204, null);
  const now = (deps.now ?? Date.now)();
  if (method === 'GET' && url.searchParams.has('summary')) {
    if (!summaryCache || now - summaryCache.at > SUMMARY_MS) {
      const { data, error } = await deps.rpc('interest_summary');
      if (error) return reply(500, { error: 'server' });
      summaryCache = { at: now, data: data ?? { areas: {}, meter: {}, proof: null } };
    }
    return reply(200, summaryCache.data, { 'cache-control': 'public, max-age=300' });
  }
  if (method !== 'POST') return reply(405, { error: 'method' });
  if (bodyText.length > 2000) return reply(413, { error: 'size' });
  let b: Body;
  try { b = JSON.parse(bodyText) as Body; } catch { return reply(400, { error: 'json' }); }
  if (!b || typeof b !== 'object') return reply(400, { error: 'json' });
  const ip = visitorIp(headers);
  if (b.kind === 'doubt') {
    const n = b.n;
    if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > 6) return reply(400, { error: 'n' });
    // at most 12 counted openings an hour from one place (more are answered "ok" but not counted)
    const key = await deps.hashIp(ip), hit = doubtHits.get(key);
    const fresh = !hit || now - hit.at > 3600_000 ? { at: now, n: 0 } : hit;
    fresh.n += 1; doubtHits.set(key, fresh);
    if (doubtHits.size > 5000) doubtHits.clear();
    if (fresh.n <= 12) await deps.rpc('interest_doubt', { p_n: n });
    return reply(200, { ok: true });
  }
  if (b.kind !== 'join') return reply(400, { error: 'kind' });
  if (str(b.website)) return reply(200, { ok: true }); // a bot filled the hidden field: pretend, save nothing
  const c = checkInterest(b);
  if (!c.ok) return reply(400, { error: c.field });
  if (deps.verifyHuman) {
    const token = str(b.turnstile);
    if (!token || token.length > 2048 || !(await deps.verifyHuman(token, ip).catch(() => false))) return reply(403, { error: 'human' });
  }
  const v = c.value;
  const { data, error } = await deps.rpc('interest_add', {
    p_role: v.role, p_area: v.area, p_school: v.school, p_kids: v.kids, p_driver_phone: v.driverPhone, p_whatsapp: v.whatsapp,
    p_lang: b.lang === 'ur' ? 'ur' : 'en', p_ip_hash: await deps.hashIp(ip),
  });
  if (error) return reply(500, { error: 'server' });
  if (data === 'limited') return reply(429, { error: 'limited' });
  if (data === 'busy') return reply(503, { error: 'busy' });
  return reply(200, { ok: true });
}
