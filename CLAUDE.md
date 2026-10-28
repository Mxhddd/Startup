# CLAUDE.md — Pohnch

## What this is

Pohnch (پہنچ, "reached") is an Urdu-first installable web app for school vans in Karachi. Families pay Rs 199 per child per month after a free first month; drivers use it free. A parent "van captain" sets up a van and shares two WhatsApp invite links (driver, parents). The driver taps big buttons when the van is stopped; every parent gets a push notification for each tap that concerns them, and can mark "آج چھٹی" (absent). Full brief: `BRIEF.md`. Designs: `design/DECISIONS.md` and the canvas linked there.

## Version 1 scope

In: captain setup (`/start`) and share screen; invite links `/j/[token]` with httpOnly cookie sessions; parent picks or adds a child and the captain approves the phone; driver Today screen with offline queue, hold-to-confirm on van-wide taps and a 5-second undo on every tap; web push; "Aaj chutti" with Undo until the trip's "left" tap; whole-van day off; admin page `/admin` with tap rate, strikes and Paid ticks (the captain collects Rs 199 outside the app; captain's child free while 5+ families pay); Urdu and English. BRIEF.md items 11 and 13–16 (van management, siblings, practice run, driver help, van badges) and the round 3 items 18–23 (plans and payment, driver reward, driver profile and "find a van", Pohnch Amaan screens, school plan) wait for the builder's go-ahead on the version split.

Out: live GPS or maps (location only in a driver emergency), chat, in-app payments, accounts or passwords, school dashboards, native apps, SMS, the Pohnch Amaan marketplace/operator stages. Ask before adding anything not listed under "In".

## Stack

- Next.js, App Router, TypeScript (strict).
- Supabase Postgres. Row-level security on every table with no public policies; only server code using the secret (service-role) key touches the database. Never create a Supabase client in the browser.
- Web push with the `web-push` library and VAPID keys from environment variables.
- Hand-written service worker at `public/sw.js` (no PWA plugin). No Background Sync: replay queued taps on `online` and on app open.
- Vercel hosting. Vitest for unit tests, Playwright for end-to-end tests.

## Design rules

- Urdu first and right-to-left; English is a switch. All text lives in `src/messages/ur.json` and `src/messages/en.json`; never hard-code text in components.
- Phone layout 360 × 780. Driver tap targets at least 64 px tall; the next expected tap is the only big (104 px) button.
- Brand and tokens: `design/BRAND.md` (v3 "Neel o Kesar": ghee ground, neel primary, kesar accent, eight-point star mark, sona gold for decoration only). The canvas page "v3 · Neel o Kesar (current)" is the reference; v2 and v1 pages are history.
- Driver screens are plain (no pattern or frames); parent, captain and Amaan screens use the star pattern and ornamental frames.
- Each step has its own colour and icon: left neel, picked zamurrad, reached school kesar with siyahi text, left school shingarf, dropped pista with siyahi text.
- No text under 14 px, no thin grey text, contrast at least 4.5:1.
- Gulzar for display only (≥26 px, brand moments), Noto Sans Arabic for Urdu UI text (line-height about 1.6), Manrope for Latin and all digits; Western digits for times and prices.
- Voice: آپ, say who did it, calm, fewest words.
- Gender-neutral wording; never store a child's gender. Children are first names only.
- Every screen has empty, loading, offline and error states (see the A5 page of the canvas).
- Theme values come from one theme file; don't scatter hex codes.

## Component names (same as the designs)

TapButton (with hold behaviour), ChildRow, AbsentChip, OfflineBanner, TripHeader, RouteDots, TimelineEvent, ShareLinkCard, UndoBar, HelpSheet, VanBadge, ApprovalCard, PlanCard, PriceRow, ReliabilityScore, DriverProfile, AmaanSeal, SafeHomeCheck. Keep these names for the React components and their files.

## Data and security rules

- Invite tokens: 32 random bytes, base64url; store only the SHA-256 hash. Tokens may appear only in `/j/[token]` URLs, never in logs, other URLs, or client bundles.
- No secret, token or child's name in logs.
- Dates for trips are in Asia/Karachi.
- Every tap has a client-generated `client_id`; the server ignores duplicates.
- Location is optional; ask once, never again if refused. `lat`/`lng` are cleared after 30 days.

## Working rules

- Never commit secrets. `.env*` files are git-ignored; keep `.env.example` up to date with names only.
- Every feature gets a test (unit with Vitest, end-to-end with Playwright where it crosses screens).
- Run the tests and the build before saying a step is done.
- Explain changes in plain language: the builder is a student learning as they build. Say what each new file is for and how data moves through it.
- One build prompt (B0–B9 in `docs/BUILD_PROMPTS.md`) at a time; show a plan first and wait for a go-ahead.
