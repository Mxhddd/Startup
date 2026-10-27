# Build plan (B0)

## Folder structure

```text
Startup/
├── BRIEF.md, CLAUDE.md, README.md
├── design/                     phase A: canvas sources and DECISIONS.md
├── docs/                       build prompts, this plan, accounts list
├── public/
│   ├── manifest.webmanifest    installable app (name, icons, colours)
│   ├── sw.js                   hand-written service worker: push + offline shell
│   └── icons/
├── supabase/
│   ├── migrations/             SQL files, one per change (tables, RLS, cleanup job)
│   └── seed.ts                 DEMO van with 6 children
├── src/
│   ├── app/
│   │   ├── layout.tsx          sets <html lang dir> from the language cookie
│   │   ├── start/              captain: setup (C1) and share (C2)
│   │   ├── j/[token]/route.ts  opens an invite link: sets cookie, redirects
│   │   ├── driver/             driver Today screen (D1–D9)
│   │   ├── parent/             join, Today timeline, chutti, settings (P1–P7)
│   │   ├── off/                "link switched off"
│   │   ├── admin/              admin page
│   │   └── api/                events, absences, children, push subscribe, admin actions
│   ├── components/             TapButton, ChildRow, AbsentChip, OfflineBanner,
│   │                           TripHeader, TimelineEvent, ShareLinkCard
│   ├── lib/
│   │   ├── db.ts               server-only Supabase client (secret key)
│   │   ├── tokens.ts           make tokens, hash them
│   │   ├── session.ts          read/write the role cookie
│   │   ├── push.ts             send web push, delete dead subscriptions
│   │   ├── karachiTime.ts      "today" and trip dates in Asia/Karachi
│   │   ├── tapQueue.ts         IndexedDB queue for offline taps (browser)
│   │   ├── tapRate.ts          the admin tap-rate calculation
│   │   └── i18n.ts             loads ur.json / en.json
│   ├── messages/ur.json, en.json
│   └── theme.ts                colours, type sizes, spacing from design/DECISIONS.md
└── tests/
    ├── unit/                   Vitest
    └── e2e/                    Playwright
```

Language is kept in a cookie, not in the URL, so invite links stay short (`/j/[token]`).

## Build order

Same as the build prompts, one at a time, each ending with tests, a build and a commit:

1. **B1 Skeleton**: Next.js app, theme file, fonts, Urdu/English text files, manifest and `sw.js`, Vitest and Playwright with one passing test each, `.env.example`.
2. **B2 Database**: migrations for vans, invites, children, parent_devices, trips, events, absences, payments; RLS on with no public policies; 30-day location cleanup; DEMO seed.
3. **B3 Invite links**: `/start`, token hashing, `/j/[token]` cookie, parent picks or adds a child, "link switched off".
4. **B4 Driver Today**: TapButton, ChildRow, AbsentChip, TripHeader, OfflineBanner; offline queue in IndexedDB; optional location.
5. **B5 Push**: VAPID keys, permission after a button press, iPhone guide first, who gets which message, delete 404/410 subscriptions, record delivery.
6. **B6 Aaj chutti**: choose, confirm, Undo until the trip's "left" tap.
7. **B7 Admin**: `ADMIN_TOKEN`, tap rate with a unit test, joins, push counts, chutti, Paid ticks, switch off links.
8. **B8 Harden**: rate limits, log and bundle checks, RLS check, all states, full-day Playwright test.
9. **B9 Deploy**: Vercel, environment variables, real phone test, README.
