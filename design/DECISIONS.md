# Design decisions (phase A)

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
