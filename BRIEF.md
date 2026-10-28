# Pohnch (پہنچ) — brief

> Drafted from `docs/BUILD_PROMPTS.md` and the phase A designs, because there was no separate "Final brief" export. Edit it if anything here is wrong; `CLAUDE.md` follows it.

## The problem

In Karachi, parents hand their children to a private school van and see nothing until the child is home. Drivers don't have time to message every family, and parents worry.

## What Pohnch is

An Urdu-first web app (installable on the home screen) for one school van at a time. Families pay a small fee per child; drivers use it free and earn a reward for tapping:

- A parent **van captain** sets up the van with three fields and gets two invite links to share on WhatsApp: one for the driver, one for the other parents.
- The **driver** taps big buttons only when the van is stopped: "نکل گئے" (left), one tap per child picked up, "اسکول پہنچ گئے" (reached school); in the afternoon "اسکول سے نکلے" (left school) and one tap per child dropped home.
- Every **parent** gets a push notification for each tap that concerns them, and can mark "آج چھٹی" (absent) for today or tomorrow, morning, afternoon or both, so the driver skips that stop.
- An **admin page** (only for the builder) shows whether each van is actually used.

## Users

- **Drivers**: cheap Android phones, bright sunlight, some read slowly. One main action per screen, buttons at least 64 px tall, each step with its own colour and icon.
- **Parents**: busy and worried. They need a calm, trustworthy family utility, not a flashy startup.
- **Van captain**: one parent per van who sets it up and shares links.
- **Admin**: the builder, on a laptop.

## Version 1 scope

1. Captain setup at `/start` (driver's first name, school name, morning pickup time) and a share screen with two WhatsApp links.
2. Login-free access through invite links `/j/[token]`; tokens are 32 random bytes, only their SHA-256 hash is stored; links can be switched off.
3. Parents pick their child's first name or add a new one.
4. Driver Today screen with offline tap queue (IndexedDB), optional location at tap time, absent children greyed out.
5. Web push to parents (VAPID, `web-push` library), Urdu first, each message ending "ڈرائیور نے مارک کیا" (marked by the driver).
6. "Aaj chutti" with Undo until that trip's "left" tap.
7. Admin page at `/admin` protected by `ADMIN_TOKEN`: tap rate over the last 10 school days, parents joined, notifications delivered and failed, chutti taps, Paid ticks per family per month, vans under 80% flagged, switch off any link.
8. Urdu (default, right-to-left) and English.

### Added after the design review (round 2)

9. Captain approves every new parent phone; parents say who they are (amma, abbu, grandparent, other).
10. Mistaken taps: a 1-second hold on van-wide buttons, a 5-second undo on every tap, and undone taps counted as strikes for the captain and admin (no automatic action).
11. Captain van management: rename, morning and afternoon times, stop order, switch off links, fee status, optional captain phone, van badges.
12. Whole-van day off (holidays), shown to driver and parents.
13. Parents with two or more children, in one or several vans.
14. Driver practice run before the first real trip.
15. Driver help: "I'm stuck" (late alert to captain and parents) and "Emergency" (captain gets location), plus 15 and 1122.
16. Van badges for the Pohnch Amaan line: ڈرائیور صاحبہ (woman driver), امان ساتھی (woman companion), صرف بچیاں (girls only).
17. Paid from day one: Rs 199 per child per month after a free first month, collected by the captain outside the app; the admin ticks Paid.

### Added in round 3 (pricing and refinements)

18. Plans: Rs 199 per child per month (school months only), yearly Rs 1,990 (12 months for 10), siblings Rs 99, no charge in June and July, first month free.
19. Captain's child free while the van has 5 or more paying families.
20. Driver reward: Rs 40 per paying child per month when the month's tap rate is 90% or more, paid by JazzCash, Easypaisa or Raast.
21. Public driver profile and "find a van": areas, schools, free seats, reliability score (on-time taps over 30 days). Never a child's name, phone number or token.
22. Pohnch Amaan screens: apply (driver, companion, mother-driver), five-check verification, Amaan van listing, captain safety log with "میں گھر پہنچ گئی" check-ins.
23. School plan: Rs 149 per child billed yearly to the school (later stage, after about 30 vans).

Payment methods for 18: Raast QR, JazzCash, Easypaisa, or cash to the captain. Reasons, the cost model and sources are in `design/DECISIONS.md` (round 3).

Items 9–23 make version 1 noticeably bigger. Suggested split: 9, 10, 12, 17 and 19 in version 1; 11, 13–16, 18 and 20 in version 1.1 after the first pilot weeks; 21–23 later. Decide before B2, because they change the database.

## Out of scope for version 1

Live GPS tracking or maps (location is sent only in an emergency), in-app chat, payments inside the app (version 1.1), accounts or passwords, school-side dashboards, native app-store apps, SMS fallback, the Pohnch Amaan marketplace and operator stages.

## Brand

`design/BRAND.md` (v3 "Neel o Kesar"): name, slogan "فکر کم، خبر پوری", eight-point star mark, colours, type, craft kit, voice and the Pohnch Amaan sub-brand.

## Stack

Next.js (App Router, TypeScript), Supabase (Postgres, row-level security on, only server code with the service key reads or writes), web push with `web-push`, hand-written service worker, hosted on Vercel. Vitest for unit tests, Playwright for end-to-end tests.

## Success measure for the pilot

Driver tap rate of at least 80% over 10 school days (a school day counts when the morning "left", a "picked" for every child not on chutti, and "reached school" all arrived), and every alert reaching parents within seconds.

## Designs

The phase A canvas: https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy (sources in `design/canvas/`, decisions in `design/DECISIONS.md`).
