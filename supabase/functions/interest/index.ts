// Deno entry for the public `interest` Edge Function (pohnch.pk "Join the pilot").
// Deploy: supabase functions deploy interest --no-verify-jwt   (it is called by website visitors, who have no login)
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set by Supabase). The service key never leaves the function.
// Optional secrets (v20 security): IP_HASH_SALT (the salt for the place-limit hash; falls back to part of the
// service key) and TURNSTILE_SECRET (once set, every sign-up must pass Cloudflare's bot check).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { handleInterest } from '../_shared/interest.ts';

const server = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const salt = Deno.env.get('IP_HASH_SALT') || (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').slice(-24);
const hashIp = async (ip: string) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
};
const rpc = async (fn: string, args: Record<string, unknown> = {}) => {
  const { data, error } = await server.rpc(fn, args);
  return { data, error: error ? { message: error.message } : null };
};
const turnstileSecret = Deno.env.get('TURNSTILE_SECRET');
const verifyHuman = turnstileSecret
  ? async (token: string, ip: string) => {
      const form = new FormData();
      form.append('secret', turnstileSecret); form.append('response', token);
      if (ip && ip !== 'unknown') form.append('remoteip', ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
      const j = (await r.json()) as { success?: boolean };
      return j.success === true;
    }
  : undefined;
const MAX_BODY = 2000;

Deno.serve(async (req) => {
  // refuse big bodies before reading them
  if (Number(req.headers.get('content-length') ?? '0') > MAX_BODY) return new Response(JSON.stringify({ error: 'size' }), { status: 413 });
  let body = '';
  if (req.method === 'POST') {
    const reader = req.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (reader) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BODY) { await reader.cancel(); return new Response(JSON.stringify({ error: 'size' }), { status: 413 }); } chunks.push(value); }
    body = new TextDecoder().decode(chunks.length === 1 ? chunks[0] : new Uint8Array(chunks.flatMap((c) => [...c])));
  }
  const r = await handleInterest(req.method, new URL(req.url), req.headers, body, { rpc, hashIp, verifyHuman });
  return new Response(r.body === null ? null : JSON.stringify(r.body), { status: r.status, headers: r.headers });
});
