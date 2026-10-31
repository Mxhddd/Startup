# Build plan (v5)

The full plan with the architecture diagram, costs and risks is the doc **Pohnch build plan**: https://claude.ai/artifact/QSiSNBiLTUZdoBrZ2vzvv1. The pilot plan (journeys, features, data, B0–B9 weeks, pilot calendar, budget, risks, ideas) is the doc **Pohnch pilot and build plan**: https://claude.ai/artifact/237T2NHVfSw3a5tvywsnGp. Posters to print: `design/print/Pohnch-posters-print.pdf`. This file is the short version for the repo. The step-by-step prompts are in `BUILD_PROMPTS.md`.

## Three front ends, one backend

```text
 Pohnch (parent app)      Pohnch Driver (driver app)      pohnch.pk (website, admin, later schools)
  iOS + Android             iOS + Android                   Next.js on Vercel
        \                          |                              /
         \______ Supabase: Postgres + PostGIS, Realtime, phone login, Edge Functions ______/
                                   |
                       Expo push (APNs, FCM) · Google Maps
```

How data moves on a trip: the driver taps "start trip" → the driver app sends a position every 5 seconds to an Edge Function → it is saved in `positions` and broadcast on Supabase Realtime → the parent app moves the VanMarker and recalculates the minutes → when the driver taps "picked" (or the van reaches a geofence), an Edge Function saves the event and sends push and Live Activity updates to that child's family only.

## Folder structure

```text
Startup/
├── BRIEF.md, CLAUDE.md
├── design/                     canvas sources, BRAND.md, DECISIONS.md
├── docs/                       this plan, build prompts, accounts, launch links
├── apps/
│   ├── parent/                 Expo app "Pohnch": map, timeline, chutti, family
│   ├── driver/                 Expo app "Pohnch Driver": van setup, trip, taps, offline queue
│   └── web/                    Next.js: pohnch.pk, /i/[token], privacy, /admin
├── packages/
│   ├── ui/                     theme file + the components named in CLAUDE.md
│   ├── core/                   shared types and logic: ETA, trip rules, tap queue, Karachi dates
│   └── messages/               ur.json, en.json
├── supabase/
│   ├── migrations/             SQL: tables, PostGIS, row-level security, 30-day cleanup
│   ├── functions/              Edge Functions: taps, positions, approvals, push, invites
│   └── seed.sql                DEMO van with 6 children
└── tests/                      Maestro flows (apps), Playwright (web); Vitest lives next to code
```

## The stack and its costs

| Piece | Choice | Cost (October 2026, check before paying) |
| --- | --- | --- |
| Phone apps | Expo (React Native), Expo Router, EAS builds | free tier |
| Maps | react-native-maps on the native SDK, brand-styled | native mobile map loads reported free; routing has a monthly free cap |
| Driver location | expo-location background task | free |
| Live Activity, widget | expo-widgets (iOS), ongoing notification (Android) | free |
| Backend | Supabase | free to start, about USD 25 a month on Pro |
| Login | phone number and one-time code | an SMS provider charges per code |
| Push | Expo push | free |
| Website | Next.js on Vercel | free Hobby for the pilot (non-commercial); Pro about USD 20 a month before charging anyone |
| Stores | Apple Developer, Google Play | USD 99 a year, USD 25 once |
| Tests | Vitest, Maestro, Playwright | free |

## Battery and data notes

**Status: estimates. To be measured on a real phone before the soft start (steps below).**

| | Estimate | How it was worked out |
| --- | --- | --- |
| Driver phone, data | about 0.8-1.3 MB per hour of trip | one position every 5 s moving / 30 s stopped, about 1.8 KB per send with headers (most of it the login token); taps are tiny |
| Driver phone, per month | about 40-60 MB | two 45-minute runs a school day; well inside the Rs 500 data top-up |
| Driver phone, battery | goal under 10% per trip | GPS on high accuracy only during the trip, screen mostly on |
| Parent phone, data | about 1 MB per hour with the map open | a small update for every position; nothing when no trip is running |

### Measuring it (one morning, about 1.5 hours)

1. Phone: a cheap Android (the kind most drivers have), battery saver off, Pohnch Driver installed as a development build, signed in as a test driver with a verified test van.
2. Charge to 100%. Settings > Network > Data usage: note Pohnch Driver's number. Close other apps.
3. Start a real trip and drive (or ride along on) a normal school route for 60 minutes. Tap the stops as usual.
4. End the trip. Write down: battery % used, Pohnch Driver's data used, how many positions arrived (admin page: the trip's last position should never be more than 30 s old while moving).
5. Repeat once with the screen off for most of the drive (the phone in a holder, screen timing out).
6. Write the numbers here, replacing the estimates. If battery use is over 10% per trip, lower the moving rate from 5 s to 8 s (`MOVING_EVERY_MS` in packages/core/src/cadence.ts) and measure again.
