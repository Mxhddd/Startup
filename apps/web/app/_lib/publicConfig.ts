// The website's three public settings, with pohnch.pk's own values built in (v20 security deploy).
// All three are public by design: every visitor's browser receives them anyway.
//  - the Supabase project address;
//  - its publishable key (sb_publishable_…): it can only do what row-level security lets a logged-out
//    visitor do, which is nothing; never the secret key (scripts/check-leaks.mjs and publicKey.ts guard that);
//  - the Cloudflare Turnstile site key (the bot check; its secret lives only in the `interest` function).
// Vercel settings with the same names override these. An empty value switches a setting off (tests do this).
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vsyunieszswpreogzolx.supabase.co').replace(/\/$/, '');
export const SUPABASE_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_kyFWt3VTwLciik5Vg8FPhA_Dj3mLZZV';
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAAF-U3tmMD1cOebRG';
