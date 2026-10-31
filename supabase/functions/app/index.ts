// Deno entry for the "app" Edge Function. Deploy: supabase functions deploy app
// Secrets it needs (Supabase sets the first three itself): SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY, and SITE_URL (https://pohnch.pk).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handle } from '../_shared/handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
const server = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

Deno.serve((req) =>
  handle(req, {
    userFromToken: async (jwt) => {
      const { data, error } = await anon.auth.getUser(jwt);
      return error || !data.user ? null : data.user.id;
    },
    rpc: async (fn, args) => {
      const { data, error } = await server.rpc(fn, args);
      return { data, error: error ? { message: error.message } : null };
    },
    siteUrl: Deno.env.get('SITE_URL') ?? 'https://pohnch.pk',
    log: (line) => console.log(line),
  }),
);
