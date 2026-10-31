# Pohnch brand guide (v3 · Neel o Kesar)

Canvas: https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy, page **v5 · Map-first app (current)** (v4 · Pilot plan holds the full colour and print work). This file is the text version for building the apps and website. v2 ("Ghar/Saaf", neem and haldi, "Pohnch Baji") is kept on the canvas as history only.

## Direction

Premium, but local craft. Think a well-made Karachi thing: indigo and saffron, an eight-point star, a gold hairline frame, Nastaliq for the big moments. Two moods by role:

- **Driver screens: plain.** Built for sunlight and one thumb. Flat colour, big buttons, no pattern, no frames.
- **Parent app: map-first.** The brand-styled map fills the screen; a ghee bottom sheet holds the trip. Pattern and frames only on brand moments (plans, Amaan, empty states, the website).
- **Print and pitch: rich.** Star-lattice pattern as texture, ornamental frames, flat illustration.

## Name and line

- **پہنچ · Pohnch** ("reached").
- Slogan: **فکر کم، خبر پوری** — English line: *Less worry, the whole story.*
- Driver line (driver card): **آپ کا بٹن، والدین کا سکون**.
- Promise: **جو مارک ہوا، وہی پہنچا** — what the driver marked reaches you. No more, no less, no later.
- Hero: the parent's peace of mind. The driver is credited in every alert ("رفیق بھائی نے مارک کیا · 7:12").

## Logo

Round 7, final (October 2026): **ek sitara**, one star. Files in `design/logo/` (SVG and transparent PNG); `design/logo/source/final2.py` draws them from the fonts (Noto Nastaliq Urdu Bold, Manrope ExtraBold). Design canvas: https://claude.ai/artifact/R6jXrX99VJxFeCH2GbKd5z

- **One star, one accent.** The letters are one colour; the eight-point star (khatim) is the only colour, in kesar. It is the o of Pohnch and the dot of ن in پہنچ.
- **A real hole.** The star's centre is punched through (radius a third of the star's), so it sits on any ground. No separate centre dot colour.
- **Urdu mark** (`pohnch-mark-urdu`): پہنچ in Noto Nastaliq Urdu Bold, all dots in the letter colour, the ن dot as the kesar star. App splash, posters, stickers.
- **Latin wordmark** (`pohnch-wordmark`): Pohnch in Manrope ExtraBold, the star as the o.
- **Lockup** (`pohnch-lockup`, `pohnch-lockup-tagline`): the wordmark with پہنچ beside it, sized to span the full height of Pohnch. The star appears once: in the lockup the ن dot is a plain kesar dot. Tagline LESS WORRY, THE WHOLE STORY is outlined: kesar on neel, neel on ghee.
- **App icon** (`pohnch-app-icon`): kesar star on a neel rounded square. **Favicon / under 32 px** (`pohnch-star`): the star alone.
- Colourways: on ghee (neel letters, kesar star), on neel (ghee letters, kesar star), one colour (`-one-colour` neel, `-white`) for stamps, vinyl cuts and single-ink print.
- Minimum sizes: wordmark 120 px wide, Urdu mark 56 px tall; below that, the star alone. Clear space: the star's width on every side.
- Don't: stretch, rotate, outline, retype the letters in another font, recolour the letters kesar, or add a second star.
- History: round 6 (route-dot ring) and earlier marks are in `design/logo/archive/`.

## Craft kit

- **Star lattice**: the star at 44% scale on a 40 px tile (bigger tiles on print), in the next shade of the ground (#2B3A80 on neel, #17705A on emerald), with a kesar dot (sona on emerald) at each tile centre.
- **Ornamental frame**: three inset rings — 1.5 px sona, 5 px of the card colour, 1 px line colour — with small sona stars in the corners. Cards on parent screens, posters, the price table.
- **Illustration**: flat shapes only, no gradients, no photos, no emoji. Ghee van with a kesar stripe and a star on the door, neel road with kesar dashes, round child "heads" in step colours.

## Colour

| Name | Hex | Use |
| --- | --- | --- |
| گھی Ghee | #FAF6EE | ground, every screen background |
| White | #FFFFFF | cards and rows |
| سیاہی Siyahi | #141A33 | text, lock screen, dark panels |
| ink 2 | #4A4F66 | secondary text (8.0:1 on ghee) |
| line | #E2DCCD | borders only |
| نیل Neel | #1F2A5C (hover #2B3A80, tint #E6E9F5) | brand colour, primary buttons, step "left" |
| کیسر Kesar | #E8A33D (tint #FBEBCF) | joy, highlights, step "reached school"; text on it is siyahi |
| شنگرف Shingarf | #A8321F (tint #F6DDD6) | attention only: help, "van is late", strikes |
| زمرد Zamurrad | #17705A (tint #DCEFE7, text on tint #0B4A3D) | step "picked", success, "paid" |
| پستہ Pista | #A7D47E | decoration only (home dot on dark grounds); no longer a step colour |
| سونا Sona | #C9A24A | **decoration only** (frames, corner stars). Never text, never a button. Gold on emerald is 3.2:1. |
| امان Amaan | #0F5E4E | Pohnch Amaan sub-brand |
| absent | #5E5A52 on #EEE9DF | "Aaj chutti" |
| danger | #9E2A1F on #F9E3DF | errors, help alert |

Driver steps: one colour per meaning, one icon per step. Neel = the van leaves somewhere; zamurrad = something happened to your child; kesar = arrived at school. Red is never a routine step.

| Step | Fill | Text |
| --- | --- | --- |
| left (نکل گئے) | neel #1F2A5C | ghee |
| picked (بٹھا لیا) | zamurrad #17705A | white |
| reached school (اسکول پہنچ گئے) | kesar #E8A33D | siyahi |
| left school (اسکول سے نکلے) | neel #1F2A5C | ghee |
| dropped (گھر اتار دیا) | zamurrad #17705A | white |

## Map (v5)

The map is the parent app's main screen, so it is styled to the brand instead of the default Google look.

| Layer | Colour | Notes |
| --- | --- | --- |
| land | #EFE9DC | warm, close to ghee |
| parks | #DDEBCB | |
| water | #CFDCE8 | |
| roads | #FFFFFF with #DDD4C2 casing | main roads slightly wider; no road colour coding |
| labels | #4A4F66 | few labels: hide shops, businesses and transit |
| route line | neel #1F2A5C, 6 px, round caps | the trip still to drive; driven part neel at 35% |
| stops | white dot with a neel ring; your stop a zamurrad home pin | other families' stops never shown to parents |
| school | kesar pin with the star | |
| van marker | neel circle, ghee 4 px ring, kesar van glyph, heading arrow | moves smoothly between positions; turns grey with "last seen 40 s ago" when the signal drops |

- **Bottom sheet**: ghee, 24 px top radius, a grab bar, EtaPill ("6 منٹ میں گھر") on top in Manrope digits, then the TimelineEvent list.
- **Live Activity and Dynamic Island**: siyahi ground, the star at the leading edge, the van's minutes in Manrope 800, a route-dots progress bar from van to home, the step colour as the only accent.
- **Android ongoing notification**: the same progress bar and minutes; the small icon is the star and dot.
- **Widget**: ghee ground, the next step and the minutes; tap opens the map.
- **Pitch and deck marker font**: Shantell Sans for hand-written notes on the whiteboard pitch and deck only, never in the apps.

## Type

- **Gulzar** (display Nastaliq): logo, slogans, screen titles, poster headlines. Never under 26 px. Brand moments only.
- **Noto Sans Arabic** (500–800): all Urdu UI text. Modern and readable in sunlight; minimum 14 px, line-height about 1.6.
- **Manrope** (500–800): all Latin text and every digit. Western digits for times, prices and counts ("Rs 199", "7:12").

## Shape

Cards 14–18 px radius, buttons 14–16 px, pills full. Print frames 6–10 px. No drop shadows on the driver screens; on parent screens the frame does the work, not a shadow.

## Voice

- Respectful **آپ**, never تم.
- Say who did it: "رفیق بھائی نے مارک کیا · 7:12", never "system updated".
- Calm, never alarm: "وین کو دیر ہو رہی ہے", never "خطرہ! وین غائب!".
- Fewest words: "علی وین میں ہے".
- Gender-neutral about children (we never store a child's gender). Adults are named as they ask to be named (بھائی، صاحبہ).

## Sub-brand: پہنچ امان (Pohnch Amaan)

School vans driven by women, or with a woman companion on board. Women framed as professionals, not as "baji". Line: **اپنی وین، اپنی کمائی** (recruitment) and **امان مہر** (the seal parents see).

- Colour **Amaan emerald #0F5E4E** with sona frames and the same star in sona.
- Roles: **ڈرائیور صاحبہ** (woman driver), **امان ساتھی** (woman companion on board), **والدہ ڈرائیور** (a mother who drives her own children plus 2–4 more).
- Van badges (attached to the van, never the child): ڈرائیور صاحبہ، امان ساتھی، صرف بچیاں.
- The Amaan seal needs five checks: CNIC, licence, two references, half-day training, home visit by two women from the team.
- Promise: day trips only, a woman companion in every van, the parents see every tap, a help button, and "میں گھر پہنچ گئی" after the last trip (reminder at 45 minutes, the team calls at 60).

## Materials on the canvas

WhatsApp: card to parents, how-to-join card, 9:16 status, Amaan recruitment card. Print: A3 school-gate poster, A5 parent flyer with the price table, van sticker sheet (window seal, door strip, Amaan badge, "seat free" QR), A6 driver card (front: reward; back: the five taps), A3 Amaan recruitment poster.

Print prices still show round 3 (Rs 199) and must be updated to round 5 pricing before printing. Placeholders still to fill before printing: [QR], [نمبر] (help and WhatsApp number), the pohnch.pk domain.
