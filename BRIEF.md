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

1. **Stage 1, now to March 2027: showcase and pilot, 3–5 real vans.** Both apps and the website; live map, taps, Live Activity, aaj chutti, practice run, help with late reasons. Drivers free; pilot families pay a founding price (Rs 199 a month), recorded by the team until in-app payment exists. **Gate 1:** 80% of trips tracked end to end over 20 school days, and 30% of families paying after their first month.
2. **Stage 2, 2027: marketplace, 20 to 60 vans.** Find a van on your route (choose a child, home and school, see vans whose route passes nearby), book a seat with a one-week trial, fees paid in the app, request a van (opens at 4 children, Pohnch brings a verified van at 8), ratings, driver profiles, help alert with location. **Gate 2:** 40 vans on Pohnch Collect.
3. **Stage 3, 2028: schools and Pohnch Amaan.** Pohnch for Schools (fleet map, boarding register, gate handover, reports). Pohnch Amaan: women drivers and women helpers, its own tab and filter, five checks and training, once a training partner and women staff are in place.

## Pricing v2 (November 2026; the pilot tests the monthly price)

The rule: **nothing is free for families, not even for a month** (free months get used and dropped). The first month is discounted, never Rs 0. **Drivers never pay.** Alerts are the product, so they are what families pay for.

| Line | Price | Who pays |
| --- | --- | --- |
| Pohnch Plus | Rs 349 per child a month; each brother or sister Rs 199; school term (5 months) Rs 1,499; year Rs 2,999. **First month Rs 99**, once per phone number and once per seat (child + van + stop). Pilot vans' founding families: Rs 199 a month, kept for 12 months. **No free tier:** without Plus a family gets no alerts, no live van and no Live Activity | parent |
| Driver bonus | Rs 40 a month for each child on Plus, in months when the van tracks 80% of its trips | paid **to** the driver by Pohnch |
| Pohnch Collect (van fees in the app) | 5% at launch; 7% with "guaranteed by the 5th" (Pohnch carries late payers) | driver's side; the fare is not raised |
| Pohnch Routes (vans Pohnch fills) | 12% for each family Pohnch brought, for 12 months | driver's side |
| Pohnch for Schools | Rs 200 per rider a month, billed per term; Plus included for every family in the school's vans | school |

Per 12-child van (fee Rs 6,000, Play's fee about 15%, the bonus and SMS about Rs 45 per paying child): Plus alone nets about Rs 756 a month at 30% of children paying and Rs 1,260 at 50%; with Collect at 5% on 30% of fees, about Rs 2,081; at 7% on 60% of fees, about Rs 3,766. Lean running costs (Rs 40,000 a month) need 19 to 53 vans; a small team (Rs 270,000) needs 72 to 357. One school of 300 riders adds about Rs 58,000 a month. Plus proves families pay and brings drivers in; Collect and schools are the business. The pilot tests Rs 249, 349 or 449 **by van** (never two prices in one van) and keeps the highest where 30% of families still pay after the first month. The full plan with the numbers: `docs/PRICING.md`.

## Stack

Expo (React Native) for both apps, Next.js for the website, Supabase (Postgres with PostGIS, Realtime, phone login, Edge Functions), Expo push, react-native-maps, expo-location, expo-widgets. Details and costs: `docs/PLAN.md`.

## Designs and documents

- Canvas, page "v5 · Map-first app (current)": https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy (sources in `design/canvas/`).
- Build plan, pitch, deck, proposal and launch plan: `docs/LAUNCH.md`.
