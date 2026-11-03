// Deno entry for the "app" Edge Function. Deploy: supabase functions deploy app
// Secrets it needs (Supabase sets the first three itself): SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY, SITE_URL (https://pohnch.pk), and EXPO_ACCESS_TOKEN (for pushes).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handle } from '../_shared/handler.ts';
import { notifyTrip } from '../_shared/notify.ts';
import { updateLiveActivities, type ApnsConfig } from '../_shared/liveActivity.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
const server = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const rpc = async (fn: string, args: Record<string, unknown>) => {
  const { data, error } = await server.rpc(fn, args);
  return { data, error: error ? { message: error.message } : null };
};
const log = (line: string) => console.log(line);
// iPhone Live Activity updates need Apple's push key (APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY);
// without it they are simply skipped. APNS_HOST is api.push.apple.com (or the sandbox for test builds).
const apns: ApnsConfig | null =
  Deno.env.get('APNS_PRIVATE_KEY') && Deno.env.get('APNS_KEY_ID') && Deno.env.get('APNS_TEAM_ID')
    ? {
        keyId: Deno.env.get('APNS_KEY_ID')!,
        teamId: Deno.env.get('APNS_TEAM_ID')!,
        p8: Deno.env.get('APNS_PRIVATE_KEY')!,
        bundleId: Deno.env.get('APNS_BUNDLE_ID') ?? 'pk.pohnch.parent',
        host: Deno.env.get('APNS_HOST') ?? 'api.push.apple.com',
      }
    : null;

Deno.serve((req) =>
  handle(req, {
    userFromToken: async (jwt) => {
      const { data, error } = await anon.auth.getUser(jwt);
      return error || !data.user ? null : data.user.id;
    },
    rpc,
    siteUrl: Deno.env.get('SITE_URL') ?? 'https://pohnch.pk',
    log,
    notify: (job) => notifyTrip(job, { rpc, fetch, expoAccessToken: Deno.env.get('EXPO_ACCESS_TOKEN') ?? undefined, log }),
    live: (job) => updateLiveActivities(job, { rpc, fetch, apns, log, expoAccessToken: Deno.env.get('EXPO_ACCESS_TOKEN') ?? undefined }),
  }),
);
