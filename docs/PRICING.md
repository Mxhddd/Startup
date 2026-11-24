# Pohnch pricing v2: Pohnch Plus, nothing free for families

Decided November 2026; replaces "Pohnch Live, Rs 599, first month free, basic alerts free" (BRIEF.md round 5). Built in `packages/core/src/plans.ts`, `supabase/migrations/20261118000100_plans_v2.sql` (tests: `supabase/tests/database/193-plans.test.sql`), `packages/client/src/plans.ts`, the parent Plans screen and home card, the driver's families screen, and the admin Money panel.

**What is built and what is left**
- Built: the plan rules, prices and tests; the `billing` switch (everyone or one van); the server gate (no pushes, Live Activities or van data for unpaid children while billing is on); the Rs 99 first month once per phone and per seat (hashes only); the team's form to record payments taken outside the app; the driver's bonus and "not on Pohnch" mark; the money numbers.
- Left (needs you first): register the company (SECP), NTN, bank account, Play Console payments profile; then Play Billing in the parent app (`expo-iap`) and a `billing` Edge Function that verifies purchases and calls `billing_record_payment`. Until then, keep `billing` off, or switch it on for one pilot van and record founding payments by hand.

## Launch price (24 Nov 2026): Rs 199 for founding families

The pilot schools' families (Beaconhouse PECHS first) and everyone at launch pay the **founding price: Rs 199 a month per child, locked for 12 months; brothers and sisters Rs 99**. The first month is the same Rs 199 (subsidised, never free). Set it per van on the admin Money panel (`founding` plan); the normal price stays Rs 349.

What one child costs us each month, and what Rs 199 leaves:

| | Rs a month |
|---|---|
| Login SMS (local gateway, about 2 codes) | about 5 |
| Push, maps (Expo, OpenFreeMap) | 0 |
| Driver bonus (only when 80% of trips are tracked) | 40 |
| Payment fee (JazzCash/Easypaisa by hand, about 2%) | 4 |
| **Left from Rs 199** | **about 145** |

Fixed costs are about Rs 14,000 a month (Supabase Pro about Rs 7,000, Vercel about Rs 5,600, SMS minimum and domain about Rs 1,500), so about **95 paying children** cover them. 50 Beaconhouse families with about 60 children bring about Rs 8,700 a month.

| Price | Left per child | Children to cover fixed costs |
|---|---|---|
| Rs 99 | about 47 | about 300 |
| **Rs 199** | **about 145** | **about 95** |
| Rs 249 | about 194 | about 70 |
| Rs 349 (Play Billing, 15% fee) | about 247 | about 57 |

## Context

The current model (`BRIEF.md`, and the stage 2 code in `supabase/migrations/20261104000400_stage2.sql` plus `apps/parent/src/app/plans.tsx`) works like this:
- every step alert is free forever;
- the live map ("Pohnch Live") costs Rs 599, with a **free first month** (`live_entitlements`, `start_live_trial()`);
- 7% of van fees, and 12% on routes Pohnch forms.

You found two holes in it:

1. **Notifications are the product, not the map.** If "got in", "5 min away" and "reached school" are free, almost nobody pays to watch a moving dot. The paywall sits on the least-needed feature.
2. **A free month gets exploited.** People sign up, use it and leave, or re-register on another number.

**Rule for this plan:**
- Every family pays something from day one. Discounts are fine; zero is not.
- Drivers stay free, because a van without its driver on Pohnch earns nothing.

Section 6 is what was built (Nov 2026) and what is left.

---

## 1. Parents: one paid plan, nothing free

**No free tier.** A parent who hasn't paid can only:
- sign in;
- add a child;
- ask to join the van, or send "invite my driver";
- see the plan screen.

Every alert, the map, chutti and family phones turn on only once the family has paid at least the Rs 99 intro.

| **Pohnch Plus** includes |
|---|
| Every alert: "5 min away, get ready", "picked up", "reached school", "left school", "dropped home", late warning with the reason |
| Live map, ETA, Live Activity, widget, Android ongoing notification |
| Aaj chutti (tells the driver), planned days off |
| Up to 3 more family phones |
| History, replay, voice ETA |

**What the driver sees for a family that hasn't paid:**
- the child stays on the list, so the driver still taps;
- the child carries a small "not on Pohnch" mark;
- the driver's tap sends nothing to that family.

That gives the driver a reason to tell families "Rs 99 laga ke dekh lo", backed by the bonus in section 2.

The 15 and 1122 numbers on the help sheet are public emergency numbers, not a Pohnch feature, so they stay visible to everyone.

**Prices**

| Plan | Price |
|---|---|
| Plus, monthly | **Rs 349 per child** |
| Each extra child (siblings) | **Rs 199** |
| School term (5 months) | **Rs 1,499**, about Rs 300 a month (cuts holiday churn) |
| Year | **Rs 2,999**, about Rs 250 a month |
| **Intro month** | **Rs 99, paid, never Rs 0.** Once per phone number, per child-and-van, and per Google account |
| **Founding families** (the 5 pilot vans) | **Rs 199 a month, locked for 12 months**, paid from day one |

**Pilot price test:**
- Try Rs 249, 349 and 449 **by van, not by family**, so neighbours in one van never see different prices.
- Keep the highest price at which **30% or more** of families stay paid after the intro month.

**How the intro month is protected from abuse:**
- **It costs Rs 99.** Every throwaway account costs the abuser money.
- **The server keeps three kinds of `intro_claims`:**
  - a SHA-256 hash of the phone number;
  - a hash of the child's first name, van and stop;
  - the Google account, which Play Billing already limits to one intro offer.
  
  If any of them has been used before, the full price applies. Only hashes are stored, never the number (CLAUDE.md rule).
- **Family sharing is capped** at 3 linked phones, added and removed by the owner.
- **No new intro after reinstalling or deleting the account,** because the hashes stay.
- **Failed renewal:** 3 days of grace, then alerts stop until the family pays again. Nothing is deleted.

## 2. Drivers: free always, and paid to bring families

- **Pohnch Driver stays free.**
- **Driver bonus: Rs 40 a month for each child on Plus in their van,** paid on the 5th by JazzCash or Easypaisa.
  - It is paid only in months when the van tracked **80% or more** of its trips end to end.
  - Every driver becomes a salesperson ("Bhai, Plus le lo").
  - Tracking quality (gate 1) is exactly what the driver gets paid for.

## 3. Fees through the app ("Pohnch Collect", stage 2)

Your 7–8% standard and 12% on new routes is the right shape. The catch: at 7% a driver gives up Rs 420 on a Rs 6,000 child, more than Plus earns. Drivers accept that only if Collect clearly beats cash.

| | Rate (driver side; fare not raised) | What the driver gets |
|---|---|---|
| Collect, at launch | **5%** | Parents pay by JazzCash, Easypaisa or card; automatic reminders; no chasing; paid on the 5th |
| Collect Guaranteed | **7%** | Also paid on the 5th **even if a family pays late**: Pohnch carries the risk. Turn on once there is cash to cover it |
| Pohnch Routes (families Pohnch brought) | **12% for each such family's first 12 months**, then the van's normal rate | Pohnch filled the seats |

Wallet and card costs (about 1–1.5%) come out of these percentages.

## 4. Schools ("Pohnch for Schools", stage 3)

- **Rs 200 per rider a month, billed per term.** Every family in that school's vans gets **Plus included**.
- **One school with 300 riders is about Rs 58,000 a month.** That alone covers lean running costs, and schools are the strongest way to get drivers on board.

## 5. Never

- No ads.
- No selling data.
- No free trials, and no free tier for families.

---

## The numbers (per 12-child van, average fee Rs 6,000)

**Assumptions:**
- Plus brings in about Rs 300 per paying child after sibling and term discounts.
- Google Play takes about 15% on subscriptions. That's the usual rate; confirm Pakistan's rate in Play Console.
- The driver bonus plus SMS and data cost about Rs 45 per paying child.
- Wallet fees are 1.2%.

| Scenario | Net per van a month | Vans to cover lean costs (Rs 40k/mo, founders unpaid) | Vans to cover a small team (Rs 270k/mo, `BRIEF.md`) | Monthly at 300 vans |
|---|---|---|---|---|
| Plus only, 30% of children pay | Rs 756 | 53 | 357 | Rs 227k |
| Plus only, 50% pay | Rs 1,260 | 32 | 214 | Rs 378k |
| Plus 50% + Collect 5% on 30% of fees | Rs 2,081 | 19 | 130 | Rs 624k |
| Plus 50% + Collect 7% on 60% of fees | Rs 3,766 | 11 | 72 | Rs 1.13M |
| Each school (300 riders) | +Rs 58k a month | | | |

**What the numbers say:**
- **Plus alone is a thin business.** Its jobs are to prove that families pay and to get drivers onto the app.
- **With nothing free, fewer families join each van at first.** That's why the driver bonus matters: the driver is the one who persuades families to pay the Rs 99. Pilot target: 30% of children paying after the intro month.
- **The money is in Collect and schools.** So the order is Plus, then Collect, then Schools.
- **The intro month nets about Rs 39** after Play's fee and the driver bonus. It never loses money, which is the point.
- **The pilot (5 vans at Rs 199) brings in about Rs 3–6k a month.** Its job is to measure willingness to pay, not to earn.

**New gates.** These replace "40% keep Live after the free month":
- **Gate 1:** 80% of trips tracked end to end, **and 30% of families paying after the intro month.**
- **Gate 2:** 40 vans on Collect.

---

## 6. App edit list (in order)

### 0. Before any money moves (not code)

- Register the company with SECP and get an NTN.
- Open a business bank account.
- Set up the Play Console payments profile.
- Get a JazzCash or Easypaisa merchant account for driver payouts.

The stage 2 migration already notes this.

### 1. Shared logic: `packages/core/src/plans.ts` (new) plus `plans.test.ts`

- the prices;
- `featuresFor(plan)`: `none` gives nothing beyond join and plans; `plus` gives everything;
- `introAllowed(claims)`;
- the grace-period logic.

Export it from `packages/core/src/index.ts`.

### 2. Database: `supabase/migrations/<date>_plans_v2.sql` (new)

**New tables, with RLS on each:**
- `subscriptions`: family, child, plan, status `intro|active|grace|ended`, source `play|school|founding|manual`, renews_at;
- `intro_claims`: hashed phone, hashed child+van+stop;
- `driver_bonus`: van, month, paying_children, tracked_pct, amount, paid_at. Its tracked % reuses `private.trip_tracked()` and `private.van_reliability()` from the stage 2 migration;
- `school_plans`.

**Drop** `live_entitlements` and `start_live_trial()`.

**Add a new flag** `app_flags.billing`, separate from `stage2`. The existing pattern is `private.need_stage2()`; add a `need_billing()` that works the same way.

**Add SQL tests** in `supabase/tests/database/` for RLS and the intro rules.

### 3. Server

**New Edge Function `supabase/functions/billing/`:**
- receives Google Play's real-time developer notifications;
- checks every purchase token with the Play Developer API before setting `active`;
- keeps the service-account key only in function secrets.

**Push sending:** before each step push, check the child's plan.
- A family that hasn't paid gets no pushes at all.
- The Live Activity and the Android ongoing notification start only for Plus.

Find the push sender with: `grep -rn "push" supabase/functions/app`.

### 4. Parent app

- **`apps/parent/src/app/plans.tsx`:** rewrite it as one Plus card with monthly, term and year options. Keep the `Plan` card component. Use "Rs 99 for your first month" and remove "Start the free month".
- **Play Billing:** add it with `expo-iap` (or `react-native-iap`). It needs an EAS dev build.
- **Soft paywalls, never blocking:**
  - after the van approves the family, home shows one card: "Your van is on Pohnch. Rs 99 for your first month";
  - an unpaid trip screen shows a blurred map with the same button.
- **`apps/parent/src/state/stage2.ts`:** add a matching `useBilling()` hook.

### 5. Driver app

A "Your Pohnch bonus" card showing paying children, tracked %, and the amount due on the 5th.

### 6. Admin page (`apps/web/app/admin/AdminApp.tsx`)

Add these numbers next to the Growth panel:
- monthly revenue;
- paying families;
- intro→paid conversion for each tested price;
- bonuses due;
- failed renewals.

### 7. Words

In `packages/messages/src/{en,ur}.json`:
- rewrite `s2.live.*` and `s2.free.*`;
- remove every "free month" (`s2.live.free`, `.start`, `.on`, `.ended`, `.used`).

### 8. Docs

Update the pricing table and gates in `BRIEF.md`, and the stage 2 line in `CLAUDE.md` ("Rs 599", "free month").

### Already done today

- The website, posts and standee no longer say "free in the pilot". They now say: "Free for drivers. Families pay a small founding price in the pilot, shown in the app before anything is charged."
- Pushed in `5cd50be`.

---

## Verification

- `pnpm -r test`: covers the new `plans.test.ts` and the message key checks.
- `supabase test db`: RLS on the new tables; an intro claim blocks a second intro by phone, and by child+van.
- `pnpm -r typecheck`, and `pnpm --filter web build`.
- Play test track:
  - buy the intro with a licence-tester account, and see the server move the family to `intro`;
  - cancel, and see grace and then no alerts;
  - check that an unpaid family in a running trip receives no pushes.
- Maestro flow in the parent app: Plans → buy intro → trip screen shows the live map; and unpaid, the blurred map.

## Decisions for you (defaults shown)

1. **Unpaid children on the driver's list:** shown with a "not on Pohnch" mark (default), or hidden?
2. **Collect at launch:** 5% (default), or straight to 7%?
3. **Driver bonus:** Rs 40 per paying child (default), or none?
4. **Plus prices to test:** Rs 249 / 349 / 449 (default).
