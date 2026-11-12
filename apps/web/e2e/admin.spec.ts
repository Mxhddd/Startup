import { expect, test, type BrowserContext } from '@playwright/test';

// The admin page talks to Supabase at http://127.0.0.1:9 in these tests; we answer those calls here.
const SB = 'http://127.0.0.1:9';
const USER = '00000000-0000-4000-8000-0000000000aa';
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
// v20: a team session that passed the second login step (authenticator app) carries aal2; tokenFor('aal1')
// is a session with only the phone code.
const tokenFor = (aal: string) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER, role: 'authenticated', aal, amr: [{ method: aal === 'aal2' ? 'totp' : 'otp', timestamp: 1 }], exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const sessionFor = (aal: string) => ({ access_token: tokenFor(aal), refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: USER, aud: 'authenticated', role: 'authenticated', factors: [] } });
const session = sessionFor('aal2');

const notices: unknown[] = [];

async function fakeSupabase(ctx: BrowserContext, opts: { loggedIn: boolean; admin: boolean; oneStep?: boolean }) {
  const calls: string[] = [];
  notices.length = 0;
  if (opts.loggedIn) await ctx.addInitScript((s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)), opts.oneStep ? sessionFor('aal1') : session);
  await ctx.route(`${SB}/**`, async (route) => {
    const u = new URL(route.request().url());
    calls.push(u.pathname);
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (u.pathname === '/rest/v1/admins') return json(opts.admin ? [{ user_id: USER }] : []);
    if (u.pathname === '/rest/v1/rpc/admin_stats') return json({ days: 7, trips: 10, tripsTracked: 8, familiesActive: 20, familiesWithAlerts: 9, alertsSent: 312, alertsFailed: 4 });
    if (u.pathname === '/rest/v1/rpc/admin_vans')
      return json([
        { van_id: 'v-new', van_name: 'Kamran bhai van', school_name: 'School', plate: null, driver_name: 'Kamran bhai', driver_phone: '923001112223', verified_at: null, switched_off_at: null, riders: 0, waiting: 2 },
        { van_id: 'v-ok', van_name: 'Rafiq bhai van', school_name: 'School', plate: 'KHI-1', driver_name: 'Rafiq bhai', driver_phone: '923004445556', verified_at: '2026-10-01T00:00:00Z', switched_off_at: null, riders: 9, waiting: 0 },
      ]);
    if (u.pathname === '/rest/v1/rpc/admin_trips_today')
      return json([{ trip_id: 't1', van_name: 'Rafiq bhai van', driver_name: 'Rafiq bhai', kind: 'morning', status: 'running', started_at: new Date().toISOString(), last_position_at: new Date(Date.now() - 20_000).toISOString(), riders: 9, done: 4 }]);
    if (u.pathname === '/functions/v1/app/admin.verify') return json({ ok: true });
    // v10 stage 2
    if (u.pathname === '/rest/v1/rpc/admin_flags') return json([]);
    // v12
    if (u.pathname === '/rest/v1/rpc/admin_speeding_today') return json([{ van_name: 'Rafiq bhai van', driver_name: 'Rafiq bhai', max_kmh: 63, fast_fixes: 4 }]);
    if (u.pathname === '/functions/v1/app/admin.notice') {
      notices.push(route.request().postDataJSON());
      return json({ id: 'n1' });
    }
    if (u.pathname === '/rest/v1/rpc/admin_help_alerts')
      return json([{ id: 'h1', van_name: 'Rafiq bhai van', driver_name: 'Rafiq bhai', lat: 24.9, lng: 67.1, created_at: new Date().toISOString(), resolved_at: null }]);
    if (u.pathname === '/rest/v1/rpc/admin_van_requests') return json([{ school_name: 'Green Valley', children: 5, lat: 24.9, lng: 67.1, oldest: new Date().toISOString() }]);
    if (u.pathname === '/rest/v1/rpc/admin_set_flag' || u.pathname === '/rest/v1/rpc/admin_resolve_help') return json(null);
    return json([]);
  });
  return calls;
}

test('logged out: only the team login form, and no data is asked for', async ({ context, page }) => {
  const calls = await fakeSupabase(context, { loggedIn: false, admin: false });
  await page.goto('/admin');
  await expect(page.getByTestId('admin-login')).toBeVisible();
  expect(calls.filter((c) => c.startsWith('/rest/'))).toEqual([]);
});

test('logged in but not on the team: "not for you", and no admin numbers are asked for', async ({ context, page }) => {
  const calls = await fakeSupabase(context, { loggedIn: true, admin: false });
  await page.goto('/admin');
  await expect(page.getByTestId('not-allowed')).toBeVisible();
  expect(calls.filter((c) => c.includes('/rpc/'))).toEqual([]);
});

test('the team sees the four numbers, the check queue, and verifies a driver', async ({ context, page }) => {
  const calls = await fakeSupabase(context, { loggedIn: true, admin: true });
  await page.goto('/admin');
  await expect(page.getByTestId('stat-tracked')).toContainText('80%');
  await expect(page.getByTestId('stat-live')).toContainText('45%');
  await expect(page.getByTestId('stat-alerts')).toContainText('312');
  await expect(page.getByTestId('queue-row')).toHaveCount(1);
  await expect(page.getByTestId('trip-row')).toContainText('4 / 9');
  await page.getByTestId('queue-row').getByRole('button').click();
  await expect.poll(() => calls.includes('/functions/v1/app/admin.verify')).toBe(true);
});

test('v10 stage 2: help alerts with the van on a map, the switch per van, requests by school', async ({ context, page }) => {
  const calls = await fakeSupabase(context, { loggedIn: true, admin: true });
  await page.goto('/admin');
  await expect(page.getByTestId('help-row')).toHaveCount(1);
  await expect(page.getByTestId('help-row').getByRole('link')).toHaveAttribute('href', /openstreetmap\.org\/\?mlat=24\.9&mlon=67\.1/);
  await expect(page.getByTestId('request-row')).toContainText('Green Valley');
  // The switch: everyone plus one row per verified van (the unverified one is not offered); all off.
  await expect(page.getByTestId('stage2-switch').getByRole('button')).toHaveCount(2);
  await page.getByTestId('stage2-switch').getByRole('button').last().click();
  await expect.poll(() => calls.includes('/rest/v1/rpc/admin_set_flag')).toBe(true);
  await page.getByTestId('help-row').getByRole('button').click();
  await expect.poll(() => calls.includes('/rest/v1/rpc/admin_resolve_help')).toBe(true);
});

test('v12: vans over 50 km/h today, and a team notice to one van', async ({ context, page }) => {
  await fakeSupabase(context, { loggedIn: true, admin: true });
  await page.goto('/admin');
  await expect(page.getByTestId('speed-row')).toContainText('63');
  await page.getByTestId('notice-van').selectOption('v-ok');
  await page.getByTestId('notice-body').fill('Road closed at Nipa today');
  await page.getByTestId('notice-send').click();
  await expect(page.getByRole('status')).toBeVisible();
  expect(notices).toEqual([{ vanId: 'v-ok', body: 'Road closed at Nipa today' }]);
});

test('v20: a team member with only the phone code is asked for the authenticator code, and sees no team data', async ({ context, page }) => {
  const calls = await fakeSupabase(context, { loggedIn: true, admin: true, oneStep: true });
  await page.goto('/admin');
  await expect(page.getByTestId('admin-mfa')).toBeVisible();
  await expect(page.getByTestId('admin-mfa')).toContainText('آتھنٹیکیٹر'); // the team page opens in Urdu
  expect(calls.filter((c) => c.includes('/rpc/'))).toEqual([]);
});

test('v20: when the login code cannot be sent by SMS, the page says so plainly', async ({ context, page }) => {
  await fakeSupabase(context, { loggedIn: false, admin: false });
  await context.route(`${SB}/auth/v1/otp**`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, error_code: 'hook_timeout', msg: 'Error running hook URI' }) }));
  await page.goto('/admin');
  await page.locator('#phone').fill('03001234567');
  await page.getByTestId('admin-login').getByRole('button').click();
  await expect(page.getByTestId('admin-login').getByRole('alert')).toContainText(/SMS/);
});
