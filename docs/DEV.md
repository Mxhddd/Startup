# Running Pohnch on your laptop and phone

## Once

1. Install Node.js 22 and run `corepack enable` (this gives you pnpm 10).
2. In the repo: `pnpm install`.
3. Copy `.env.example` to `.env` and fill in what you have so far (B1 needs nothing; the map on Android needs `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`).

## What's where

| Folder | What it is |
| --- | --- |
| `apps/parent` | the Pohnch app for parents (Expo). Screens live in `src/app/`: each file is one screen. |
| `apps/driver` | the Pohnch Driver app (Expo), same layout. |
| `apps/web` | pohnch.pk (Next.js). Pages live in `app/`. |
| `packages/messages` | every word on screen, in `ur.json` and `en.json`. Add a key to both files. |
| `packages/ui` | the theme file (colours, sizes, fonts, map style) and shared components. |
| `packages/core` | shared logic with tests: Karachi dates and times so far. |
| `supabase/` | the backend, from B3. |
| `tests/maestro` | phone tests that tap through the apps. |

How text gets to the screen: a screen calls `t('driver.today.title')` from `useLang()`; `useLang` reads the current language (Urdu by default) and looks the key up in `packages/messages`. The language switch flips the language, and every screen re-draws right to left or left to right.

## Every day

```bash
pnpm typecheck     # TypeScript checks for all apps and packages
pnpm test          # unit tests (Vitest)
pnpm build:web     # builds the website
pnpm test:web      # website tests in a phone-sized browser (Playwright)
pnpm check         # the first three together
```

## On your phone

The apps use libraries with native code (maps), so they run as a **development build**, not in Expo Go:

1. `pnpm dlx eas-cli login`, then in `apps/parent`: `pnpm dlx eas-cli init` (once; put the project ID in `.env` as `EAS_PROJECT_ID_PARENT`).
2. `pnpm dlx eas-cli build --profile development --platform android` and install the APK the link gives you.
3. `pnpm --filter @pohnch/parent start`, then open the app on the phone and scan the QR code.
4. Same for `apps/driver` with `EAS_PROJECT_ID_DRIVER`.

The phone tests need Maestro (maestro.mobile.dev) and a phone or emulator with the app installed: `maestro test tests/maestro`.

## The component gallery

Every shared component (B2) is on one hidden screen in each app, in every state, in Urdu and English.

- On the phone: long-press the screen title ("آج" in the driver app, "آج کا سفر" in the parent app), or open the link `pohnch-driver://gallery` / `pohnch://gallery`.
- In a browser, no phone needed: `pnpm --filter @pohnch/driver web`, then open the address it prints and add `/gallery`. The map is a plain stand-in on the web; everything else looks as on the phone.

The components live in `packages/ui/src/native/`, one file each, named as in CLAUDE.md. The timing rules behind them (hold 0.8 s, undo 5 s, signal stale after 30 s) are plain functions in `packages/core` with tests, so the numbers live in one place.

## The backend (B3)

Everything about the database, its security rules and the Edge Functions is explained in `supabase/README.md`. `pnpm test:db` runs the database tests (it needs Postgres 16 with PostGIS and pgTAP; GitHub's checks install them).

### Putting it online (when your Supabase account exists)

1. `pnpm dlx supabase login`, then `pnpm dlx supabase link --project-ref <your project ref>`.
2. `pnpm dlx supabase db push`: creates every table and rule from `supabase/migrations`.
3. Dashboard > Database > Extensions: switch on **pg_cron** (for the 30-day position cleanup), then run `supabase db push` again.
4. `pnpm dlx supabase functions deploy app` and `pnpm dlx supabase functions deploy send-sms --no-verify-jwt`.
5. `pnpm dlx supabase secrets set SITE_URL=https://pohnch.pk SMS_GATEWAY_URL=... SMS_GATEWAY_KEY=...`
6. Dashboard > Authentication > Sign In / Providers > Phone: on. Authentication > Hooks > Send SMS: HTTPS, the `send-sms` function's URL; copy the secret it shows into `supabase secrets set SEND_SMS_HOOK_SECRET=...`.
7. For trying it before the gateway exists: Authentication > Phone > "Test phone numbers": add your number with a fixed code.
8. Put the project URL and anon key in `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. From then on, both apps start at the login screen.
9. Make yourself the team: in the SQL editor, `insert into admins values ('<your user id>');` (your id is under Authentication > Users after you first log in).

Until step 8, the apps open without login, so screens can still be built and tried.
