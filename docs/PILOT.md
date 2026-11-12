# Pilot kit

Everything for running the pilot day to day: installing, the first practice run with each driver, your evening checks, switching a van off, and what to do if something goes wrong. The plan and calendar are in the doc "Pohnch pilot and build plan" (link in `docs/PLAN.md`).

## What is live

| Part | Where | Notes |
| --- | --- | --- |
| Backend (database, security rules, server functions) | Supabase project **Pohonch** (`vsyunieszswpreogzolx`, Frankfurt) | All 9 migrations, both Edge Functions, scheduled jobs (30-day cleanup, stuck trips) |
| Phone login | Supabase Auth, codes through our `send-sms` function | No SMS gateway yet: only test numbers can log in (below) |
| Parent app | Expo project `@pohonch/pohonch` | Android install link from each build |
| Driver app | Expo project `@pohonch/pohnch-driver` | Android install link from each build |
| Maps | OpenFreeMap (free, no key) through MapLibre | Attribution shown on the map; consider a donation once the pilot runs |
| Website and admin page | not deployed yet | needs a Vercel account (docs/DEV.md, B7) |

### Test logins (valid until 30 June 2027; the code lives only in Play Console > App content > App access, not in this repo)

| Number | Use it as |
| --- | --- |
| 0300 0000001 | a driver: log in to the driver app and set up a van from scratch |
| 0300 0000002 | a parent: log in to the parent app, add a child, open the driver's link |

Both start empty (3 November 2026: the earlier demo van and child were deleted), so everything you see is what you made through the real screens. To try a whole trip: set up the van as 0300 0000001, share its link, join as 0300 0000002, approve, then mark the van verified (below).

Test numbers have a fixed code, so they must never be a team admin and must be removed before real families join (Supabase > Authentication > Sign In / Providers > Phone > test numbers). Their code is never written in this repo: give it only to Google Play's reviewers (Play Console > App content > App access), and change it if it leaks.

**Your own admin login (until an SMS gateway is connected):** in the same place, add your own number with a **random** 6-digit code only you know. Since v20 the team page also asks for a code from an authenticator app (Google Authenticator or similar) every time, and the database refuses team data without it, so this fixed code alone opens nothing. The first time you open pohnch.pk/admin it shows a QR code: scan it with the app. Log in once in the parent app, then in Supabase > SQL editor run:

```sql
insert into admins select id from auth.users where phone = '92300XXXXXXX';
```

## Installing

**Drivers (Android):** send the driver app's install link on WhatsApp. On the phone: open the link > Download > open the file > allow "install unknown apps" for the browser when asked > Install. Then open Pohnch Driver, choose Urdu, log in.

**Parents (Android):** the same with the parent app's link. iPhone parents need TestFlight (Apple Developer account) and are added later.

When a new build comes out, the same steps install it over the old one; nothing is lost.

## The first visit to a driver (about 30 minutes, at pick-up or home time)

1. Install the driver app together; log in with their number.
2. Van: name ("Rafiq bhai ki van"), school, plate.
3. Stops: walk through the route together and tap each stop on the map in order; rename them ("Block 13 gate").
4. Check papers: CNIC, licence, van registration. Then mark the van verified (admin page, or in Supabase SQL: `update vans set verified_at = now() where id = '...'`).
5. **Practice run** (Today > Practice): pretend children, nothing is sent. Let the driver tap every stop, undo once, and hold "reached school". Repeat until it feels easy.
6. Families: tap "Share link" and send it to the van's WhatsApp group. Approve each family as requests come in, picking their stop.
7. The first real trip the next morning: you ride along if you can, or watch the admin page.

## Every school day

| When | What |
| --- | --- |
| 6:45-8:15 | Admin page > Today's trips. A van that should be running isn't? Call the driver. "Last position" over a minute while running? Their signal or location is off; call. |
| 13:15-14:30 | The same for the afternoon. |
| Evening | Admin page numbers: trips tracked end to end (goal 80%), families with alerts on (goal 40%), alerts not delivered. Write the numbers in the pilot sheet. |
| Evening | Driver checks queue: new drivers to visit. |

## Switching a van off, ending a stuck trip

- **Stuck trip** (driver's phone died, trip still "running"): admin page > Today's trips > End trip. It also ends itself after 3 hours with no news, and never blocks the next day.
- **Switch a van off** (a safety concern, a complaint, a driver who left): admin page > All vans > Switch off. Families stop seeing the van at once, its running trip ends, and no pushes go out. Switch on again the same way.
- **A family leaves**: they can take their child off the van (parent app > Menu), or the driver can remove them (Families > Remove, hold to confirm).
- **Delete an account** (promised within 7 days): people now do it themselves in the app (parents: Menu > Delete my account; drivers: Today > Help and account). If someone asks you instead: Supabase > Authentication > Users > the number > Delete. A driver whose van still has families is asked to remove them first; to hand a van to another driver, change `vans.driver_id` in the Table editor.

## If something goes wrong

1. Is a child safe? That always comes first: call the driver, then the family. For emergencies the driver's Help button dials 15 and 1122.
2. App problem during a trip: tell the driver to keep driving and tap when stopped; taps wait on the phone without signal and send later.
3. Write down what happened (time, van, what the app showed) the same day. Don't write children's names in notes or chats about bugs: use "child at stop 2".

## The first month for 5 vans (checked 3 November 2026)

| Item | Cost | Notes |
| --- | --- | --- |
| Supabase | USD 0 (free) or USD 25 | Free is enough for 5 vans (about 160,000 positions a month, deleted after 30 days); Pro (USD 25) adds daily backups and no pausing; take Pro before real children. |
| Expo builds and push | USD 0 | Free plan: 15 Android builds a month, pushes free |
| Maps | USD 0 | OpenFreeMap; a donation is fair once it's in daily use |
| Login SMS | about USD 10-60 | about 120 codes in the first month; Twilio is about USD 0.52 each to Pakistan, a local gateway much less |
| Drivers' data top-ups | Rs 2,500 | Rs 500 each (the app uses about 40-60 MB a month; estimate until measured) |
| Website (Vercel Hobby) | USD 0 | while the pilot is free |
| Domain pohnch.pk | yearly fee | PKNIC |
| Apple Developer | USD 99 a year | only for iPhone parents |

**Total, Android-only pilot:** about USD 35-85 plus Rs 2,500 (roughly Rs 12,000-26,000 at about Rs 280 to the dollar), most of it SMS and Supabase Pro.

Sources: [Supabase pricing](https://supabase.com/pricing), [Expo plans](https://docs.expo.dev/billing/plans/), [Twilio SMS to Pakistan](https://www.twilio.com/en-us/sms/pricing/pk), [OpenFreeMap](https://openfreemap.org).
