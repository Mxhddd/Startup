# Build prompts

Paste these in order. Phase A makes the mockups in Claude Design; phase B builds version 1 in Claude Code from those mockups.

## How to use these prompts

Run phase A in Claude, then phase B in Claude Code, one prompt at a time, checking each step before the next.

1. **Phase A (designs) runs here in Claude.** Start each prompt with "Make this in Claude Design". Standalone Claude Design at claude.ai/design closes on 14 December 2026, because Claude Design now lives inside Claude, so don't start a project there.
2. **Before phase B,** export the Final brief tab as Markdown and save it as `BRIEF.md` in an empty project folder.
3. **Phase B (code) runs in Claude Code** on your computer or Claude Code on the web, opened in that folder.
4. **One prompt at a time.** Claude Code will show a plan first: read it, ask about anything you don't understand, then say go.
5. **After each step,** run the check in the last section and save your work with a git commit before the next prompt.
6. **Replace anything in \[square brackets\]** before pasting.

Why this order: the designs settle what each screen looks like and what every component is called, and those names carry straight into the code.

## Phase A: Claude Design prompts

Five prompts, about one evening in total: pick a look, design the driver, parent and captain screens, then review the whole day as a clickable prototype.

**A1. Choose a look**

```text
Make this in Claude Design.

I'm designing Pohnch (پہنچ, "reached"), a free Urdu-first phone app for school vans in Karachi, Pakistan. Today parents hand their children to a private van and can't see anything until the child is home. In Pohnch:
- A parent "van captain" sets up the van and shares two invite links on WhatsApp: one for the driver, one for the other parents.
- The driver taps big buttons when the van is stopped: "Nikal gaya" (left), one tap per child picked up, "School pohnch gaye" (reached school), and the same in the afternoon.
- Every parent gets a push notification for each tap, and can tap "Aaj chutti" to mark their child absent so the driver skips that stop.

Users: drivers with cheap Android phones, often in bright sunlight, some of whom read slowly; parents who are busy and worried. The feeling should be a calm, trustworthy family utility, not a flashy startup.

Rules: Urdu first and right-to-left, with an English switch. Design at 360 x 780 px. Driver buttons at least 64 px tall, one main action per screen, each step with its own icon and colour so it can be recognised without reading. High contrast that works outdoors. No thin grey text.

Show me 3 different visual directions side by side. For each, draw two screens: the driver's Today screen in the middle of the morning route (3 children picked up, 2 still to go, 1 marked absent), and a parent's Today timeline after "Ali van mein baith gaya". Name each direction and give one line on why it fits.
```

**A2. Driver screens** (after you pick a direction)

```text
Use direction [name]. Design every driver screen at 360 x 780, Urdu first, with an English version of the Today screen:
1. Opening the driver link for the first time: welcome, van name, "Add to home screen" steps.
2. Today, before the morning trip: the list of children in stop order, absent children greyed out at the top with "Aaj chutti".
3. Today, mid-route: "Nikal gaya" done, 3 children ticked, 2 waiting, the next child highlighted.
4. Reached school: a clear done state.
5. Afternoon trip: "School se nikle" (left school), a tap per child dropped home.
6. No signal: a banner saying taps are saved and will send when signal returns, with a count of waiting taps.
7. Link switched off: what the driver sees and who to call.
Also draw the Today screen with 1 child and with 18 children, so I can see both ends.
Name components consistently and reuse them across screens: TapButton, ChildRow, AbsentChip, OfflineBanner, TripHeader.
```

**A3. Parent screens**

```text
Same direction. Design every parent screen at 360 x 780:
1. Opening the parents link: van name and driver name, "Pick your child" (first names only) or "Add my child".
2. Allow notifications on Android; on iPhone, a 3-step guide to adding Pohnch to the home screen first, because iPhone only shows web notifications after that.
3. Today timeline in four states: waiting for the van, van left, child in the van, reached school.
4. "Aaj chutti": choose today or tomorrow and morning, afternoon or both; a confirmation; an Undo that works until the van leaves.
5. Lock-screen previews of every notification, Urdu first with English underneath, each ending "driver ne mark kiya" (marked by the driver).
6. Settings: language, leave this van.
7. Empty state: the van hasn't started using Pohnch today.
Reuse TimelineEvent, AbsentChip and TripHeader from the driver screens.
```

**A4. Van captain and admin**

```text
Same direction.
1. Van captain on a phone, 360 x 780: "Set up your van" with three fields only (driver's first name, school name, morning pickup time), then a Share screen with two ShareLinkCard components, one for the driver and one for parents. Each has a "Send on WhatsApp" button and a pre-written message in Urdu and English.
2. My admin page on a laptop, 1280 x 800: a table of vans with driver tap rate for the last 10 school days, parents joined, notifications delivered or failed, "Aaj chutti" taps, and a Paid tick per family per month. Flag any van under 80% tap rate.
Keep the admin page plain and dense; it's a working tool.
```

**A5. Review the whole day**

```text
Turn the screens into one clickable prototype that walks through a full school day: captain sets up the van, driver joins, one parent joins, morning trip, the parent marks tomorrow as chutti, afternoon trip.
Then review it as a sceptical designer:
- Is any driver button hard to tell apart without reading?
- Is any text under 14 px or low-contrast?
- Does every screen have its empty, loading, offline and error state?
- Do the 1-child and 18-child versions still work?
Fix what you find. Finish with a short list of design decisions and the reason for each, and a list of every component name used.
```

## Handoff to Claude Code

Get the designs into the project folder in whichever form Claude offers, so Claude Code builds from them instead of guessing.

- **If you see Export → "Hand off to Claude Code":** use it. It bundles the design files, the chat and a README explaining the designs, and gives you a prompt with the bundle link to paste into Claude Code. Paste that before prompt B0 ([Anthropic tutorial](https://claude.com/resources/tutorials/using-claude-design-for-prototypes-and-ux)).
- **If you don't:** export each screen set as standalone HTML ([Anthropic](https://www.anthropic.com/news/claude-design-anthropic-labs) lists HTML among the export formats) and save the files in a `design/` folder inside the project. Also save A5's list of design decisions and component names as `design/DECISIONS.md`.

Either way, the component names from A2 to A4 (TapButton, ChildRow, AbsentChip, OfflineBanner, TripHeader, TimelineEvent, ShareLinkCard) must appear in the code too. That's what keeps design and code in step when you change something later.

## Phase B: Claude Code prompts

Ten prompts build version 1 from an empty folder to a deployed pilot. Expect one or two evenings per prompt.

**B0. Read the brief and plan**

```text
Read BRIEF.md and everything in design/ (or the Claude Design handoff bundle I pasted above). Don't write app code yet.
1. Write CLAUDE.md for this project: what Pohnch is, the version 1 scope (and what is out of scope), the design and tech rules, the component names from the designs, and these working rules: Urdu first and right-to-left; never commit secrets; every feature gets a test; explain your changes in plain language because I am a student learning as I build.
2. Propose the folder structure and the order you'll build in, using the stack in the brief: Next.js with TypeScript, Supabase, web push with the web-push library, hosted on Vercel.
3. List every account, key or setting I need to create, with exact steps, and mark which are free.
Wait for my go-ahead before writing code.
```

**B1. Skeleton app**

```text
Create the Next.js (App Router, TypeScript) app.
- Turn the design's colours, type sizes and spacing into one theme file; load the fonts the design uses with Latin fallbacks.
- Set up two languages, Urdu (default, right-to-left) and English, with all text in ur.json and en.json; no text hard-coded in components.
- Make it an installable web app: manifest, icons and a hand-written service worker in public/sw.js (no PWA plugin).
- Set up Vitest for unit tests and Playwright for end-to-end tests, with one passing test each.
- Add .env.example and make sure .env* files are git-ignored.
Run the tests and the build, fix any errors, then show me how to run it on my laptop.
```

**B2. Database**

```text
Create the Supabase schema as migration files:
- vans (name, school, morning and afternoon times, active)
- invites (van, role: captain, driver or parent, SHA-256 hash of the token, revoked_at)
- children (van, first_name, stop_order)
- parent_devices (child, push subscription JSON, language)
- trips (van, date in Asia/Karachi, direction: morning or afternoon)
- events (trip, type: left, picked, reached_school, left_school, dropped; child when relevant; tapped_at from the phone; received_at; lat and lng, nullable; a unique client_id so a retried tap is never counted twice)
- absences (child, date, direction: morning, afternoon or both)
- payments (child, month, amount, paid_at)
Turn on row-level security on every table with no public policies, so only server code using the service key can read or write. Add a daily job that clears lat and lng on events older than 30 days. Add a seed script that creates one van clearly named DEMO with 6 children.
Explain each table to me in one or two sentences.
```

**B3. Invite links**

```text
Build login-free access through invite links, following the captain screens in the designs.
- The captain opens /start, fills in the three fields, and gets a driver link and a parents link, shown with ShareLinkCard and "Send on WhatsApp" buttons that open wa.me with the pre-written message.
- Tokens are 32 random bytes, base64url; store only their SHA-256 hash.
- Opening /j/[token] sets a long-lived httpOnly cookie for that role and van, then sends the person to their Today screen. A revoked token shows the "link switched off" screen.
- Parents pick their child's first name or add a new child.
Write tests: a revoked link can't be used, a parent link can't open the driver screen, and tokens never appear in logs.
```

**B4. Driver Today screen**

```text
Build the driver's Today screen exactly as designed, with TapButton, ChildRow, AbsentChip, TripHeader and OfflineBanner.
- Each tap creates an event with the phone's time and a client_id. If location permission was granted, include the position at that moment; never ask for it again if refused.
- If offline, save the tap in IndexedDB, show it as waiting in OfflineBanner, and send queued taps when the browser comes back online or the app opens. Don't rely on Background Sync; iPhone doesn't support it.
- Children marked absent for this trip appear greyed at the top and can't be tapped.
- Buttons follow the order of the trip, so the next expected tap is the biggest one.
Test: going offline, tapping three times, and coming back online sends exactly three events with their original times.
```

**B5. Push notifications**

```text
Add web push.
- Generate VAPID keys with the web-push library and store them as environment variables; tell me exactly where to put them in Vercel.
- The parent screen asks for notification permission only after a button press. On iPhone, show the add-to-home-screen guide first, as designed.
- When an event is saved, notify the right parents: "left", "reached_school" and "left_school" go to every parent on the van; "picked" and "dropped" go only to that child's parents. Use each parent's language; Urdu text first; every message ends with "driver ne mark kiya".
- If the push service answers 404 or 410, delete that subscription.
- Record each send and whether it was delivered, for the admin page.
Test with two browser profiles: one driver, one parent.
```

**B6. "Aaj chutti"**

```text
Build "Aaj chutti" as designed: the parent picks today or tomorrow and morning, afternoon or both, sees a confirmation, and can Undo until the van's "left" tap for that trip. The driver's screen updates on its next refresh or when the app reopens; no live connection needed. Add tests for the Undo cut-off.
```

**B7. Admin page**

```text
Build my admin page at /admin, protected by a long secret in an ADMIN_TOKEN environment variable (opened once as /admin?key=..., then kept in a cookie). Show, per van: driver tap rate over the last 10 school days (a school day counts if all three morning taps happened), parents joined, notifications delivered and failed, "Aaj chutti" taps, and a Paid checkbox per family per month. Flag vans under 80% tap rate. Add a button to switch off any invite link. These are the numbers that decide whether Pohnch continues, so double-check the tap-rate calculation with a unit test.
```

**B8. Harden it**

```text
Review the whole app as a sceptical security and reliability engineer:
- Rate-limit the tap and join endpoints.
- Confirm no secret, token or child's name appears in logs, URLs other than /j/[token], or client bundles.
- Confirm every Supabase table is unreachable from the browser.
- Check every screen against its empty, loading, offline and error design.
- Write a Playwright test of the full school day from the A5 prototype: captain sets up, driver and one parent join, morning trip, chutti for tomorrow, afternoon trip.
Fix what you find and list anything you couldn't test.
```

**B9. Deploy and pilot kit**

```text
Deploy to Vercel. Walk me through setting every environment variable, run the end-to-end test against the deployed site, and confirm a real notification reaches my phone. Then write README.md: how to run it locally, how to deploy, which files matter most and what each does, and every service it uses with its current free limit and what it costs after. Note that Vercel's Hobby plan is for non-commercial use, so list what to switch before charging anyone.
```

**Anytime: learn the code**

```text
Explain [file or feature] to me like a patient teacher: what it does, how data moves through it, and one small change I could make myself to prove I understand it. Don't make the change for me.
```

## Checks after each step

Don't paste the next prompt until the current step passes its check yourself, on your own phone where it says so.

| Step | What you do | Passes if |
| --- | --- | --- |
| A1–A5 | Open the prototype on your phone in sunlight | You can tell every driver button apart without reading it |
| B0 | Read CLAUDE.md | It matches the brief and you understand every line |
| B1 | Open the app on your phone and switch language | Urdu reads right-to-left; tests and build pass |
| B2 | Open Supabase's table editor | The DEMO van and its 6 children are there |
| B3 | Open the driver link in one browser, the parent link in another | Each lands on its own screen; a switched-off link is refused |
| B4 | Turn on airplane mode, tap three times, turn it off | Three events arrive with the original times, no duplicates |
| B5 | Tap "Nikal gaya" on one phone | A notification reaches the parent phone within seconds |
| B6 | Mark tomorrow as chutti, then try Undo after "Nikal gaya" | The child is greyed out for the driver; the late Undo is refused |
| B7 | Open /admin without the key | It's refused; with the key, tap rates match what you tapped |
| B8 | Run the full-day test | It passes end to end |
| B9 | Use it for one real school day with your own family's van, if the survey gate has passed | All alerts arrive and the admin page shows 100% tap rate |
