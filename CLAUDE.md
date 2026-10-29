# CLAUDE.md — Pohnch

## What this is

Pohnch (پہنچ, "reached") is an Urdu-first, map-first school-van service for Karachi: "Careem for school vans". It is two native apps on the App Store and Google Play plus a website, sharing one backend:

- **Pohnch** (parents): the van moving on a live map, minutes to your door, an iPhone Live Activity and Android ongoing notification, a push for each step, "آج چھٹی" (absent). Later: find a van on your route and book a seat, request a van, pay fees.
- **Pohnch Driver** (drivers, free): today's stops, start trip, location shared only while a trip is on, one tap per child when the van is stopped. Later: seat requests, fees paid in the app with payouts on the 5th.
- **pohnch.pk** (Next.js): landing page, "invite my driver" page, privacy policy, our admin page; later the Pohnch for Schools desk.

Full brief: `BRIEF.md`. Designs: `design/DECISIONS.md` (round 5) and the canvas page "v5 · Map-first app (current)". Build steps: `docs/BUILD_PROMPTS.md`.

## Roles (there is no "captain" any more)

- **Parent**: has the account (phone login), adds children, marks chutti, invites up to 3 family members; sees only their own children and their own van.
- **Child**: a profile under a parent: first name, school, stop. No phone, no login, no gender, no photo.
- **Driver**: drives the van, sets up the van and its stops (or accepts a parent's "invite my driver"), approves families after Pohnch verifies the driver, taps when each child boards; sees their stops and today's first names.
- **Pohnch team (admin)**: verifies drivers, answers help, switches off a van.
- Later: **helper** (second adult on board) and **school**.

## Stage 1 scope (the pilot, 3–5 vans)

In: phone-number login with a one-time code; parent adds a child and either joins a van from the driver's invite or sends "invite my driver"; driver sets up the van, stop order and morning/afternoon times; driver approves each family; driver trip screen with start trip, background location only during the trip, big taps (hold to confirm on van-wide taps, 5-second undo on every tap), siblings at one stop in one tap, auto "arriving" near a stop, offline queue, practice run, help with late reasons plus 15 and 1122; parent live map with the van marker, ETA to home, timeline, aaj chutti with Undo until the trip's "left" tap; whole-van day off; push for each step; iPhone Live Activity, Android ongoing notification, home-screen widget; website landing, invite page and privacy policy; admin page with 4 numbers (trips tracked end to end, families active, alerts delivered, families on Live) and the driver check queue; Urdu and English. These are the screens on the canvas page "v5 · Map-first app (current)" marked stage 1.

Later (do not build until its gate): stage 2 after gate 1 (80% of trips tracked end to end and 40% of families keep Live): Pohnch Live billing (Rs 599), fees in the app with the 7% Pohnch fee, find a van and book a seat with a 1-week trial, request a van (opens at 4 children, launches at 8), ratings and driver profiles, help alert with location. Stage 3 after gate 2 (40 paying vans): Pohnch for Schools, Pohnch Amaan, helper mode.

Out: GPS hardware, location outside a trip, location from the parent app, chat, cash handled by Pohnch, school dashboards in stage 1, the Amaan marketplace before a training partner exists. Ask before adding anything not listed under "In".

## Stack

- One repo (pnpm workspaces): `apps/parent` and `apps/driver` (Expo, React Native, Expo Router, TypeScript strict), `apps/web` (Next.js App Router), `packages/ui`, `packages/core` (shared logic and types), `packages/messages` (ur.json, en.json), `supabase/` (migrations, Edge Functions).
- Maps: `react-native-maps`, brand-styled; the van marker animates between positions.
- Driver location: `expo-location` background task (Android foreground service), every 5 s while moving, 30 s when stopped, nothing outside a trip.
- Live Activity and widget: `expo-widgets` on iOS; an ongoing progress notification on Android.
- Push: Expo push (APNs and FCM).
- Supabase: Postgres with PostGIS, Realtime, Auth (phone OTP), Edge Functions.
- Vercel for the website. Vitest for logic, Maestro for phone flows, Playwright for the web. EAS for builds; TestFlight and Play internal testing for the pilot.

## Design rules

- Urdu first and right-to-left; English is a switch. All text lives in `packages/messages/ur.json` and `en.json`; never hard-code text in components.
- Phone layout reference 360 × 780; must also work at 320 wide and on large iPhones. Driver tap targets at least 64 px tall; the next expected tap is the only big (104 px) button.
- Brand and tokens: `design/BRAND.md` (v3 "Neel o Kesar", plus the map style). The canvas page "v5 · Map-first app (current)" is the reference; v4 and older pages are history.
- Parent screens are map-first: the map fills the screen and a bottom sheet holds the trip. Driver screens are plain and high-contrast (no pattern or frames). The star pattern and ornamental frames are for brand moments, plans and print.
- One colour per meaning, one icon per step: left and left school neel, picked and dropped zamurrad, reached school kesar with siyahi text. Shingarf red only for help, "van is late" and strikes.
- Logo: "the path arrives" (route dots into the star with a centre dot); under 32 px the star and dot alone.
- No text under 14 px, no thin grey text, contrast at least 4.5:1.
- Gulzar for display only (≥26 px, brand moments), Noto Sans Arabic for Urdu UI text (line-height about 1.6), Manrope for Latin and all digits; Western digits for times and prices.
- Voice: آپ, say who did it, calm, fewest words.
- Gender-neutral wording; never store a child's gender. Children are first names only.
- Every screen has empty, loading, offline and error states. When the van's signal drops, show "last seen 40 s ago" instead of pretending it moves.
- Theme values come from one theme file in `packages/ui`; don't scatter hex codes.

## Component names (same as the designs)

MapSheet, VanMarker, StopPin, EtaPill, TripHeader, TapButton (with hold behaviour), ChildRow, AbsentChip, OfflineBanner, RouteDots, TimelineEvent, UndoBar, HelpSheet, VanBadge, ApprovalCard, InviteCard, PlanCard, PriceRow, VanCard, ReliabilityScore, DriverProfile, RequestProgress, LiveActivity, AmaanSeal, SafeHomeCheck. Keep these names for the React components and their files.

## Data and security rules

- Row-level security on every table. No access for anonymous users. Logged-in users read only rows they own or belong to (a parent: their children, their van's trip and positions; a driver: their van). Writes that matter (taps, approvals, trips) go through Edge Functions that check the role; the service-role key lives only in Edge Functions and server code, never in an app or the website bundle.
- Invite tokens: 32 random bytes, base64url; store only the SHA-256 hash. Tokens appear only in `pohnch.pk/i/[token]` links, never in logs, other URLs, or app bundles.
- No secret, token, phone number or child's name in logs.
- Location: only from the driver app, only while a trip is running, visible only to that van's approved families and the Pohnch team; positions deleted after 30 days. The parent app never asks for location; a home pin is placed by hand.
- Dates for trips are in Asia/Karachi.
- Every tap has a client-generated `client_id`; the server ignores duplicates.

## Working rules

- Never commit secrets. `.env*` files are git-ignored; keep `.env.example` up to date with names only.
- Every feature gets a test (Vitest for logic; Maestro or Playwright where it crosses screens).
- Run the tests, the type check and the build before saying a step is done.
- Explain changes in plain language: the builder is a student learning as they build. Say what each new file is for and how data moves through it.
- One build step (B0–B9 in `docs/BUILD_PROMPTS.md`) at a time; show a plan first and wait for a go-ahead.
