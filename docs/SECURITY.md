# Pohnch security (v20)

What protects Pohnch, in plain words, and what to do if something goes wrong.

## Who can see what

- **Nobody logged out** can read anything from the database. Every table has row-level security; anonymous access is revoked everywhere.
- **A parent** sees only their own children and their own van's trip. **A driver** sees only their van.
- **The Pohnch team** (rows in `public.admins`) sees the admin data, but only from a session that passed **two steps**: the phone code and a code from an authenticator app (`private.is_admin()` requires `aal = 'aal2'`, migration `20261113000200_admin_two_step.sql`). Team actions through the `app` function need the same (`admin.*` actions return `needs_second_step`).
- **The website's public numbers** (`interest_summary()`) show only areas with **3 or more families**, as bands ("3–9", "10+"), never exact counts.

## The website (pohnch.pk)

- **Headers** (`apps/web/next.config.ts`):
  - `Content-Security-Policy`: code only from pohnch.pk, Cloudflare Turnstile and Vercel's page counter; data only to our Supabase project. Nothing may frame the site.
  - Also HSTS (with preload), `X-Frame-Options: DENY`, `nosniff`, COOP/CORP and a strict `Permissions-Policy`.
  - /admin gets a stricter CSP: no page counter, and it is never cached or indexed.
- **Invite links** (`/i/<token>`) are never cached, never sent on as a referrer, and the page counter records them as `/i/[token]` (`app/_lib/SafeAnalytics.tsx`). It never counts /admin or /invite.
- **The admin page refuses to start** if the key it was given is not a public key (`app/admin/publicKey.ts`). This stops a service key put in the wrong setting from reaching browsers.
- **Bot check:** the join and school forms and the admin login carry a Cloudflare Turnstile token. The `interest` function checks it with Cloudflare once `TURNSTILE_SECRET` is set.

## The sign-up function (`interest`)

- **Inputs:** all checked on the server (area list, lengths, Pakistani mobile format). The body is capped at 2 KB before it is read.
- **Limits:**
  - 5 sign-ups a day from one place (IP from Cloudflare's own header, salted and hashed, forgotten after a day);
  - one live sign-up per WhatsApp number (a repeat updates it);
  - at most 60 sign-ups an hour in total.
- **Other:** the honest-answer counter counts at most 12 a hour from one place. The public summary is cached for 5 minutes.

## Login codes (SMS)

- **The `send-sms` hook:** it checks Supabase's signature (constant-time) and sends codes **only to Pakistani mobiles** (+92 3xx), so SMS fraud to premium numbers abroad costs nothing.
- **Accounts:** the admin page never creates accounts (`shouldCreateUser: false`).
- **Test numbers:** they have fixed codes. They are never admins, their code is never written in this repo (only in the store consoles for reviewers), and they are removed before the public launch.
- **CAPTCHA:** Supabase Auth CAPTCHA (Turnstile) is switched on once the apps that send a Turnstile token are out. Until then the limits above apply.

## Data kept only as long as promised

The `pg_cron` jobs, checked on the live project:
- `purge-old-positions`: positions after 30 days.
- `end-stale-trips`: trips left running.
- `forget-old-interest-numbers` (hourly): WhatsApp numbers after 90 days and IP hashes after 1 day.

## Secrets

- **Where they live:** the service-role key, Turnstile secret, IP-hash salt, SMS gateway key and Expo token live only as Supabase function secrets.
- **Never** in the apps, the website bundle, the repo or logs. `pnpm check:leaks` checks the source, git and the built bundles, and fails on any `NEXT_PUBLIC_*SECRET/SERVICE*` name.
- The website's public settings are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. All three are safe to be public.

## If something leaks

| What | Do this now |
|---|---|
| Supabase service-role key | Supabase > Settings > API: roll the key; update the function secrets; redeploy the functions. |
| A Vercel or Supabase access token | Revoke it in that dashboard (Account > Tokens) and make a new one. |
| Turnstile secret | Cloudflare > Turnstile > the widget > Rotate secret; set the new `TURNSTILE_SECRET`. |
| A test number's code | Change it in Supabase > Authentication > Phone > test numbers, and in the store consoles. |
| An admin's phone or authenticator | Supabase > Authentication > Users > that user > remove the MFA factor and sign them out everywhere; they enrol again on /admin. |
| Suspicious sign-ups | /admin shows them; delete them in Supabase > Table editor > `pilot_interest`. The hourly cap stops floods. |

## Checks that keep this true

- `supabase/tests/database/190-security.test.sql`: the two-step admin rule, the meter threshold, the sign-up limits, the clean-ups and the function permissions.
- `supabase/functions/_shared/*.test.ts`: Turnstile, the IP header, caching, the SMS number rule, the signature comparison and the admin second step.
- `apps/web/e2e/security.spec.ts`: the headers on every page, no CSP errors, robots and redirects. `e2e/admin.spec.ts` covers the admin second step.
