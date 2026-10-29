# Build prompts (v5: native apps)

Ten steps take Pohnch from an empty repo to 3–5 real vans in a pilot, in about 12–16 weeks of part-time work. Paste one prompt at a time into Claude Code. Each step starts with a plan you approve, ends with passing tests and a build, and is saved to GitHub.

The earlier web-app prompts (WhatsApp links, a captain, Rs 199) are kept in `archive/BUILD_PROMPTS_v1_web.md` for history; the security rules and tests carry over.

## How to use these prompts

1. Open Claude Code in this repo (on your laptop or at claude.ai/code).
2. Paste one prompt. Claude Code shows a plan: read it, ask about anything you don't understand, then say go.
3. When the step is done, try the "After it, you can" line yourself on your phone. Only then move on.
4. Replace anything in \[square brackets\] before pasting.

| Step | What gets built | After it, you can |
| --- | --- | --- |
| B0 | accounts and keys | sign in everywhere the build needs |
| B1 | the repo: two Expo apps, the website, shared packages, test tools | open both apps on your phone |
| B2 | the design system in code | flip through every component in a gallery screen |
| B3 | database, security rules, phone login | log in as a parent and a driver on two phones |
| B4 | driver app: trip, location, taps, offline | drive a test route and watch the data arrive |
| B5 | parent app: live map, ETA, timeline, chutti | watch the van move on a second phone |
| B6 | alerts: push, geofences, Live Activity, widget | see the van's minutes on your lock screen |
| B7 | website and admin | send a link to a real driver and approve them |
| B8 | hardening | trust it with real children |
| B9 | release and pilot | real families use it every school day |

## B0. Accounts and keys

```text
Read CLAUDE.md, BRIEF.md, design/DECISIONS.md (round 5), design/BRAND.md and docs/PLAN.md. Don't write code yet.

Make docs/ACCOUNTS.md current for the v5 stack: for each account (Expo, Supabase, Google Maps Platform, Apple Developer, Google Play Console, Vercel, an SMS provider for login codes) give what it is for, its cost today, which step first needs it, and the exact sign-up steps. Then list every environment variable by name only in .env.example, and say which ones may reach an app bundle (only public keys) and which must stay in Supabase Edge Function secrets.

Check the current free limits and prices on each vendor's own page and write the date you checked.
```

## B1. The repo

```text
Set up the monorepo described in docs/PLAN.md:
- pnpm workspaces; apps/parent and apps/driver (Expo, Expo Router, TypeScript strict), apps/web (Next.js App Router), packages/ui, packages/core, packages/messages, supabase/.
- Fonts (Noto Sans Arabic, Manrope, Gulzar) loaded in both apps; right-to-left layout by default with an English switch; all text from packages/messages/ur.json and en.json.
- The theme file in packages/ui with every token from design/BRAND.md, including the map style.
- App icons and splash: the star and dot on neel (design/BRAND.md, Logo).
- Vitest in packages/core with one passing test; Maestro with one flow that opens each app; Playwright with one test for the website.
- A development build profile for EAS so both apps run on a real phone.

After it I should be able to open both apps on my phone and see the Pohnch splash, then an empty brand-styled map (parent) and an empty Today screen (driver), in Urdu and English.
```

## B2. The design system

```text
Build the components named in CLAUDE.md in packages/ui, matching the canvas page "v5 · Map-first app (current)" (sources in design/canvas/Z*.dc.html): MapSheet, VanMarker (smooth movement between positions, a heading arrow, a grey "last seen" state), StopPin, EtaPill, TripHeader, TapButton (hold to confirm, sizes next 104 px and later 64 px), ChildRow, AbsentChip, OfflineBanner, RouteDots, TimelineEvent, UndoBar, HelpSheet, VanBadge, ApprovalCard, InviteCard, PlanCard, PriceRow, VanCard.

Add a hidden gallery screen to each app that shows every component in every state, in Urdu and English. Unit-test the TapButton hold and the UndoBar timer.
```

## B3. Database and login

```text
Write Supabase migrations for: families, family_members, children (first name, school, stop; no gender), drivers (with a verified flag), vans, stops (PostGIS points, order), van_members (family, child, status pending/approved), trips (morning/afternoon, Asia/Karachi date), events (step, child, client_id unique), positions (van, trip, point, speed, heading, time), absences, day_offs, invites (token hash only), push_tokens.

Row-level security on every table, following CLAUDE.md: no anonymous access; a parent reads only their own children and their approved van's trips and positions; a driver reads only their own van. Writes for taps, approvals and trips go through Edge Functions that check the role. Add a database test that proves a parent of van A can't read van B.

Phone login with a one-time code (Supabase Auth). After login a person chooses "I'm a parent" (parent app) or registers as a driver (driver app, then waits for verification). Add a DEMO seed: one van, one driver, 6 children in 4 families, two of them siblings.
```

## B4. Driver app

```text
Build the driver app screens from ZD-Today and ZD-Trip:
- Set up the van: name, school, morning and afternoon times, stops placed on the map in order; accept a parent's "invite my driver"; approve or decline families (ApprovalCard).
- Today: the trip list, absent children pinned at the top, whole-van day off, a practice run before the first real trip.
- Start trip: expo-location background task (Android foreground service with a visible notification), a position every 5 s while moving and 30 s when stopped, sent in small batches; stops completely when the trip ends.
- Taps: left, picked (siblings at one stop in one tap), reached school, left school, dropped; hold to confirm on van-wide taps; 5-second undo on every tap; each tap has a client_id and the server ignores duplicates.
- Offline: taps and positions queue on the phone and send when signal returns; the OfflineBanner shows the count.
- Help: late reasons (traffic, breakdown, road closed) that tell the van's families, plus 15 and 1122 dial buttons.

Test the queue and the duplicate rule with Vitest and the whole morning trip with a Maestro flow.
```

## B5. Parent app

```text
Build the parent app screens from ZP-Home and ZP-Live:
- Add a child (first name, school, stop placed by hand on the map; never the phone's location), join a van from the driver's invite, or send "invite my driver" (a share sheet with a pohnch.pk/i/[token] link).
- Home: the brand-styled map, the route, your stop and the school, the VanMarker following positions from Supabase Realtime, the EtaPill with minutes to your stop, and the bottom sheet with today's TimelineEvents.
- When the signal drops, the marker turns grey with "last seen 40 s ago".
- Aaj chutti: today or tomorrow, morning, afternoon or both; Undo until that trip's "left" tap.
- Family members: invite up to 3 more phones to see the same child.

Unit-test the ETA calculation and the chutti cut-off; a Maestro flow for adding a child and marking chutti.
```

## B6. Alerts and the lock screen

```text
Build alerts:
- Expo push for each step that concerns a family, Urdu first, saying who did it ("رفیق بھائی نے مارک کیا · 7:12"); delete dead push tokens.
- Geofences: an automatic "arriving" when the van is about 300 m from your stop and "at school" near the school, shown as automatic, not as a driver tap.
- iPhone: a Live Activity with Dynamic Island (expo-widgets), started when the trip starts and updated by push with the minutes and the step; ended after the drop-off.
- Android: an ongoing progress notification with the same minutes.
- A home-screen widget on both: the next step and the minutes.

Follow ZP-Lock on the canvas. Test who gets which message with Vitest.
```

## B7. Website and admin

```text
Build apps/web from ZW-Web: the pohnch.pk landing page (Urdu and English), store links, the /i/[token] invite page that opens the right app or the store, and the privacy policy page (what we collect, why, for how long; plain words).

Add /admin for the Pohnch team only: the driver check queue (CNIC, licence, van papers, approve or reject), switch off a van, and the 4 pilot numbers: trips tracked end to end (a trip counts when "left", a "picked" for every child not on chutti and "reached school" all arrived, with positions throughout), families active, alerts delivered, families on Live. Unit-test the trips-tracked calculation.
```

## B8. Hardening

```text
Harden everything before real children use it:
- Location only during trips; positions deleted after 30 days by a scheduled job; a test that proves it.
- No token, phone number, secret or child's name in logs or bundles (add a check script).
- Rate limits on login codes and Edge Functions.
- Battery and data: measure an hour of trip on a cheap Android phone and write the numbers in docs/PLAN.md.
- Every screen's empty, loading, offline and error state.
- An automated full school day: morning trip, one chutti, one undo, afternoon trip, across both apps.
```

## B9. Release and pilot

```text
Prepare the release:
- EAS production builds for both apps; TestFlight for the iPhone and Play internal testing for Android.
- Store listings in Urdu and English, screenshots from the canvas, the background-location reason for the driver app, and a short demo video for the App Store reviewer.
- A pilot kit in docs/PILOT.md: how to install, the practice run with each driver, what to check every evening on /admin, and how to switch a van off.
- Re-check every vendor price and limit, and the cost of the first month for 5 vans.
```

## Checks after each step

- Tests, the type check and the build pass (Claude Code shows the output).
- You tried the "After it, you can" line on a real phone.
- `git status` is clean after the commit, and no `.env` file was committed.
