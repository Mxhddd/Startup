# Accounts, keys and settings you need (v5)

A first list for the native apps. Step B0 checks every price and limit on the vendor's own page and fills in the exact sign-up steps. The web-app version is in `archive/ACCOUNTS_v1_web.md`.

| # | What | Cost | Needed by |
| --- | --- | --- | --- |
| 1 | Node.js LTS, pnpm and git on your laptop | free | B1 |
| 2 | GitHub account and this repo (`Mxhddd/Startup`) | free | already done |
| 3 | Expo account (EAS builds, push) | free tier | B1 |
| 4 | Supabase project (region closest to Pakistan) | free to start | B3 |
| 5 | Google Maps Platform key, restricted to the two apps and the website | free monthly allowance; check the current one | B1 |
| 6 | SMS provider for login codes | pay per code | B3 |
| 7 | Apple Developer Program | USD 99 a year | B6 (Live Activity on a real iPhone), B9 |
| 8 | Google Play Console | USD 25 once | B9 |
| 9 | Vercel (Hobby for the pilot, Pro before charging) | free / about USD 20 a month | B7 |
| 10 | Test phones: a cheap Android and an iPhone (used is fine) | about Rs 150,000 together | B1 |
| 11 | Domain pohnch.pk | paid yearly | B7 |

## Environment variables (names only; values never go in git)

```text
# Apps and website (public, allowed in bundles)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only (Supabase Edge Function secrets, Vercel server env)
SUPABASE_SERVICE_ROLE_KEY=
EXPO_ACCESS_TOKEN=
SMS_PROVIDER_KEY=
ADMIN_EMAILS=
```

The anon key is meant to be public: it only works through row-level security, and no table allows anonymous access. The service-role key bypasses row-level security, so it lives only in Edge Function secrets and the website's server environment.
