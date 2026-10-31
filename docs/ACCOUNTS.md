# Accounts, keys and settings you need (v5)

Step B0. Prices and limits checked on 31 October 2026, mostly from vendor pages and recent summaries of them. Before you pay for anything, check the vendor's own pricing page, because these change often (Expo cut its free builds in 2026). The web-app version is in `archive/ACCOUNTS_v1_web.md`.

## The list

| # | Account | What it is for | Cost (checked 31 Oct 2026) | First needed |
| --- | --- | --- | --- | --- |
| 1 | Node.js 22 LTS, pnpm 10, git | runs and builds everything on your laptop | free | B1 |
| 2 | GitHub (`Mxhddd/Startup`) | the code, and CI checks on every push | free | done |
| 3 | Expo (expo.dev) | builds the two apps in the cloud (EAS Build), push notifications | Free plan: about 15 Android + 15 iOS builds a month (low priority), push free. Starter USD 19/month if you need faster builds | B1 |
| 4 | Supabase | database, login with a phone code, live updates, Edge Functions | Free: 2 projects, 500 MB database each, 50,000 monthly users; pauses after a week with no use. Pro USD 25/month (no pausing) before the pilot starts | B3 |
| 5 | Google Maps Platform | the map in both apps (Android needs a key; iPhone can use Apple Maps) | Maps SDK for Android and iOS without a map ID: no charge at any volume. Billing must still be switched on in Google Cloud. Street View and styled maps with a map ID are metered, and we don't use them | B1 (key), B4 (real use) |
| 6 | SMS for login codes | sends the 6-digit code | Twilio to Pakistan is about USD 0.47 a message (plus USD 0.05 per check with Verify): too dear. Plan: a Pakistani SMS gateway through Supabase's "Send SMS" hook, or WhatsApp codes. Choose in B3 | B3 |
| 7 | Apple Developer Program | TestFlight, Live Activity on a real iPhone, App Store | USD 99 a year | B6, B9 |
| 8 | Google Play Console | internal testing, Play Store | USD 25 once | B9 |
| 9 | Vercel | hosts pohnch.pk and the admin page | Hobby free for the pilot; Pro about USD 20/month before charging money | B7 |
| 10 | Domain pohnch.pk | the website and invite links (`pohnch.pk/i/...`) | yearly fee from a .pk registrar (PKNIC) | B7 |
| 11 | Test phones | one cheap Android (most drivers), one iPhone (used is fine) | about Rs 150,000 together | B1 |

## How to sign up, in order

1. **Laptop tools (B1).** Install Node.js 22 LTS from nodejs.org. Then in a terminal: `corepack enable` and `corepack prepare pnpm@10 --activate`. Check with `node -v` and `pnpm -v`.
2. **Expo (B1).** Sign up at expo.dev with your email. Install the Expo Go app on both phones, and later the development builds. On the laptop: `pnpm dlx eas-cli login`. Create two projects, "pohnch" and "pohnch-driver", and put their project IDs in `apps/parent/app.json` and `apps/driver/app.json` (`extra.eas.projectId`).
3. **Google Maps (B1).** At console.cloud.google.com: make a project called "Pohnch", switch on billing (a card is needed even though our use is free), enable "Maps SDK for Android". Make an API key restricted to Android apps with the package names `pk.pohnch.parent` and `pk.pohnch.driver` and their SHA-1 fingerprints (EAS shows them: `eas credentials`). Put it in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`. Set a daily quota alert.
4. **Supabase (B3).** Sign up at supabase.com with GitHub. New project "pohnch", region closest to Pakistan (Mumbai, `ap-south-1`), a long database password kept in a password manager. Copy the project URL and the anon key into `.env`. The service-role key goes only into Edge Function secrets (`supabase secrets set`), never into `.env` of an app.
5. **SMS (B3).** Compare two or three Pakistani SMS gateways that offer an HTTP API, for price per message and delivery on Jazz, Zong, Telenor and Ufone. The B3 step wires the chosen one through Supabase's Send SMS hook. Its key is a server-only secret.
6. **Apple Developer (before B6).** At developer.apple.com/programs, enroll as an individual with your Apple ID (USD 99). Approval can take a few days, so start early. Bundle IDs: `pk.pohnch.parent`, `pk.pohnch.driver`.
7. **Vercel and the domain (B7).** Sign up at vercel.com with GitHub and import the repo with root `apps/web`. Buy pohnch.pk and point it at Vercel.
8. **Google Play (B9).** At play.google.com/console, pay USD 25, verify your identity (this takes days), then create the two apps.

## Environment variables

Names only, in `.env.example` at the repo root. Real values go in `.env` (git ignores it), in EAS secrets, in Vercel settings, or in Supabase secrets.

**Allowed in the apps and the website bundle (public):**

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`: the anon key is safe to ship because it only works through row-level security, and no table allows anonymous access.
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`: restricted to our two Android apps.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

**Server only (Edge Function secrets, Vercel server env, CI secrets; never in an app):**

- `SUPABASE_SERVICE_ROLE_KEY`: bypasses row-level security.
- `SMS_GATEWAY_URL`, `SMS_GATEWAY_KEY`, `SEND_SMS_HOOK_SECRET`: login codes.
- `EXPO_ACCESS_TOKEN`: sends push notifications from Edge Functions.
- `ADMIN_PHONES`: phone numbers allowed into the admin page.
- `EAS_TOKEN`: lets CI start builds (later).

## Sources

- [Supabase pricing summaries, 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) and [supabase.com/pricing](https://supabase.com/pricing)
- [Expo plans](https://docs.expo.dev/billing/plans/), [expo.dev/pricing](https://expo.dev/pricing), [Expo free tier tracker](https://agentdeals.dev/vendor/expo)
- [Maps SDK for Android: usage and billing](https://developers.google.com/maps/documentation/android-sdk/usage-and-billing?authuser=0), [Maps SDK for iOS: usage and billing](https://developers.google.com/maps/documentation/ios-sdk/usage-and-billing)
- [Twilio Verify pricing](https://twilio.com/verify/pricing), [Twilio SMS pricing, Pakistan](https://www.twilio.com/en-us/sms/pricing/pk)
