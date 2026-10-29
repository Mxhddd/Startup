# Accounts, keys and settings you need

Everything below is free for the pilot. Limits change, so B9 re-checks the current free limits and prices before launch.

| # | What | Free? | Needed by |
| --- | --- | --- | --- |
| 1 | Node.js LTS and git on your laptop | Free | B1 |
| 2 | GitHub account and this repo (`Mxhddd/Startup`) | Free | already done |
| 3 | Supabase account and one project | Free plan | B2 |
| 4 | VAPID keys for web push | Free, no account | B5 |
| 5 | `ADMIN_TOKEN` (a long random secret) | Free, no account | B7 |
| 6 | Vercel account (Hobby plan) | Free, **non-commercial use only** | B9 |
| 7 | Test phones: one Android with Chrome, one iPhone on iOS 16.4 or newer | Your own | B4–B9 |
| 8 | Your own domain | Optional, paid | not needed; `*.vercel.app` works |

## Exact steps

### 1. Node.js and git
1. Install the current LTS version of Node.js from nodejs.org.
2. Check in a terminal: `node -v` and `git --version` both print a version.

### 3. Supabase
1. Sign up at supabase.com (you can use your GitHub login).
2. Create a new organisation (Free plan), then **New project**. Name it `pohnch`, set a strong database password (save it in a password manager), choose the region closest to Pakistan (for example Mumbai or Singapore).
3. When it is ready, open **Project Settings → API** (or **API Keys**) and copy:
   - the **Project URL** → `SUPABASE_URL`
   - the **secret** key (called `service_role` on older projects) → `SUPABASE_SECRET_KEY`. This key bypasses row-level security: it goes only in server environment variables, never in the browser or in git.
4. You will not need the public "anon"/"publishable" key: Pohnch never talks to Supabase from the browser.
5. Note: free projects pause after about a week with no activity; open the dashboard to resume one.

### 4. VAPID keys (web push)
1. After B1, run `npx web-push generate-vapid-keys` in the project folder.
2. Copy the public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key to `VAPID_PRIVATE_KEY`.
3. Set `VAPID_SUBJECT` to `mailto:` followed by an email address you read.

### 5. ADMIN_TOKEN
1. Run `openssl rand -base64 48` (or `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
2. Put the result in `ADMIN_TOKEN`. You open the admin page once as `/admin?key=<token>`.

### 6. Vercel (at B9)
1. Sign up at vercel.com with your GitHub account, Hobby plan.
2. **Add New → Project**, import `Mxhddd/Startup`.
3. In **Settings → Environment Variables**, add every variable from `.env.example` for Production (and Preview if you use it).
4. Hobby is for non-commercial use. Before charging any family, move to a paid plan or another host (B9 lists the options).

## Environment variables (names only; values never go in git)

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
ADMIN_TOKEN=
APP_URL=
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is the only one that reaches the browser, and it is meant to be public.
