# Design decisions

## Round 4 (current): design review applied, pilot first

The review of 29 October 2026 split the 32 app screens into three stages, and every change it asked for is applied on the canvas page **v4 · Pilot plan (current)** (the old v3 page, regrouped). Its first board, "Review applied", is the summary.

**Stages**

| Stage | Screens | Starts when |
| --- | --- | --- |
| Pilot · build now | 19: driver welcome, practice run, before start, tap sent and undo, mid-route, reached school, afternoon, no signal, help; parent joins, request sent, today, aaj chutti, notifications; captain create van, share links, approvals, whole-van holiday; admin | now (one van, free month) |
| After the pilot gate | 6: plan and payment, captain's van accounts, driver's week, driver earnings, two children, help alert to captain | 3 of the first 10 families pay |
| Later · its own launch | 7: find a van, driver profile, Amaan apply, verification, listing, safety log, "I'm home safe" | 100 vans, a training partner, separate funding |

**Changes applied**

1. **Logo: "the path arrives"** (the builder picked the third option): route dots run into the star, which now has a centre dot instead of a tick. The tick read as a social-media "verified" badge. Under 32 px, the star and dot alone.
2. **One colour per meaning.** "Left school" is neel (like "left"), "dropped" is zamurrad (like "picked"). Shingarf red is kept only for help, "van is late" and strikes: a routine "left school" in red read like an alarm on a lock screen. Holiday notices are neel.
3. **Siblings at one stop take one tap** ("دونوں بٹھا لیے · ایک ٹیپ"), with "صرف حمزہ / صرف عائشہ" for when only one comes.
4. **Undo stays 5 seconds** (the review asked 3 or 5): parents don't notice the delay, slow readers need it, and it is one number on the driver card.
5. **Help in the pilot is late reasons only** (traffic, breakdown, road closed) plus 15 and 1122. Emergency-with-location moves to the "help alert to captain" screen after the gate, which also alerts the Pohnch team.
6. **Parent join hides other children's names.** The parent types their own child's first name; the captain matches name and number.
7. **Captain setup drops the Amaan options** for the pilot.
8. **Admin trimmed to 4 numbers:** tap rate (10 school days), parents joined, alerts delivered, families paying (gate is 3 of 10).
9. **No cash for captains.** Families pay Pohnch directly; the captain's accounts screen shows who paid and sends reminders.

Launch plan, funding proposal and pitch deck (round 4 extras) are linked from `docs/LAUNCH.md`.

## Round 3: Neel o Kesar, Pohnch Amaan, pricing

The canvas page **v4 · Pilot plan (current)** replaces the v2 pages, which stay on the canvas as "v2 · previous". The brand is in `design/BRAND.md`. Where round 3 and an earlier round disagree, round 3 wins; earlier reasoning still holds for anything not mentioned here.

Builder's answers that drove round 3:

1. **What was wrong with v2:** generic and template-like, weak typography, muddy colours.
2. **Feeling: premium but local craft.** One direction, taken all the way, colours left to the designer. Result: neel (indigo) and kesar (saffron) on ghee, an eight-point star mark, star-lattice pattern, gold hairline frames, flat illustration.
3. **Urdu type: a mix.** Gulzar Nastaliq for brand moments (logo, titles, posters); Noto Sans Arabic for all UI text, because it stays readable in sunlight and at 14 px; Manrope for Latin and digits.
4. **Craft split by role.** Driver screens stay plain (flat colour, big buttons, no pattern). Parent, captain, Amaan and print get the pattern, frames and illustration.
5. **The women-run line is renamed پہنچ امان · Pohnch Amaan** ("safety, trust"). "Baji" framed women as helpers; Amaan frames them as professionals and names what parents are buying. Roles: ڈرائیور صاحبہ، امان ساتھی، والدہ ڈرائیور.
6. **Who pays: families pay per child; drivers are on the platform for free** and are visible to families looking for a van (public profile with reliability score and free seats).
7. **Price: decided after modelling** (below).
8. **All four refinements:** drivers are paid for tapping, the captain's child is free, first month free plus a yearly plan, and a school plan for later.

### Pricing (decided)

| Plan | Price | Notes |
| --- | --- | --- |
| Family, monthly | **Rs 199 per child per month** | first month free; billed only in school months |
| Family, yearly | **Rs 1,990 per child** | 12 months for the price of 10 |
| Sibling | **Rs 99** per extra child | same family, any van |
| Summer | **Rs 0 in June and July** | billing pauses automatically |
| Captain's child | **free** | while the van has 5 or more paying families |
| Driver | **free, plus Rs 40 per paying child per month** | paid when the month's tap rate is 90% or more |
| School plan (later) | **Rs 149 per child**, billed yearly | after about 30 vans; school pays for every van serving it |

Payment: Raast QR (no fee to the payer; up to 0.25% merchant fee), JazzCash or Easypaisa, straight to Pohnch. (Round 4: captains never collect cash.)

Model for a 10-child van (captain's child free, 9 paying): Rs 1,791 billed, Rs 360 to the driver, about Rs 150 in payment and push costs, **about Rs 1,281 kept per van per month**. With fixed costs of about Rs 75,000 a month (one part-time support person, hosting, printing), **break-even is about 59 vans**. The pricing board on the canvas lets you change children, price (149 / 199 / 249 / 299), reward, van fee and the captain rule.

Why Rs 199: it is about 5% of a typical van fee (Rs 2,000–7,500) and it leaves room for a driver reward that is real money. At Rs 149 a van keeps about Rs 831 and break-even needs about 90 vans. Rs 249 and above sits on top of recent van fee rises of Rs 1,000–2,000, so we start low and test willingness to pay in the pilot. These are estimates, not survey results: the pilot should check them.

### Refined idea (eight changes)

1. Drivers are on the platform: public profile with areas, schools, seats free and a reliability score from real taps.
2. Drivers earn for tapping (Rs 40 per paying child at ≥90%).
3. Rs 199 per child, first month free, yearly Rs 1,990.
4. Siblings Rs 99.
5. Captain's child free while 5 or more families pay.
6. No charge in June and July.
7. School plan Rs 149 (later stage).
8. Pohnch Amaan: five-check seal, Amaan companion, "میں گھر پہنچ گئی" check-in after the last trip (reminder at 45 minutes, captain then the team calls at 60).

Growth loop: families pay → driver earns → driver taps every stop → reliability score rises → more families find the van → seats fill and the captain's child stays free.

### Research (October 2026)

1. School van fees in Karachi: Rs 2,000–7,500 per child per month; Bahria Town about Rs 7,000–7,500 (bestschool.pk, *School Transport in Karachi 2025*; housingassociates.pk, *Schools in Bahria Town Karachi 2026*).
2. GPS van trackers: Rs 300–800 or Rs 790 / 1,990 per van per month plus Rs 8,000–15,000 hardware, usually paid by the operator (iotee.pk; smartvan.pk pricing).
3. CNG station closures raised van fees by Rs 1,000–2,000 (The Hawk).
4. Petrol Rs 393.86 a litre on 15 October 2026 (Pakistan Observer, gari.pk).
5. Sindh unskilled minimum wage Rs 40,000 for 2025-26, rising to Rs 43,000 from July 2026 (Profit; Sindh cabinet).
6. Raast person-to-merchant payments: up to 0.25% merchant fee (State Bank of Pakistan).
7. Women in transport: Paxi Pink Taxi, VSisters (2025), 1,500+ female Careem captains, Sindh Pink Bus training women drivers; Sindh female labour-force participation about 11%.

### New screens in round 3

- Driver: earnings and public profile (XD-Earnings), Amaan "I'm home safe" (XD-SafeHome).
- Parent: plan and pay (XP-Plan), find a van with an Amaan filter (XP-Find), driver profile (XP-Driver), trial pill on Today.
- Captain: billing and "cash received" ticks in Manage van (XC-Manage), captain's-child-free status, driver reward.
- Amaan: apply (XA-Apply), verification steps (XA-Verify), Amaan van listing (XA-Listing), captain safety log (XA-Captain).
- Admin: revenue, driver rewards, kept vs. cost (XAD-Admin).

New component names to add in code: **PlanCard**, **PriceRow**, **ReliabilityScore**, **DriverProfile**, **AmaanSeal**, **SafeHomeCheck**, alongside the round 2 names.

Open items:
- [QR], help and WhatsApp numbers, and the pohnch.pk domain are placeholders.
- In-app payments are still out of scope for version 1: the Plan screen is a design for version 1.1. Version 1 keeps "captain collects, admin ticks Paid", now at Rs 199.
- Driver rewards need a payout method (JazzCash, Easypaisa or Raast) and a monthly job; not in version 1.
- The public driver profile and "find a van" are new public pages; they must never show a child's name, a phone number or a token.

---

## Round 2: brand, v2 screens, Pohnch Baji (superseded)

The v2 pages of the canvas (now one page, **v2 · previous**) replaced the v1 look below; round 3 replaces v2's look, name for the women's line and [PRICE] placeholders. The behaviour decisions (undo, hold, approval, help) still stand. The brand is in `design/BRAND.md`. Where round 2 and round 1 disagree, round 2 wins; the round 1 reasoning still holds for anything not mentioned here.

Builder's answers that drove round 2:

1. **Look: Ghar's warmth with Saaf's clarity.** Cream ground, neem teal, rounded shapes, Gulzar + Noto Nastaliq + Nunito; driver buttons keep solid step colours and high contrast for sunlight.
2. **Mistaken taps: 5-second undo on every tap, hold-to-confirm on van-wide taps, strikes for the captain.** "نکل گئے", "اسکول پہنچ گئے" and "اسکول سے نکلے" need a 1-second hold (they alert every parent); child taps are single taps. After any tap a bar counts down 5 seconds with a big "واپس" button; parents are notified only after it ends. Undone taps are recorded as strikes, shown to the captain and admin weekly; Pohnch takes no automatic action.
3. **Captain approves every parent phone.** The parent picks the child and says who they are (امی، ابو، دادی/نانی، دادا/نانا، کوئی اور); the captain approves or rejects; a child with several approved phones is flagged.
4. **Paid from day one**, price still open: every screen and poster shows a [PRICE] placeholder; the captain collects the fee outside the app and the admin ticks Paid.
5. **New screens:** captain van management (rename, times, stop order, links, fee, captain phone, badges), parent with 2+ children or vans, driver practice run before the first trip, holidays / whole-van day off.
6. **Driver safety tools:** "مدد" in the driver header opens "I'm stuck" (breakdown / traffic / road closed → captain and parents told the van is late) and "Emergency" (2-second hold → captain gets an alert with the driver's location; parents only if the captain decides), plus one-tap 15 and 1122. Location is sent only in an emergency and only to the captain.
7. **Women-driven vans = separate sub-brand, پہنچ باجی (Pohnch Baji).** Three ways in: woman driver, mother-driver, woman attendant. In the app they appear only as van badges. Stage 1 software + badges, stage 2 marketplace, stage 3 operator model drafted as a competition concept (two A4 pages on the canvas).
8. **Slogan: فکر کم، خبر پوری.** Hero is the parent's peace of mind, with the driver credited in every alert.

New component names to add in code: **HoldButton** behaviour on TapButton (`data-hold`), **UndoBar**, **HelpSheet**, **VanBadge**, **ApprovalCard**, **RouteDots** (the progress dots in TripHeader).

Open items:
- [PRICE], [pohnch link], QR, recruitment phone number and Baji income figure are placeholders.
- Undo is client-side (the tap waits 5 seconds on the phone before sending); undone taps are still sent afterwards as audit records so strikes can be counted.
- An emergency needs the captain's phone number, which is optional in van management; without it the driver still has 15 and 1122.

---

# Round 1 (phase A, v1 pages)

Canvas: https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy — pages A1 to A5. Start the clickable school day from the **A5 · Prototype & review** page, artboard "Start: a full school day" (press Play). The `.dc.html` files in `design/canvas/` are the canvas sources; open the canvas link to see them rendered.

## A1: direction

Three directions were drawn: **Saaf** (clear), **Ghar** (home) and **Sadak** (road). **Saaf was picked**: white ground, black ink, one solid colour and one icon per step, Noto Nastaliq Urdu. It is the most legible on a cheap screen in noon sun; the warmth comes from the warm-white background and the Nastaliq script rather than from soft colours. Ghar was calmer but its tinted pills lose contrast outdoors; Sadak was unmissable but felt urgent.

## A5: review as a sceptical designer

**Can every driver button be told apart without reading?** Yes, after one fix. Every step has its own colour and icon shape. The contrast check showed that "picked" green (#0E7A3E) and an orange "reached school" had almost the same lightness (relative luminance 0.144 and 0.141), so a red-green colour-blind driver would see two similar brown buttons on the same morning screen. Fix: "reached school" is black with a yellow icon and text. Blue "left" and purple "left school" have similar lightness, but they never appear on the same trip and their icons differ (van vs. door with arrow). Green "picked" and teal "dropped" are likewise on different trips.

**Is any text under 14 px or low-contrast?** No. Smallest size is 14 px (secondary labels, weight 600 or more). Secondary text #3A3A3A is 10.7:1 on the ground colour; every step colour carries white text at 5.4:1 or better; absent text #4D4D4D on #EEEBE4 is 6.8:1. No thin grey text anywhere. Found and fixed: two driver tap targets below 64 px (the retry button on the tap-error state, 48 px, and the folded "9 children on board" row on the 18-child screen, 52 px) are now 64 px.

**Does every screen have its empty, loading, offline and error state?** Not at first: A2 to A4 had no loading or error states and the parent side had no offline state. Added: driver loading, driver tap error, parent loading, parent offline, parent link switched off, captain setup error. Already present: driver offline (A2-6), driver link off (A2-7), parent empty day (A3-7). Still not drawn: admin loading and empty states (a working tool; plain text is enough).

**Do the 1-child and 18-child versions still work?** One child works with no special case. Eighteen children overflowed, so picked children fold into one "9 بیٹھ گئے · دیکھیں" row, absent children shrink to chips, the list scrolls, and after each tap the next TapButton scrolls into view.

## Decisions and reasons

1. **Nastaliq for Urdu, Inter for Latin and all digits.** Urdu readers expect Nastaliq; Inter keeps times and counts crisp. Nastaliq needs line-height about 1.9, so rows are sized for it.
2. **Western digits for times and counts** (7:05, 3/5): that is how clocks and phones in Karachi show them, and it avoids mixing two digit systems.
3. **The next expected tap is the only big button (104 px).** Done steps shrink to tinted rows with their time; later steps stay small. The driver never hunts for the right button.
4. **Gender-neutral wording everywhere, so we never store a child's gender.** Driver: "بٹھا لیا" (picked up), "گھر اتار دیا" (dropped home). Parent: "علی وین میں ہے" (Ali is in the van) instead of "بیٹھ گیا/گئی".
5. **"نکل گئے" instead of "نکل گیا"** for the driver's first button, to match "اسکول پہنچ گئے" in the same voice. Parents see "وین نکل گئی" (the van left).
6. **Absent children are pinned to the top, dashed and not tappable**, with an AbsentChip, so the driver sees them before setting off.
7. **Afternoon order is the morning order reversed** (last stop first). Stop numbers on the afternoon screen are the afternoon sequence.
8. **Offline taps look done immediately**, marked "باقی" (still to send), with a count in the OfflineBanner. Being offline never blocks the next tap.
9. **First-open safety line for drivers:** tap only when the van is stopped.
10. **Link-switched-off screens say to ask "whoever sent you this link on WhatsApp"**, because setup has only three fields and stores no phone numbers.
11. **Van name defaults to the driver's name ("رفیق کی وین") and can be renamed** with the pencil on the Share screen; the mockups show a van renamed "گلشن وین". Afternoon time is not asked at setup (three fields only); it can be set later and is only shown when set.
12. **Share screen warns** not to post the driver link in the parents' group: whoever holds it can tap.
13. **Notification format:** Urdu line, then "time · ڈرائیور نے مارک کیا", then the English line ending "marked by the driver". The notification icon is the step's icon in the step's colour.
14. **iPhone parents see the add-to-home-screen guide before any permission request**, and the page still shows today's news without notifications.
15. **"Aaj chutti" options:** today or tomorrow × morning, afternoon or both; Undo until that trip's "left" tap.
16. **Admin page is English-only, plain and dense**, and states the tap-rate rule on the page so the number can be checked.
17. **No emoji, no fake status bars, no decorative gradients.**

## Open questions for the builder

- A mistaken driver tap notifies every parent and cannot be undone in version 1. Is that acceptable for the pilot?
- Anyone holding the parents link can claim any child's first name and get that child's alerts. Version 1 relies on switching the link off; captain approval of new parents would be safer but adds a step.

## Component names (use these in code)

| Component | Variants and states |
| --- | --- |
| **TapButton** | steps `left`, `picked`, `reached_school`, `left_school`, `dropped`; sizes `next` (104 px) and `later` (64 px); state `done` |
| **ChildRow** | `pending`, `waiting`, `done`, `queued`, `failed`, `absent`, `done-group` |
| **AbsentChip** | inline chip "آج چھٹی" / "Off today"; compact chip on the 18-child screen |
| **OfflineBanner** | driver offline with waiting-tap count; `error` variant; parent offline |
| **TripHeader** | driver (trip, van, date, count, progress bar); parent (child, trip, van, driver); `loading` |
| **TimelineEvent** | `done`, `current`, `upcoming` |
| **ShareLinkCard** | `driver`, `parent` |

## Tokens

| Token | Hex | Use |
| --- | --- | --- |
| ink | #121212 | text, primary buttons |
| ground | #FAF8F3 | screen background |
| surface | #FFFFFF | cards, rows |
| line | #D6D2C8 | borders only, never text |
| ink-2 | #3A3A3A | secondary text |
| step-left | #1F4FD1 | "نکل گئے" |
| step-picked | #0E7A3E | "بٹھا لیا" |
| step-school | #141414 with #FFC21A | "اسکول پہنچ گئے" |
| step-left-school | #6B2FB3 | "اسکول سے نکلے" |
| step-dropped | #00707A | "گھر اتار دیا" |
| absent | #4D4D4D on #EEEBE4 | "آج چھٹی" |
| offline | #8A5A00 / #6B4600 on #FFF3D6 | OfflineBanner |
| danger | #B3261E on #FDECEA | errors, "leave van", switch off |
| whatsapp | #127A3F | "Send on WhatsApp" |

Type sizes: 14, 15, 16, 17, 18, 20, 26, 28 px. Weights 600, 700, 800. Radii: 12 px rows, 14–18 px buttons and cards.
