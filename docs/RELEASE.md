# Releasing the apps (v21)

## Getting a new version to testers (no new track)
1. `eas build -p android --profile production` in `apps/parent` and `apps/driver` (version 1.0.0; the build number goes up by itself).
2. `eas submit -p android --profile production --latest`: uploads to Play's closed-testing track (`alpha` in `eas.json`). Needs the Google Play service-account key uploaded once on expo.dev (Credentials, Android, Google Service Account).
3. Testers get the update from Play like any other app update (a few hours at most). No new track, no new link.
4. Small fixes that change only JavaScript can go out over the air: `eas update --channel production` (testers get it the next time they open the app).

## The one QR code
- Posters: `design/print/pohnch-qr-poster-A4.pdf` (and `.png`, and the bare code `pohnch-qr-only.svg`). The code opens **pohnch.pk/app**.
- pohnch.pk/app asks "Parent or driver?", then: join the testers' Google Group, become a tester, install from Play. Settings in `packages/core/src/contact.ts` (`JOIN`).
- When Google approves production (after 12 testers for 14 days on the closed track: Play Console, Dashboard, "Apply for production"), set `JOIN.public = true` and publish the website. The posters keep working: the page then sends people straight to the Play listing.
- Both apps' closed tests must allow the same Google Group (Play Console, each app, Test and release, Closed testing, Testers).

## Google sign-in (free logins)
- Google Cloud project "Pohnch": OAuth consent screen (published), a Web client (its ID goes in Supabase, Authentication, Google, and as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the EAS environment), and Android clients for `pk.pohnch.parent` and `pk.pohnch.driver` with both the upload key's SHA-1 and Play's app-signing SHA-1.
- Until the client ID is set, the apps show phone login only.
