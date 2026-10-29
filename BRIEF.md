# Pohnch (پہنچ) — brief (v5, map-first)

> v5 replaces the v1–v4 brief (an installable web app joined through WhatsApp links, Rs 199 a month, a parent "van captain"). The reasons are in `design/DECISIONS.md` round 5. `CLAUDE.md` follows this brief.

## The problem

In Karachi, parents hand their children to a private school van and see nothing until the child is home. They call the driver again and again; drivers can't answer while driving. Drivers, for their part, chase fees every month and fill empty seats by word of mouth. Schools that run their own buses pay for guards and staff to track them by phone.

## What Pohnch is

Careem for school vans: one live van, seen from three sides.

- **Pohnch** (parent app, iOS and Android): the van moving on a map, minutes to your door, a Live Activity on the iPhone lock screen and Dynamic Island, an ongoing notification on Android, a push when your child is picked up, reaches school and is dropped home, and "آج چھٹی" so the driver skips your stop.
- **Pohnch Driver** (driver app, free): today's stops in order, start trip, location shared only while the trip runs, one big tap per child when the van is stopped. Later: seat requests from families nearby and fees collected in the app, paid out on the 5th.
- **pohnch.pk** (website): what Pohnch is, store links, "invite my driver", privacy policy, our admin page; later the Pohnch for Schools desk.

Two honest limits: the map runs on the driver's phone, so there is no GPS box and the map is only as good as the phone's signal; and the map shows where the van is, while the driver's tap (or a geofence near a stop) says whether your child is in it.

## Who is who

| Person | What they do | What they see |
| --- | --- | --- |
| Parent | has the account, adds children, books and pays (later), marks chutti, invites up to 3 family members | only their own children and their own van |
| Child | a profile under a parent: first name, school, stop; no phone, no login | nothing; is seen |
| Driver | drives the van, sets the route and fee, approves families, taps when each child boards | their stops and today's first names |
| Helper (later) | a second adult on board, often a woman; marks boarding, hands over at the gate | the same as the driver, for that trip |
| School (later) | runs its buses on Pohnch or lists partner vans | its buses, riders and gate |
| Pohnch team | verifies drivers, answers help, handles payments and disputes | what a case needs, logged |

The old "captain" is gone: setting up the van is the driver's job (or any parent's "invite my driver"), and approving families is the driver's, after Pohnch verifies the driver.

## Stages

1. **Stage 1, now to March 2027: showcase and pilot, 3–5 real vans.** Both apps and the website; live map, taps, Live Activity, aaj chutti, practice run, help with late reasons. Free during the pilot. **Gate 1:** 80% of trips tracked end to end over 20 school days, and 40% of families keep Pohnch Live after the free month.
2. **Stage 2, 2027: marketplace, 20 to 60 vans.** Find a van on your route (choose a child, home and school, see vans whose route passes nearby), book a seat with a one-week trial, fees paid in the app, request a van (opens at 4 children, Pohnch brings a verified van at 8), ratings, driver profiles, help alert with location. **Gate 2:** 40 paying vans.
3. **Stage 3, 2028: schools and Pohnch Amaan.** Pohnch for Schools (fleet map, boarding register, gate handover, reports). Pohnch Amaan: women drivers and women helpers, its own tab and filter, five checks and training, once a training partner and women staff are in place.

## Pricing (estimates the pilot tests)

| Line | Price | Who pays |
| --- | --- | --- |
| Pohnch Live | Rs 599 per child a month (sibling Rs 299, yearly Rs 5,990, first month free); basic alerts stay free | parent |
| Van fees in the app | 7% of fees paid through Pohnch | driver's side; the fare is not raised |
| Pohnch Routes (request a van) | 12% of fees on routes Pohnch forms | driver's side |
| Pohnch for Schools | Rs 300 per rider a month, billed yearly | school |

One 12-child van at Rs 5,500 a child, with half the families on Live, leaves Pohnch about Rs 7,300 a month; about 37 vans cover Rs 270,000 a month of fixed cost. The pilot offers Live at Rs 499, 599 or 799 and keeps the highest price 40% of families take.

## Stack

Expo (React Native) for both apps, Next.js for the website, Supabase (Postgres with PostGIS, Realtime, phone login, Edge Functions), Expo push, react-native-maps, expo-location, expo-widgets. Details and costs: `docs/PLAN.md`.

## Designs and documents

- Canvas, page "v5 · Map-first app (current)": https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy (sources in `design/canvas/`).
- Build plan, pitch, deck, proposal and launch plan: `docs/LAUNCH.md`.
