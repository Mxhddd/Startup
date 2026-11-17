// Deno entry for the `play-stats` Edge Function (v23): reads Google Play's daily install numbers for both
// apps and stores them in play_installs, so the admin page shows real installs without typing them in.
// Called by a Pohnch team member (the admin page's "Sync from Google Play" button; their login is checked:
// the call works only if admin_flags() answers for them) or by a daily job that sends CRON_SECRET.
// Deploy: supabase functions deploy play-stats --no-verify-jwt
// Secrets: PLAY_SA_JSON (a read-only Google service account's key, added in the Supabase dashboard, never
// in the repo or a chat), PLAY_REPORTS_BUCKET (pubsite_prod_rev_...), optional CRON_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { decodeCsv, latestDays, monthsToRead, objectName, PACKAGES, parseInstalls, type App, type InstallDay } from '../_shared/playStats.ts';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const server = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': 'https://pohnch.pk', 'access-control-allow-headers': 'authorization, content-type, apikey' } });

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = ''; for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** A Google access token for Cloud Storage (read only), from the service account's key. */
async function googleToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/devstorage.read_only', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claims}`));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${b64url(sig)}` }) });
  if (!r.ok) throw new Error('google_token');
  return ((await r.json()) as { access_token: string }).access_token;
}

async function isTeam(req: Request): Promise<boolean> {
  const cron = Deno.env.get('CRON_SECRET');
  if (cron && req.headers.get('x-cron-secret') === cron) return true;
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const asUser = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { error } = await asUser.rpc('admin_flags');
  return !error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await isTeam(req))) return json({ error: 'not_admin' }, 403);
  const raw = Deno.env.get('PLAY_SA_JSON');
  const bucket = Deno.env.get('PLAY_REPORTS_BUCKET');
  if (!raw || !bucket) return json({ error: 'not_set_up' }, 503);
  let token: string;
  try {
    token = await googleToken(JSON.parse(raw));
  } catch {
    console.log('play-stats: google token failed');
    return json({ error: 'google_token' }, 502);
  }
  const result: Partial<Record<App, InstallDay | null>> = {};
  for (const app of Object.keys(PACKAGES) as App[]) {
    const rows: InstallDay[] = [];
    for (const ym of monthsToRead(new Date())) {
      const u = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName(app, ym))}?alt=media`;
      const r = await fetch(u, { headers: { authorization: `Bearer ${token}` } });
      if (r.status === 404) continue; // no file yet (a new month, or the app has no installs yet)
      if (!r.ok) { console.log(`play-stats: ${app} ${ym} ${r.status}`); continue; }
      rows.push(...parseInstalls(decodeCsv(new Uint8Array(await r.arrayBuffer()))));
    }
    const days = latestDays(rows);
    for (const d of days) await server.rpc('play_record_installs', { p_app: app, p_day: d.day, p_total: d.total, p_daily: d.daily });
    result[app] = days.at(-1) ?? null;
  }
  console.log(`play-stats: parent=${result.parent?.total ?? '-'} driver=${result.driver?.total ?? '-'}`);
  return json({ ok: true, latest: result });
});
