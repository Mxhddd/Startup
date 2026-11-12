# Running Pohnch on your laptop and phone

## Once

1. Install Node.js 22 and run `corepack enable` (this gives you pnpm 10).
2. In the repo: `pnpm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL and anon key (Supabase > Project Settings > API). The map needs no key (MapLibre + OpenFreeMap).

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
   The website's "Join the pilot" form uses a third, public function: `pnpm dlx supabase functions deploy interest --no-verify-jwt --use-api` (it holds the service key; sign-ups land in `pilot_interest`, readable only by the Pohnch team on /admin).
5. `pnpm dlx supabase secrets set SITE_URL=https://pohnch.pk SMS_GATEWAY_URL=... SMS_GATEWAY_KEY=...`
6. Dashboard > Authentication > Sign In / Providers > Phone: on. Authentication > Hooks > Send SMS: HTTPS, the `send-sms` function's URL; copy the secret it shows into `supabase secrets set SEND_SMS_HOOK_SECRET=...`.
7. For trying it before the gateway exists: Authentication > Phone > "Test phone numbers": add your number with a fixed code.
8. Put the project URL and anon key in `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. From then on, both apps start at the login screen.
9. Make yourself the team: in the SQL editor, `insert into admins values ('<your user id>');` (your id is under Authentication > Users after you first log in).

Until step 8, the apps open without login, so screens can still be built and tried.

## The driver app (B4)

| Screen | File | What it does |
| --- | --- | --- |
| Today | `apps/driver/src/app/index.tsx` | Set up the van, see today's list, hold to start the next run. Goes to the trip screen while a trip runs. |
| Van | `setup.tsx` | Name, school, plate. |
| Stops | `stops.tsx` | Tap the map to add stops in order; rename, move up/down, remove. |
| Families | `families.tsx` | Share the van's invite link; approve each request with the child's stop (after the team verifies the driver). |
| Trip | `trip.tsx` + `components/RunScreen.tsx` | One big button for the next stop, siblings in one tap, 5-second undo, help, hold for "reached school" / "end trip". |
| Practice | `practice.tsx` | The same trip screen with pretend children; sends nothing. Works without a server. |

How a tap travels: `RunScreen` -> `DriverStore.tapStop` shows it at once and saves it in the offline queue (`@pohnch/core` `createQueue`, kept in AsyncStorage) -> the queue sends it to the `app` Edge Function in order, retrying every 5 s without signal.

Location (`apps/driver/src/location/tripLocation.ts`): starts with a trip, stops when it ends (and whenever the app finds no running trip). On Android it runs as a foreground service with a notification saying the location is shared. Positions go every 5 s while moving and every 30 s when stopped; one that can't be sent is dropped.

## The parent app (B5)

| Screen | File | What it does |
| --- | --- | --- |
| Home | `apps/parent/src/app/index.tsx` + `components/TripSheet.tsx` | The map with the van (gliding, heading, grey when the signal is stale), your stop and home; the sheet shows what fits the moment: add a child, join a van, waiting for approval, no trip now, or live minutes and the timeline. Chutti for today. |
| Add child | `child.tsx` | First name, school, and the home pin placed by tapping the map (never the phone's location). |
| Join | `join.tsx`, `i/[token].tsx` | Paste the driver's link or open it from WhatsApp; pick the child; the driver then approves. A link opened while logged out waits in memory until login. |
| Family | `family.tsx` | Add up to 3 more people by phone number; add a child; join a van. |

How the van moves on a parent's map: the driver app sends a position -> Supabase Realtime tells the parent app something changed -> it re-reads the van's latest position (row-level security decides whether it may) -> `useGlide` slides the marker there over a second. Minutes come from `etaMinutes` in `@pohnch/core`: distance, the van's recent speed, Karachi road detours, and how many stops are still ahead (`stops_ahead` returns only a number).

Browser preview with made-up data: the parent screens can be checked without a server by answering the app's Supabase requests in Playwright (see how B5 was checked in the commit history).

## Alerts and the lock screen (B6)

How a push travels: the driver taps -> the `app` Edge Function stores the step -> if it is new (not a resend from the offline queue) it asks the database who should hear (`push_recipients`: that child's family for "in the van", "dropped" and "at your door"; every family on the van for "left", "reached school" and "late", except children on chutti; nothing for practice trips) -> builds one message per phone in that phone's language (`supabase/functions/_shared/push.ts`) -> sends it through Expo's push service -> forgets phones that no longer exist. Logs carry counts only.

The words come from `packages/messages`. After changing any `step.*`, `eta.door`, `parent.late`, `help.reason.*` or `timeline.by` text, run `node scripts/gen-push-text.mjs` (a test fails until you do).

In the parent app (`apps/parent/src/notifications/`, `src/widgets/`):
- After login it asks permission and registers the phone (`register_push_token`).
- Android: a quiet ongoing notification during a live trip ("6 منٹ میں گھر", then the route dots), updated in place and removed when the child is in or the trip ends.
- iPhone: a Live Activity and Dynamic Island with the same minutes and dots, and a home-screen / lock-screen widget with the live minutes or the next trip. These need a development build (not Expo Go) and are made by `expo-widgets` at build time.

### Setting push up (once the accounts exist)

1. Expo: create an access token (expo.dev > Account settings > Access tokens) and `supabase secrets set EXPO_ACCESS_TOKEN=...`.
2. Android: in Firebase, create a project for `pk.pohnch.parent`, then upload its FCM V1 service-account key with `pnpm dlx eas-cli credentials` (Android > push notifications).
3. iPhone (needs the Apple Developer account): `pnpm dlx eas-cli credentials` creates the push key; EAS also sets up the App Group (`group.pk.pohnch.parent`) the widget shares with the app.
4. Build a development build with `eas build --profile development` and allow notifications when the app asks.

### Known limits (stage 1)

- The Android ongoing notification and the Live Activity are updated by the parent app while it runs in the background; if the phone stops the app, step pushes still arrive but the minutes stop updating. B8 measures this on real phones; updating the Live Activity from the server by push (APNs) is ready in `expo-widgets` if needed.
- The iPhone map, widget and Live Activity use Apple's star symbol in kesar, not our eight-point star (widgets can't load our SVG yet).

## The website and admin page (B7)

| Page | File | What it does |
| --- | --- | --- |
| `/`, `/en` | `apps/web/app/Landing.tsx` | What Pohnch is, how it works, drivers, privacy in one line, WhatsApp. |
| `/privacy`, `/en/privacy` | `Privacy.tsx` | The privacy policy in plain words (all text in `packages/messages`). |
| `/i/<token>` | `invite/` | One static page for every invite link; the browser builds the "open in Pohnch / Pohnch Driver" links. |
| `/.well-known/...` | `api/app-links/` | The files that let `pohnch.pk/i/...` open the parent app directly. |
| `/admin` | `admin/` | The Pohnch team: login, the 4 numbers, driver checks, all vans (switch off), today's trips. |

The admin numbers come from database functions that only answer the team (`admin_stats`, `admin_vans`, `admin_trips_today`); "alerts delivered" is counted per day by the push sender (counts only).

### Putting it online on Vercel

1. vercel.com > Add New > Project > import `Mxhddd/Startup`, root directory `apps/web`.
2. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://pohnch.pk`, and once the apps exist `APPLE_TEAM_ID` (Apple Developer > Membership) and `ANDROID_CERT_SHA256` (`pnpm dlx eas-cli credentials` > Android > the SHA-256 fingerprint).
3. Domains: add `pohnch.pk` and point the registrar's DNS at Vercel as it shows.
4. Make yourself the team: after logging in once in an app, run `insert into admins values ('<your user id>');` in Supabase's SQL editor.
5. Check `https://pohnch.pk/.well-known/assetlinks.json` and `/apple-app-site-association` show the right ids before building the apps for the stores.

**About invite tokens and logs:** our code never reads the token on the server (every `/i/...` link shows the same static page, and it is never cached or indexed and never passed on as a referrer). Vercel's own request logs still record page addresses, so in the Vercel project keep log retention at the minimum and add no log drains. Supabase stores only the token's hash.

## Hardening (B8)

### What the review found and fixed

| Found | Fix | Proved by |
| --- | --- | --- |
| Deleting a parent's account was blocked (their chutti and join requests pointed at them) | those references become empty; the family, children and their steps are deleted | `070-hardening.test.sql` |
| A driver could make two vans; the app expects one | one van per driver | `070` |
| A dead phone left a trip running, which blocked the next day's start | starting a trip ends this van's trips from earlier days; a job every 15 min ends trips with no news for 3 hours; the team can end a trip on the admin page | `070` |
| No way to leave a van | parents can take their child off a van, drivers can remove a rider (hold to confirm) | `070`, handler tests |
| A parent who also drives saw their riders as their own children | the parent app lists only the person's own families' children | code review |
| "Too many requests" made the offline queue drop a tap | 408 and 429 are retried like no signal | `login.test.ts` |
| The driver's Stops screen failed silently without signal | says "No signal. Try again." | screen audit |

The 30-day position cleanup is now tested (`070`), and a whole school day runs as one test (`080-school-day.test.sql`): chutti, the morning run with "arriving", a tap, an undo and the tap again, reached school, the afternoon run, the parent's view, the push list and the admin numbers.

### Rate limits

- Login codes (Supabase Auth): one SMS per number every 30 s; per IP address 30 codes, 30 sign-ins and 30 code checks an hour (`supabase/config.toml`; set the same under Authentication > Rate Limits in the dashboard).
- The `app` Edge Function: a limit per person and action (`LIMITS` in `supabase/functions/_shared/handler.ts`), counted in the database; over the limit gets 429 and the app retries later. `family.add` allows 10 a day, so nobody can use it to test which phone numbers have accounts.

### The leak check

`pnpm check:leaks` (run by GitHub after every push, on the built website and both apps):
- no `console.*` outside the two Edge Function entry points, and server log lines may only print the action, status, push step and counts;
- no `.env` file committed;
- no server secret, private key, or phone number (other than the public pilot WhatsApp number) in any bundle.

### Every screen's states

| Screen | Empty | Loading | Offline | Error |
| --- | --- | --- | --- | --- |
| Driver: Today | no van -> set up; no riders -> send the link | "Loading…" | "No signal. Try again." + retry | same, with retry |
| Driver: Trip | "Every child is done" | (opens from Today) | taps wait in the queue; "3 taps saved on this phone" | location off -> banner |
| Driver: Stops / Families / Van | "No stops yet" / "No requests yet" | from Today's data | "No signal. Try again." | generic message |
| Parent: Home | add a child / join a van / waiting / no trip now | "Loading…" | "No signal: showing the last information"; van grey with "last seen" | retry |
| Parent: forms | — | button disabled while saving | message under the form | message under the form |
| Website: admin | "No drivers waiting", "No trips yet today" | "Loading…" | "Something went wrong. Refresh." | same |


## The live project (set up 3 November 2026)

- Supabase project **Pohonch** (`vsyunieszswpreogzolx`). The 9 migrations were applied through Supabase's Management API (this cloud session can't reach the database port directly) and recorded in `supabase_migrations.schema_migrations`, so `supabase db push` from a laptop stays in step. Both Edge Functions are deployed with `--use-api`.
- Phone login: on, codes through the `send-sms` hook (secret set; no gateway yet), test numbers 0300 0000001 and 0300 0000002 with code 123456. Rate limits as in `config.toml`.
- Expo: parent app = `@pohonch/pohonch`, driver app = `@pohonch/pohnch-driver`; the Supabase URL and anon key are EAS environment variables (development, preview, production).
- Android builds: `cd apps/driver && pnpm dlx eas-cli build -p android --profile preview` (and the same in `apps/parent`); the build page gives an install link.
- Pilot operations: `docs/PILOT.md`. Store texts: `docs/STORE.md`.

## Design pass: the v5 look and motion (3 November 2026)

Both apps now follow the canvas page "v5 · Map-first app (current)". Where the pieces live:

| File | What it is for |
| --- | --- |
| `packages/ui/src/theme.ts` | new tokens: `sand`, `hairline`, the dark "lip" colours under big buttons, `shadow` (float, sheet, card), bigger radii |
| `packages/ui/src/motion.ts` | the motion spec: one set of springs (press, release, sheet, pop, layout, number) and timings every animation uses; rubber band and fling snapping for the sheet (tested) |
| `packages/ui/src/native/haptics.ts` | the taps you feel: tap, press, tick, success, warn (expo-haptics; skipped where a phone has none) |
| `packages/ui/src/native/PressableScale.tsx` | every button: sinks on a spring, springs back with a small overshoot, presses into its lip |
| `packages/ui/src/native/Logo.tsx` | the پہنچ mark from `design/logo`; on the login screen the star drops onto the ن |
| `RollingText`, `ChoiceChip` | minutes and counts that roll to a new value; pick-one pills |

How each action moves:

- **Driver taps a stop:** the button presses into its lip, a success haptic, the next stop's button rises into place, the undo bar slides up with a ring emptying over 5 s, the done row draws its tick.
- **Hold (start trip, reached school):** the fill sweeps from the reading start with a tick at each quarter; let go early and it springs back.
- **Parent sheet:** drag or flick; it coasts to the snap you were heading for and stretches a little past the ends. "Trip" opens it to the timeline, whose steps come in one after another; the step happening now breathes.
- **Map:** the van glides between positions at an even speed and its halo breathes; it goes grey and still when the signal drops. Pins drop in. The camera eases.
- **Screens:** the iOS push, from the left in Urdu and the right in English.
- **Login:** a wrong number or code shakes the message; each code digit pops into its box.

Phones with "reduce motion" switched on get the calmer version automatically (Reanimated follows the system setting).

**Browser preview:** the web build draws a sketch map (no MapLibre on the web) so screens can be checked without a phone; real phones use the real map.

## v6: polish and motion (3 November 2026)

Designed first on the canvas page "v6 · Polish and motion (current)" (six screens and two motion notes), then built:

| Piece | What changed |
| --- | --- |
| `theme.ts` | roomier: radii 22-32, a 20 px side gutter, `shadow.raised`, coloured `glow`s, glass colours, `type.hero` 64 |
| `Glass.tsx` | frosted glass (expo-blur) for the child chips, menu and live pill over the map |
| `RollingNumber.tsx` | the minutes roll like an odometer, one wheel per digit |
| `TapButton` | bigger (120 px next tap, 72 px icon tile), a soft coloured glow under it, and a sheen of light that sweeps across once when a tap is confirmed |
| `MapSheet` | rises in on open; reports how open it is, so the parent map sinks 3 % and dims as the sheet lifts |
| `VanMarker` | two rings ripple out of the van, instead of one pulse |
| `TimelineEvent` | each connecting line draws itself down as its step arrives |
| Login | neel top with the star pattern drifting slowly, the white mark with the star dropping in, a cream sheet rising underneath |
| Driver Today | header with a gentle light, the route map as a raised card overlapping it, roomier list |
| Driver Trip | the header floats as a card over the map; after each tap a green "marked" panel draws its tick, with the undo ring under it, while the next stop waits as a normal button |

The parent's language switch moved from the map's top bar to the menu page, so the bar fits a 320 px phone.

## v7: world-class pass (3 November 2026)

Designed first on the canvas page "v7 · World-class (current)": the un-boxed parent home, the step moments, notification settings, the Live Activity, the Dynamic Island, the iPhone widgets, Android's live notification and widget, and the grouped alerts. Then built in six phases.

| Phase | What changed | Main files |
| --- | --- | --- |
| Un-boxing and moments | squircle corners everywhere; the parent sheet is one surface (compact line at peek that grows into the big minutes); one row of round actions; step moments (a ring closes, or a star burst at school); shimmer loading; drawn empty states; launch reveal | `packages/core/src/moments.ts`, `packages/ui/src/native/{MomentBanner,Shimmer,LineArt,CircleAction,LaunchReveal}.tsx`, `apps/parent/src/components/TripSheet.tsx` |
| Living map | follow mode (tilted 35°, turned with the van, "back to the van" button after a pan), a fading trail, flowing dashes to your stop, 3D buildings at street zoom, heading cone | `packages/ui/src/native/PohnchMap.tsx`, `mapStyle.ts`, `parent.recentPositions()` |
| Alerts and settings | a switch per alert, Pohnch sounds (chime; two-note "pohnch") with hear-it buttons, alert language; "time-sensitive" only for arriving and late; an "Open trip" button | `notification_prefs` table, `push_recipients(p_trip, p_children, p_step)`, `supabase/functions/_shared/push.ts`, `apps/parent/src/app/settings.tsx`, `apps/parent/assets/sounds/` |
| iPhone lock screen | Live Activity and Island whose minutes count down by themselves; widgets in five sizes; the server updates locked phones once it has Apple's key | `apps/parent/src/widgets/*`, `packages/core/src/liveCard.ts`, `live_activity_tokens`, `supabase/functions/_shared/liveActivity.ts` |
| Android | our own live trip notification (refreshed by quiet data messages when the app is closed), home-screen widget, driver's live trip notification | `apps/parent/src/notifications/{LiveTripNotification.tsx,ongoing.android.ts,liveTask.ts}`, `NextTripWidget.android.tsx`, `apps/driver/src/notifications/*` |

**What needs an account before it works on a real phone:**
- iPhone Live Activity updates while the phone is locked: Apple's push key. Add `APNS_KEY_ID`, `APNS_TEAM_ID` and `APNS_PRIVATE_KEY` (the .p8 text) as Edge Function secrets (`supabase secrets set ...`); without them the server skips iPhone cards and the app updates them while open.
- Every Android push (alerts, and the quiet live refreshes): a Firebase project, with its key uploaded to Expo (`eas credentials`, Android, FCM V1).

**Android 16 "Live Update" chip in the status bar:** Android only allows it for its standard notification styles, not custom-drawn ones like ours. It would need a small native Kotlin module; not built yet.

## v8 phase B: the missing pilot features (3 November 2026)

These had a server half but no screen (or neither). Each one, and how its data moves:

| Feature | Screen | How the data moves | Tests |
| --- | --- | --- | --- |
| Whole-van day off | Driver: Today > Day off (`apps/driver/src/app/dayoff.tsx`) | Pick today or tomorrow, hold. A 5-second undo bar comes first, so a mistake never reaches anyone. Then `dayoff.set` saves it, and the Edge Function sends every family on the van one push (`notifyDayOff` in `notify.ts`, words in `push.ts`). Parents' sheet shows "No van today" (`vanDaysOff` in the parent client). | `110-pilot-gaps.test.sql`, `push.test.ts`, `handler.test.ts`, `tests/maestro/driver-dayoff.yaml` |
| Stop times | Driver: Stops: each stop has ☀ morning and ◐ afternoon times; tap one to change it in a sheet (`EditSheet`) with -5/-1/+1/+5 | `updateStop` writes `morning_time` / `afternoon_time` straight to `stops` (row-level security: only the van's driver) | `dates.test.ts` (`nudgeTime`, `shortTime`), `tests/maestro/driver-stops.yaml` |
| Edit or remove a child | Parent: Menu > a child (`child.tsx?id=`) | name and school update `children` directly (only the family may); the pin goes through `set_home_pin`; removing deletes the child and everything about them | `tests/maestro/parent-child.yaml` |
| Family members | Parent: Menu > Family | `my_family_members()` lists names only (never phone numbers). The owner removes someone, or someone added leaves: `family.removeMember` > `remove_family_member` | `110-pilot-gaps.test.sql` |
| Delete my account | Parent: Menu > Delete my account; Driver: Help and account | `account.delete` (needs `confirm: true`) > `delete_account`: the person goes; a family they own goes too, unless someone else is in it (then that person becomes the owner); a driver's van goes only when no family is on it (`van_has_families` otherwise) | `110-pilot-gaps.test.sql`, `handler.test.ts`, `tests/maestro/driver-account.yaml` |
| Help | Parent: Menu > Help; Driver: Help and account | WhatsApp 0300 1478729 (`PILOT_WHATSAPP` in core) and pohnch.pk/privacy | `tests/maestro/parent-family.yaml` |

New shared pieces: `EditSheet` (a sheet for a small edit, rises on the sheet spring and lifts above the keyboard), `colors.kesarText` (kesar-family text that passes 4.5:1 on white, ghee and kesarTint), and `addDays`, `dayPartsOf`, `shortTime`, `nudgeTime` in `packages/core/src/dates.ts`.

Live: migration `20261103000400_pilot_gaps.sql` is applied and the `app` function is deployed. Deleting an account was checked on the live database with a throwaway user (rolled back).


## v8 phase C: the design in the apps (3 November 2026)

| What | Where | Notes |
| --- | --- | --- |
| Strict type scale | `type` in `packages/ui/src/theme.ts`, `AppText` | Display 34, Title 24, Headline 20, Body 17, Caption 14. `AppText` gained `headline` and `caption`; a size set in `style` now brings its own line height. |
| Gulzar for brand moments | `variant="display"` | Nastaliq (Urdu only, 26 px and up, line height 1.9): the driver's greeting, welcome screens, login title, step moments, the day-off cards, "Trip complete". English falls back to bold Manrope. |
| The drawn van | `VanMarker.tsx` | Our van from above (neel body, windscreen, kesar roof stripe, mirrors, nose arrow). It turns with its heading minus the map's turn (so it points up while the map follows it), and its shadow stretches with speed (`shadowStretch`). Grey and still when stale. |
| Time-of-day map | `mapMoods`, `mapMoodAt` in `theme.ts`; `brandMapStyle(style, mood)` | Morning (warm, 5-10), day (10-16), dusk (from 16). Checked every 10 minutes; each mood is coloured once from the same base style. A `night` palette is ready for dark mode. The switch is a style swap, not a cross-fade. |
| Welcome + alert priming | `apps/parent/src/app/welcome.tsx` | Three screens before the first login (what Pohnch does, the privacy promise, alerts). The system prompt is asked only on the last one; "Not now" skips it, and Settings offers "Allow alerts" later. `registerForPush` never prompts by itself any more. |
| Floating labels | `TextField.tsx` | The label sits in the box, then glides up on focus; `error` turns the border red, shakes once and shows the message. |
| Driver screens | `apps/driver/src/components/Screen.tsx`, `families.tsx`, `stops.tsx`, `done.tsx` | Every driver screen has Today's neel header. Families: requests first, riders in one list, remove through a hold sheet. Stops: "Change order" opens a press-hold-drag list (`DragList`, `moveId` in core) with a tick at each new place. Trip complete: a full-screen moment with minutes taken and children taken. |
| Accessibility | `AppText`, `TextField`, `theme.test.ts` | Text follows the phone's size up to 130%. Reanimated's animations follow the phone's Reduce Motion setting by default (they jump to the end). Contrast tests now cover every text-on-ground pair used. |

Not done in this phase: true shared-element transitions (still experimental in Reanimated 4); the child's page instead opens with the same kesar initial growing in.

## v8 phase D: the website in the same language (3 November 2026)

- **Landing** (`apps/web/app/Landing.tsx`, `LivingMap.tsx`): the headline in Gulzar beside a living map: the route's dashes flow toward a home pin while the drawn van drives it (pure SVG `animateMotion` and CSS, no JavaScript); a frosted "6 min" card. Three steps joined by route dots, and a neel band for drivers and the privacy promise.
- **Invite** (`apps/web/app/invite`): one card: a neel top with the star and the invitation in Urdu (Gulzar) and English, then the buttons, each with its Urdu line over its English line. The token rules are unchanged (read in the browser only, no referrer).
- **Admin** (`apps/web/app/admin/AdminApp.tsx`): the driver app's neel header, borderless cards with soft shadows, big neel numbers.
- **Motion and access** (`apps/web/app/globals.css`): gentle rise-in, button press, focus ring in kesar; everything stops for people who ask for reduced motion (the van parks).

## v8 phase E: the extras (3 November 2026)

| Extra | Where | How it works |
| --- | --- | --- |
| Over-the-air updates | `app.config.ts` (`updates`, `runtimeVersion`), `eas.json` (`channel` per profile) | `eas update --channel preview` sends JavaScript and design fixes to installed preview builds; builds take only updates for their own app version. |
| Crash reports | `apps/*/src/crash.ts`, `packages/core/src/scrub.ts` | Sentry, off unless `EXPO_PUBLIC_SENTRY_DSN` is set and never in development. `scrubEvent` drops the user, request and extras, keeps only screen-change breadcrumbs (bare paths) and replaces phone numbers, tokens and coordinates. `check-leaks.mjs` refuses a `Sentry.init` without the scrub and with screenshots on. |
| Planned chutti | `apps/parent/src/app/chutti.tsx`, `packages/core/src/calendar.ts` | A month calendar per child; Save sends only the changed days. The server refuses dates more than 60 days ahead (`date_too_far`). |
| "Off today" from the alert or widget | `push.ts` (`trip-left` category, child ids in the data), `setup.ts`, `TripNotifications.tsx`, `NextTripWidget.tsx` (a `Link`) | Both open `/chutti?quick=today` with today already chosen: one tap on Save. No token or name is ever inside the notification. Android's widget has no button yet. |
| School pin and ETA | Driver: Setup > School on the map; parent sheet | `set_school_pin` / `school_point` (driver, families, team only). After pick-up the parent sees "School in N min". |
| Driver nudges and voice | `packages/core/src/nudges.ts`, `RunScreen.tsx`, `apps/driver/src/voice.ts` | Stopped within 60 m of the next stop: one bump and the button breathes. Within 250 m: the next stop is spoken (expo-speech, Urdu or English; a switch on the trip screen). Near the school with everyone in: "reached school" breathes. Every step is still the driver's own tap. |
| Van at the door, "We're ready" | `TripSheet.tsx`, `ready_signals` table | When the van is at the door (or 3 minutes away) the parent sees the wait counting up and can say "We're ready"; the driver sees a green note by that child. Row-level security: only that child's family can say it, only on a running trip. |
| Today's story and the week | `TripSheet.tsx`, `apps/parent/src/app/history.tsx`, `packages/core/src/story.ts` | When a run ends the sheet tells it in brand type with the ride's minutes; "This week" shows the last 7 days of timelines. Drivers see "this week: N of M trips tracked start to finish" on Today. |
| Dark mode (parent) | `nightColors`, `applyColorScheme` in `theme.ts`; `apps/parent/src/app/_layout.tsx` | Follows the phone. The palette switches in place and the screens are redrawn when the phone switches; the map uses the night mood; glass turns dark. New roles (`onBrand`, `onFill`, `onKesar`, `night`, `link`) keep text readable on both; contrast tests cover the night pairs. The driver app stays light. |

Live: migration `20261103000500_extras.sql` applied; the `app` function redeployed.

## v9 "Alive": sound, motion, flows and alerts (4 November 2026)

The design came first: the canvas page "v9 · Alive" (with a sound board where every tone plays) and the Design System's new `sound`, `haptic` and spring tokens. Then the apps.

### Sound: "Pohnch tones"

| What | Where | How it works |
| --- | --- | --- |
| The kit | `scripts/sounds/make-tones.py` | Every sound is made by code: a struck wooden bar with a soft bell overtone in a small room, every note in D major so sounds that follow each other make music. Re-make it with `python3 scripts/sounds/make-tones.py` (needs numpy and scipy). It writes UI sounds (-24 LUFS) and a tone per step (-20) into `packages/ui/assets/sounds`, longer alert tones (-16) into `apps/parent/assets/sounds`, and `packages/ui/src/sounds.json`. |
| Checked by a test | `packages/ui/src/feedbackTable.test.ts` | Every sound exists, every trip step has its tone, loudness and peaks are in range, and the ends are silent (no clicks). |
| `feel(kind)` | `packages/ui/src/native/feedback.ts`, `feedbackTable.ts` | One call plays the sound and the haptic in the same frame. Presses, toggles, the sheet's snaps, the hold (four rising notes), confirm, undo, errors and each trip step use it. Sounds follow the phone's silent switch and mix with music (`expo-audio`, `playsInSilentMode: false`). |
| The switch | Settings > In-app sounds (both apps), `apps/*/src/sounds.ts` | On by default, kept on the phone (`pohnch.sounds.v1`), not on the server: it is a per-phone choice. Parents can hear each step's tone on the same page. |
| Alert tones | `supabase/functions/_shared/push.ts` (`STEP_SOUND`), `apps/parent/src/notifications/setup.ts` | Each step's push uses its own tone (`a_<step>.wav`). Android plays a channel's sound, so each step has its own channel (`step-picked`, `step-reached-school`…) plus `step-quiet`. |

### Graphics and motion (Skia on the GPU)

| What | Where | Notes |
| --- | --- | --- |
| Skia | `@shopify/react-native-skia` in `packages/ui` and both apps | The web preview loads CanvasKit first (`apps/*/index.web.js`); copy `canvaskit.wasm` next to a web export. Skia paths are built with `Skia.PathBuilder.Make()` … `.detach()`. |
| The van, v3 | `packages/ui/src/native/VanMarker.tsx` | A blurred shadow that stretches with speed, a small squash when it brakes, a lean into turns, headlights at dusk and night, a breathing glow while it waits at your door. Grey and still when the signal is old. |
| Glide v2 | `packages/core/src/glide.ts` (tested), `apps/parent/src/hooks/useGlide.ts` | Between two positions the van keeps rolling at its last speed (at most 4 s ahead), then eases onto each new real position over 1.6 s. It never jumps, and it freezes when the signal is stale. |
| Living sky | `LivingSky.tsx` | A band of light over the map that follows Karachi's time of day (dawn, day, dusk, night with stars), cross-fading between moods. |
| Moments v3 | `MomentFX.tsx`, `MomentBanner.tsx` | In the van: a ring closes around the step's disc. At school: kesar stars rise into a small constellation. Home: a warm glow. Each plays with its tone. |
| Liquid progress | `LiquidProgress.tsx` | The route bar in the open sheet fills like liquid toward your stop, with a sheen; it fills from the reading start. |
| Morph | `Morph.tsx` (`MorphProvider`, `useMorphSource`, `MorphTarget`) | Our own shared-element move: measure the source, fly a copy over the screens, land on the target, hand over. Used for the child's initial from the menu to the child page. |
| Reduce Motion | every component above | Motion jumps to its end state; sounds and haptics stay. |

### Flows

- **The day as states** (`packages/core/src/home.ts`, tested): idle, van left, coming, at your door, in the van, at school, the story. Each state has one next action: "Off today" before the van leaves, "We're ready" at the door, "This week" when the day is told.
- **First run as one path** (`FlowSteps.tsx`): add the first child, then join the van (open the driver's link or invite the driver), with a route-dots line at the top that fills as you go.
- **Invite links** (`apps/parent/src/app/i/[token].tsx`): a join card with the van, the driver, the school and "verified" (`invite.peek`, by the token's hash, names only), one hold to join, a star moment. A link opened before any child exists waits and reopens after the child is added.
- **Driver checklist** (`apps/driver/src/components/SetupChecklist.tsx`): van, stops, times, school, families, practice; it ticks itself and folds away when done.

### Alerts v2

| What | Where | Notes |
| --- | --- | --- |
| Words | `packages/messages`, `push.ts` | Name first ("علی وین میں بیٹھ گئے"), the driver's name in the body; "at your door" says "be ready". |
| One alert per trip | `tidyStepAlerts()` in `apps/parent/src/notifications/setup.ts` | When a newer step alert arrives (app open, app back to front, Android's background live task), the older step alerts of that trip are cleared. |
| Quiet hours | `inQuietHours()` in `push.ts` | 21:00-06:00 Karachi: step alerts arrive silently (no sound, `step-quiet` channel); "late" still rings. |
| "We're ready" from the alert | `trip-door` category, `TripNotifications.tsx` | The at-the-door alert has a "We're ready" button. It carries only the trip and child ids; it opens the app, which sends it with your own login. |
| Lock screen step row | `liveCard.ts` (`stepsDone`, `LiveText.marks`), `VanActivity.tsx`, `LiveTripNotification.tsx` | The Live Activity, Dynamic Island and Android live notification show three marks (left · in the van · there) that fill as the trip goes, from the app and from the server alike. |
| Driver alerts | `notifyDriver` in `notify.ts`, `apps/driver/src/notifications/`, `AlertsCard.tsx` | A family asking to join (opens Families) and "your van is verified". Today shows an "Allow alerts" card that explains first. A parent's "we're ready" plays a soft sound during the trip, never a banner. Server: `driver_push_targets`, `request_push_targets` (migration `20261104000200_driver_pushes.sql`, pgTAP test 140). |

### Checked

Type check, unit tests (core 99, ui 19, server 62, client 3, messages 6), database tests (206), both app bundles, the leak check and expo-doctor (20/20 each). In the web preview, the live map holds 60 fps with the van, sky and sheet moving; when a moment first appears there is one long frame (about 170 ms) in the software-rendered preview. Check it on a phone with Android's "Profile HWUI rendering" bars. Maestro flows: `parent-invite.yaml`, `driver-checklist.yaml`, `parent-sounds.yaml`.

### Not done yet

- Android 16's promoted "Live Update" chip (needs a small Kotlin module); the live notification is the v7 custom one with the new step row.
- The step row on the home-screen widgets.
- "We're ready" sent from the alert without opening the app (it opens the app instead, which is reliable on every phone).
- The sheet's inner list handing the drag to the sheet when it reaches the top.

### Android builds and memory

With Skia the first v9 builds on EAS died with "Gradle build daemon disappeared unexpectedly" (the build machine ran out of memory). `scripts/expo/withLeanGradle.js`, a config plugin in both apps, now builds native code only for phone CPUs (arm64-v8a and armeabi-v7a, no emulator types), runs at most two Gradle workers and sets Gradle's memory. To build for an x86 emulator locally, pass `-PreactNativeArchitectures=x86_64` to Gradle.

## v10 "Jharoka": a layered, local look; stage 1 gaps; stage 2 behind a switch (4 November 2026)

Design first: the canvas page "v10 · Jharoka (current)" (22 boards) and the Design System's new `inset`, `*-hi`, `elevation-1..3`, `arch` and `icon-duo` tokens.

### Why it looked boxy, and what changed

Every piece of content was the same white card on cream, with bordered fields, hairline-ruled lists and flat buttons. Now:

| Part | Where | What it does |
| --- | --- | --- |
| The arch (jharoka) | `archPath()` and `humpPath()` in `packages/ui/src/theme.ts` (tested); `native/Arch.tsx` (`ArchShape`, `ArchAvatar`, `StarPattern`) | One pointed Mughal arch: parent page headers, child portraits and avatars, the join card, the week story, the van-at-your-door seal, widget art. The star pattern (7%) only in brand moments. |
| Page header | `native/ArchHeader.tsx`, `apps/parent/src/components/Page.tsx` | Neel, lit from one corner, the pattern, a Gulzar title; the page rises into it at the centre. |
| Groups, not ruled lists | `native/Group.tsx` (`Group`, `GroupRow`, `RowIcon`, `SectionCaption`) | One soft surface per group, rows separated by space; a kesar star names each group. |
| Fields and choices | `TextField.tsx`, `ChoiceChip.tsx`, `Segmented.tsx`, `Toggle.tsx` | Filled, no borders; focus lifts the field with a glowing underline; a sliding segmented control. |
| Buttons with depth | `TapButton.tsx` | Gradient face, top highlight, a lip on every tone; the old bordered "neutral" is a soft tinted button. |
| Two-tone icons | `icons.tsx` (`duo`) | The line plus a nudged tint of the same shape; new icons: wallet, search, shield, star, chevron. |
| Sheet | `MapSheet.tsx` | A small pointed arch rises from the home sheet's top edge round the handle. |
| Driver (plain) | `apps/driver/src/components/Screen.tsx`, `app/index.tsx` | A soft curved header bottom, the same groups and buttons, a 2 x 2 group of actions; no arch or pattern anywhere in the driver app. |

All new colour pairs have contrast tests, by day and by night (`theme.test.ts`).

### Stage 1 gaps and delights

- **"Tracked end to end"** (`20261104000300_trip_tracked_v2.sql`, pgTAP 150) now follows the brief: start tap, every rider, "reached school" in the morning, positions throughout (no gap over 5 minutes). Gate 1 counts this.
- **Widgets**: the step row (left · in the van · there) on the iPhone and Android widgets.
- **The week's story** (`apps/parent/src/app/story.tsx`, `weekStory` in core): a shareable picture of the child's week (first name only; no map, place or times), from This week.
- **Driver's weekly record**: a ring on Today. **First-week tips**: three tips on the parent home for 7 days (`tipsDue` in core).

Not done, and why:
- An "Off today" button on the Android widget: `expo-widgets` hands an Android widget's button tap to the app only while it is running, so the button could silently do nothing.
- "We're ready" from the alert without opening the app: there's no background route we can rely on for both platforms yet, so the button opens the app.
- Android 16's "Live Update" chip: still needs its own Kotlin module.

### Stage 2, built behind a switch (off until gate 1)

On the user's instruction, the stage 2 pieces exist in code but are **off for everyone** (`app_flags` has no rows live). The team switches them on from the admin page, for everyone or one van, only after gate 1. With the switch off, every stage 2 database function refuses with `stage2_off` and the apps show nothing new.

| Piece | Server (`20261104000400_stage2.sql`, pgTAP 160) | Apps |
| --- | --- | --- |
| The switch | `app_flags`, `flag_on`, `admin_set_flag`, `admin_flags` | `useStage2()` in both apps; admin page "Stage 2 switch" |
| Pohnch Live | `live_entitlements`, `start_live_trial` (once per family), `live_status` | `plans.tsx`. A free month only: no payment until the company, NTN and bank accounts exist |
| Find a van, ask for a seat | `vans_near` (verified vans with a stop near the home pin; driver's first name, reliability from tracked runs, rating from 5 up, fee, seats left; never riders' names or phones), `request_seat` (waiting membership, `trial_until` + 7 days) | `find.tsx` |
| Request a van | `van_requests`, `request_van`, `request_progress` (same school within 2 km), `withdraw_van_request`, `admin_van_requests` (counts only) | `request.tsx`; admin list |
| Ratings | `ratings` (one per family per van per month), `rate_van`; averages only from 5 | "Rate the van" on `fees.tsx` |
| Fees | `vans.monthly_fee`, `vans.seats`, `fee_payments`, `set_van_fee`, `mark_fee_paid`, `van_fees`, `child_fees` | `fees.tsx` (parent), `earnings.tsx` (driver). Cash only; the 7% fee waits for in-app payments |
| Help alert | `help_alerts`, `send_help_alert` (running trip only; the van's last position), `admin_help_alerts`, `admin_resolve_help` | the emergency hold on the driver's help sheet; admin page, first section |

Maestro: `parent-story.yaml`; `parent-stage2.yaml` and `driver-stage2.yaml` need the switch on for the test van. Playwright: the admin stage 2 test.

Live: migrations `20261104000300` and `20261104000400` applied and recorded; no switch rows, so stage 2 is off.

## v11 "Gehrai" (depth): immersive, moving, layered (4 November 2026)

v10's look felt static and flat: one arch shape on a flat page, nothing moving but taps. Design first: the canvas page "v11 · Gehrai" has seven looping prototypes. Then the apps:

| Part | Where | What it does |
| --- | --- | --- |
| Corridor header | `packages/ui/src/native/Corridor.tsx`, `apps/parent/src/components/Page.tsx` | Every parent page opens on a corridor of three arched walls (farther ones lighter and hazier) with a time-of-day sky behind: sun glow, stars at dawn and night, a warm rim on each doorway. Scrolling walks you through it (near arch grows past and fades, title settles into a slim frosted bar). |
| Light on the page | `Depth.tsx` (`LivingGround`, `JaliLight`), `FloorLight` | The ground is lit by two soft lights that drift; light pools under the doorway; sunlight slides through a jali (an svg mask, so it blends). |
| Niches | `Depth.tsx` (`Niche`), `family.tsx` | Children as carved mehrabs that float very gently. |
| Arch transitions | `ArchWipe.tsx` (`ArchWipeProvider`, `useArchWipe`) | A page opens through an arch of neel light growing from what you tapped (the child niches today). |
| Moments | `ArchMoment.tsx`, `app/index.tsx`, `TripSheet.tsx` (`onMoment`) | At your door, in the van, at school, home: a full-screen arch of light with rays, the initial and stars, then it settles. Tap to dismiss. |
| Touch | `PressableScale` (`tilt`), `Group.tsx`, `Toggle.tsx` | Cards and rows lean toward the finger; the switch knob stretches as it travels. |
| Tilt | `Depth.tsx` (`useTilt`, `TiltLayer`), `welcome.tsx`, `i/[token].tsx`, `story.tsx` | On brand screens the sky, arches and cards move at different depths as the phone tilts (expo-sensors device motion; never location). |
| Home | `MapSheet.tsx`, `PohnchMap.tsx`, `mapStyle.ts` | Frosted glass sheet; the road ahead glows with light flowing to your door; camera tilted to 50 degrees; buildings lit with a vertical gradient. |
| Driver (plain) | `apps/driver/src/components/Screen.tsx`, `app/index.tsx` | Only the header folds a little as you scroll. No ornament. |
| Gradients | `Gradient.tsx` | svg gradients that draw the same on phones and the web (the web ignores `experimental_backgroundImage`). |

Reduce Motion: no walk-through, drift, tilt, rays or arch wipe; fades only, sounds stay. New dependency: `expo-sensors` (both apps).

## v12: 20 new features and 20 design changes (4 November 2026)

Built in phases: server and rules first, then the apps (safety and ETA, school life, family and driver extras), then the design changes. Roman Urdu was not chosen, so it isn't here.

### How data moves (the new pieces)

- **Database** (`supabase/migrations/20261104000500_v12.sql`, tested by `supabase/tests/database/170-v12.test.sql`). Every new table has row-level security:
  - `run_absences`: off for one run only. The family writes it; the driver reads it. `private.off_for` makes the tracked-trip rule and the admin counts honour it.
  - `run_changes`: a one-day start time. Only the Edge Function writes it (`run.change`), and it then pushes the families.
  - `notices`: team notices. Only the Edge Function writes them (`admin.notice`), and it pushes the families and drivers.
  - `signals`: quick signals. Families insert them; their van's driver reads them. They are fixed kinds, not free text, so this is not chat.
  - `found_items`: the driver adds an item; the family sees it and marks it collected.
  - `trips.seat_checked_at` and `confirm_seat_check`: the seat check at the end of a trip.
  - `child_ride_minutes`: the median ride time from past runs.
  - `admin_speeding_today`: fixes faster than 50 km/h, for the team only.
- **Rules** (`packages/core/src/v12.ts`, tested in `v12.test.ts`). These are plain functions with no network. The screens only call them:
  - `lateBy`, `blendEta`, `getReadyDue`
  - `bestOrder` (nearest neighbour, then 2-opt)
  - `PK_HOLIDAYS` / `upcomingHolidays`, `seasonFor`
  - `onTimeStreak`, `stuckInTraffic`, `isRaining`
  - `speedWarn`, `preTripDue`, `shiftTime`, `replayAt`, `nextReminder`, `lookAhead`
- **App data** (`packages/client/src/{driver,parent}.ts`): v12 reads and writes. `packages/client/src/weather.ts` is the rain check: one fixed city-centre point on Open-Meteo, at most every 15 minutes, never a location (also in the privacy policy).
- **Local alerts** (made on the phone, no server):
  - parent: `notifications/LocalAlerts.tsx` (get ready, running late, Friday story, morning brief), with choices kept in `localPrefs.ts`;
  - driver: `components/StartReminder.tsx`.

### Features

| Feature | Where | Notes |
| --- | --- | --- |
| Seat check | driver `RunScreen.tsx`, `trip.tsx` | Every trip ends with a hold on "the van is empty". In the morning "reached school" is sent first. |
| Speed watch | `RunScreen.tsx`; web `AdminApp.tsx` (V12) | Over 50 km/h the trip screen shows a red line, and the driver hears a spoken nudge at most every 2 min. The team sees today's speeding. |
| Pre-trip checklist | driver `components/PreTripCheck.tsx` | Once a day: doors, belts, fuel, phone. Kept on the phone. |
| Late warning | parent `ParentStore` (`lateMin`), `DayCards.tsx`, `LocalAlerts.tsx` | Compared with the stop's time, or today's changed time. Shown as a banner plus one alert per trip. |
| Learned ETA | `ParentStore` (`blendEta`) | Trusted after 3 past runs. Near the door, the live estimate wins. |
| Get-ready alert | settings (prep minutes), `LocalAlerts.tsx` | 3/5/10/15 minutes, or off. |
| One run off | parent `chutti.tsx`; driver `DriverStore` (`runOff`) | This morning, this afternoon, or tomorrow's. |
| One-day time change | driver `DayCards.tsx` (`TimeCard`); parent sheet | Families get a push. "Back to usual" undoes it. |
| Holidays | driver `HolidayCard` | Federal holidays for 2026 and 2027; moon dates say so. One tap gives the van the day off. |
| Team notice | web admin; both apps | Lasts a day. Goes to one van or everyone. |
| Rain mode | both apps, `useRain` | Banner, sky rain, and a one-tap "rain delay" on the trip (late reason `rain`). |
| Quick signals | parent `QuickSignals`; driver `SignalsCard`, trip | "Sick today" also marks chutti. |
| Lost and found | driver `FoundCard`; parent `FoundItems` | |
| Hear the ETA | parent `voice.ts`, `TripSheet` | Tap the minutes. |
| Ride replay | parent `components/Replay.tsx`, `history.tsx` | About 20 seconds, from the trip's own positions. |
| Family view | parent `app/kids.tsx` | Shown only for families with more than one child. |
| Friday story, morning brief | `LocalAlerts.tsx`, settings | |
| Best stop order | driver `stops.tsx` | Offered only when it saves at least 0.3 km. |
| Start reminder | driver `StartReminder.tsx` | 10 minutes before the first stop; skips days off. |
| On-time streak | parent `story.tsx` | Chutti days don't break it. |
| Stuck in traffic | driver `trip.tsx` | 5 minutes without moving away from a stop, then one tap. |

### Design (packages/ui unless noted)

- **Header and sky:**
  - ink title reveal and overscroll stretch (`Corridor.tsx`);
  - weather and seasons (`Weather.tsx`: `RainStreaks`, `Clouds`, `Moon`, `Lanterns`, `Bunting`; `Sky` takes `weather` and `season`).
- **Trip sheet and map:**
  - trip-state tint (`MapSheet` `accent`);
  - van marker sheen, windows and brake lights;
  - camera look-ahead (`lookAhead`);
  - home pin drop (`DropIn` in `PohnchMap`);
  - `RouteRibbon`;
  - ArchMoment rays beating with the tone.
- **Loading and empty states:**
  - `StarSpinner`;
  - `Shimmer arches`;
  - `EmptyScene`.
- **Readability:**
  - `childColors` (one colour per child everywhere);
  - big-text mode (`setTextScale`, read by `AppText`; parent settings);
  - driver sunlight mode (`sunColors`, `applySunlight`; driver Help & account; contrast-tested).
- **Celebration:** `StarBurst` on Friday's story.
- **Not done:**
  - **Widgets**: they keep the v10 art. Glance and WidgetKit can't draw the corridor's arches and gradients well, so this is noted rather than half-done.
  - **Alternate app icons**: these need a native module and a store review step. Left for later, deliberately.

Tests: core v12 (18), client rain check, ui theme (child colours, sunlight contrast, text scale), pgTAP 170, server push tests, Playwright admin v12, Maestro `driver-v12.yaml` and `parent-v12.yaml`, and the seat check in `driver-practice.yaml`.

## Code audit (5 November 2026)

A full read of the server, both apps, the shared UI and the website found about 50 defects. All of them are fixed, with tests. The most serious:

- **Live map (critical, present since B5).** The parent app asked `positions` for `lat`/`lng`, columns it doesn't have (the point is stored as PostGIS geography). On a real phone, the live map, ETA and trail would have failed during every trip; the web preview hid this because it uses a fake backend. Fix: a `position_points` view (security_invoker, so row-level security still applies) that turns the point into `lat`/`lng`.
- **Driver Today crash (critical).** React hooks ran after an early `return <Redirect/>`, so the screen crashed the moment a trip started. Rule to remember: every hook goes above any early return.
- **Seat check.** "Reached school" lost its 5-second undo and could be sent twice (two pushes). Now the panel keeps the undo, the server records a van-wide step only once per trip (`record_tap` returns 0 for a repeat), and the seat check goes through the offline queue (`trip.seatCheck`).
- **Ending a trip offline.** The trip is marked ended on the phone at once and remembered, so a refresh can't restart location while `trip.end` waits in the queue.
- **Live notification tokens** stuck to their first trip; now `register_live_token` moves the token to the current trip.
- **One-run chutti** (morning or afternoon only) was ignored by pushes and the ETA list. The server now uses `private.off_for` everywhere, and writes go through `run_absence.set`, which refuses once that run's van has left.
- **Switching children** in the parent app could mix two children's data; each refresh now carries a counter, and late answers are dropped.
- **Tighter table rights:** families can no longer write directly to `run_absences`, `signals`, `found_items`, `ready_signals`, `live_activity_tokens`; only the columns a screen needs are granted. One signal of each kind per child per day (unique index).
- **Offline queue:** removing (undoing) a tap while an earlier one was being sent could still send it. Fixed, with a test.

Files: `supabase/migrations/20261105000100_audit.sql`, `supabase/tests/database/180-audit.test.sql` (24 checks), `packages/core/src/queue.ts`, `packages/core/src/v12.ts`, `apps/parent/src/state/ParentStore.tsx`, `apps/driver/src/state/DriverStore.tsx`, `apps/driver/src/components/RunScreen.tsx` and the day cards.

## Website v17: logo intro, front door, Karachi life (11 November 2026)

The home page (`apps/web/app/_v16/`) now opens in three steps:

| Step | File | What it does |
| --- | --- | --- |
| Logo intro | `Intro.tsx`, rules in `introRules.ts` | The route dots travel into the star, پہنچ writes itself, "Pohnch" rises with a gold glint, then the layer opens. Full (about 2.6 s) on the first visit, 0.6 s after that, none with reduced motion; any tap, scroll or key skips it. The only thing stored is `pohnch.intro.seen` in the visitor's own browser. |
| Front door | `FrontDoor.tsx` | "For parents" and "For drivers", 3 points each, plus a quote once `quotes.ts` has a real one (each quote now has a `role`). Drivers go to `/drivers`. Parents are asked "Where do you live?" (optional), then the story starts. |
| Your area | `HomeClient.tsx`, `world3d.ts` (`setAreaLabel`), `Panel.tsx` (`initialArea`) | The chosen area shows on a green street sign next to the home in the 3D city, pulses on the waiting map and is already picked in the join form. Not remembered between visits. |

Also new:
- **The fork** has two signposts ("Yes" and "Not sure yet").
- **Karachi life in the 3D city:** kites (one draw for all), rickshaws and cars (instanced), children walking into school, crows on water tanks and a chai stall (not on phones).
- **"Reached school":** پہنچ گئے writes itself in gold as the van reaches school (`.reached`, driven by the section's scroll).
- **Cross-page transitions:** pure CSS (`@view-transition`).
- **Vercel Web Analytics:** `<Analytics />` in `app/layout.tsx`, page views only, no cookies; the privacy page says so. Turn it on once in Vercel: Project > Analytics > Enable.
- **Phone top bar:** it keeps a small "Join the pilot"; the language switch moves into the menu.

Tests: `app/_v16/v17.test.ts` and the intro and front-door tests in `e2e/home.spec.ts`. Videos for review use `?timescale=0.125`, which also slows the intro's timers.

## Website v18: "Karachi, hand-painted" (12 November 2026)

**The 3D city** is now split into modules under `apps/web/app/_v16/world/`; `world3d.ts` only puts them together and keeps the same `createWorld()`:

| File | What it builds |
| --- | --- |
| `map.ts` | The plan: roads, home, roundabout, school, the route, the shore line; seeded random numbers. |
| `city.ts` | Apartments with balconies, laundry, sunshades, AC units, shop shutters with painted signs (one texture sheet, read per instance by `atlasMat`), tanks, dishes, bougainvillea, rooftop boards with Pohnch's lines, painted kerbs, zebra crossings, neem trees, palms, the mosque, your home (with a jharoka), the school (with a pennant), lamps, the route. |
| `van.ts` | The truck-art school van: chamak-patti bands, the SCHOOL VAN / اسکول وین plate, the painted back panel, roof rack with bags, children behind the glass, chrome hubcaps, mirror-work glints. |
| `life.ts` | Kites, the chai stall, rickshaws, cars, a donkey cart, people, children at the gate, crows. Nothing that moves casts a shadow (the city's shadows are drawn once). |
| `landmarks.ts` | The sea (shimmering), the shore, Mazar-e-Quaid and a minaret. |
| `textures.ts` | Everything painted on canvases. Words come from the page (`worldWords()` in `_v16/worldWords.ts`, from `web.line.*`, `web.shop.*`, `web.van.plate`), never from code. |
| `kit.ts` | Helpers: `paint`/`merge` (one draw per model kind), `atlasMat`, and `bake()`, which merges a still model's pieces per material. |

Speed: it measured the same as v17 in the same run (desktop and phone), after merging still models and lighter trees.

**Truck art** (`_v16/truckart.tsx`, `truckart.css`): chamak patti, roundels, couplet panels and glints, as seeded SVG, used only at brand moments. Shingarf red is never used for decoration (a test checks this).

**Home page:**
- the clock line ("Right now in Karachi", `nowKey()` in `hour.ts`, by the clock and saying so);
- the painted ring at the end of the intro, roundel bullets, the cracked screen and painted ×6;
- phone glass, the timeline dots ringing out, پہنچ گئے in painted bands, hand-painted signposts;
- brush-stroke strikes (they follow wrapped lines), the count-up calculator, painted map pins, kites when a family joins;
- the star in the top bar that fills as you read;
- the interaction kit (`delight.ts`): buttons lean, cards tilt at most 4°, desktop only, never with reduced motion.

**One night footer** (`_v16/Footer.tsx`) on every page.

**Inner pages** have their own scenes (`pageScenes.ts`, `PageScene.tsx`): a still (`public/v18/<page>.webp`, 1600 and 960 wide) for everyone, plus the live city fading in on capable desktops. Terms and Delete account get a quiet painted top. Each page has its own share picture (`public/v18/og-*.jpg`, chosen in `_lib/meta.ts`).

**New pages:**
- `/story` (Team Pohnch's letter);
- `/progress` (the public summary, with the same privacy limits as before);
- `/schools` (interest only).

Urdu versions live under `/ur/...`.

**Schools in the database:** `pilot_interest.role` can be `'school'` (migration `20261112000100_school_interest.sql`, test `188-school-interest.test.sql`). A school must give its name (table rule) and an office WhatsApp number (checked by the website and the `interest` function). The public summary never counts schools. After merging: `pnpm dlx supabase db push`, then redeploy the function with `pnpm dlx supabase functions deploy interest --no-verify-jwt --use-api`.

**Making the pictures again:**
- The scratchpad lab (`apps/web/.proto/lab18.tsx`, not shipped) renders any page scene (`__page(id)`) or story moment (`__story(section, t)`).
- The stills and the home's no-3D pictures come from it.

Tests: `app/_v16/v18.test.ts`, `e2e/v18.spec.ts`, plus school cases in both interest test files.
