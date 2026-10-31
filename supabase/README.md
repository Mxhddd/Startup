# supabase/: the backend

| Folder / file | What it is |
| --- | --- |
| `migrations/` | The database, in order: tables, security rules, the 30-day position cleanup, and the actions (taps, trips, positions, invites, approvals, chutti). |
| `functions/app` | The Edge Function every important write goes through. It checks the login token, checks the input, then calls the matching database action, which checks the role. |
| `functions/send-sms` | Supabase calls this with each login code; it checks Supabase signed the call and passes the code to the SMS gateway. |
| `functions/_shared` | The logic of both functions in plain TypeScript, with tests (`pnpm --filter @pohnch/backend test`). |
| `tests/` | Database tests (`pnpm test:db`): they act as parents, drivers, a logged-out visitor and the team, and check what each can see and do. |
| `config.toml` | Settings for running Supabase on your laptop. |

## How a tap travels

1. The driver taps. The app makes a `clientId` and sends `POST /functions/v1/app/tap` with the driver's login token.
2. `app` checks the token (who is this?) and the input (is it a real trip id, an allowed step?).
3. It calls `record_tap` with the server key. `record_tap` checks this driver drives this trip's van, that the children are approved on it, and ignores a tap it has already stored.
4. The parent app, reading with its own login, sees the new step through row-level security, which shows it only that van's approved families.

## The rules the tests prove

- Logged out: nothing at all.
- A parent sees their own children, their own van (once approved and verified), its trips and positions, and only their own stop.
- A driver sees their van, its stops and the first names of the children on it; never families or other parents.
- Only the server can run the actions; the apps can't write taps, positions, approvals or invites directly.
- A tap sent twice is stored once; positions are accepted only during a running trip.
- Invite links store only a SHA-256 hash of the token.

## Running the tests

On a machine with Postgres 16, PostGIS and pgTAP (CI installs them):

```bash
DATABASE_URL=postgres://postgres@localhost:54329/postgres pnpm test:db
```

The tests use a small stand-in for Supabase's login pieces (`tests/shim.sql`), so they run on plain Postgres. With Docker you can instead run `supabase start` and point `DATABASE_URL` at it.
