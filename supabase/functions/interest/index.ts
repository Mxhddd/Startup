// Deno entry for the public `interest` Edge Function (pohnch.pk "Join the pilot").
// Deploy: supabase functions deploy interest --no-verify-jwt   (it is called by website visitors, who have no login)
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set by Supabase). The service key never leaves the function.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleInterest } from '../_shared/interest.ts';

const server = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const salt = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').slice(-24);
const hashIp = async (ip: string) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
};
const rpc = async (fn: string, args: Record<string, unknown> = {}) => {
  const { data, error } = await server.rpc(fn, args);
  return { data, error: error ? { message: error.message } : null };
};

Deno.serve(async (req) => {
  const body = req.method === 'POST' ? await req.text() : '';
  const r = await handleInterest(req.method, new URL(req.url), req.headers, body, { rpc, hashIp });
  return new Response(r.body === null ? null : JSON.stringify(r.body), { status: r.status, headers: r.headers });
});
