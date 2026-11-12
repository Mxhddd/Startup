// The v16 home page: what Pohnch is on the first screen, the scroll story, the hub, the join form
// (with the server stubbed), both languages, lite mode, the 3D, and no sideways scrolling.
import { expect, test, type Page } from '@playwright/test';

const toSection = (page: Page, sel: string, frac = 0) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s as string) as HTMLElement; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * (f as number));
}, [sel, frac] as const);
const stubInterest = (page: Page, status = 200, seen: string[] = []) => page.route('**/functions/v1/interest**', async (route) => {
  seen.push(route.request().postData() ?? route.request().url());
  await route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: route.request().method() === 'GET' ? '{"areas":{},"proof":null}' : status === 200 ? '{"ok":true}' : '{"error":"server"}' });
});

test('the intro plays in full on every visit and can be skipped', async ({ page }) => {
  await page.goto('/?lite');
  const intro = page.getByTestId('intro');
  await expect(intro).toBeVisible();
  await page.keyboard.press('Space');
  await expect(intro).toHaveCount(0, { timeout: 3000 });
  await page.reload();
  await expect(page.getByTestId('intro')).toBeVisible();
  await expect(page.locator('.intro.short')).toHaveCount(0);
  await expect(page.getByTestId('intro')).toHaveCount(0, { timeout: 15000 });
});

test('with reduced motion there is no intro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lite');
  await expect(page.getByTestId('intro')).toHaveCount(0);
});

test('the front door sums Pohnch up for parents and for drivers, in English', async ({ page }) => {
  await page.goto('/?lite');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your child’s school van, live.');
  await expect(page.getByTestId('door-parent').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('door-driver').locator('li')).toHaveCount(3);
  await expect(page.locator('.bar').getByRole('link', { name: 'Join the pilot' })).toBeAttached();
});

test('For parents asks where you live, starts the story, and fills the join form with your area', async ({ page }) => {
  await page.goto('/?lite');
  await page.getByRole('button', { name: /Show me how it works/ }).click();
  await expect(page.getByRole('dialog', { name: 'Where do you live?' })).toBeVisible();
  await page.getByRole('button', { name: 'Gulshan-e-Iqbal' }).click();
  await expect(page).toHaveURL(/#parents$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.evaluate(() => document.querySelector('#join')!.scrollIntoView());
  await expect(page.getByTestId('join-area')).toHaveValue('gulshan');
});

test('Skip goes straight into the story without an area', async ({ page }) => {
  await page.goto('/?lite');
  await page.getByRole('button', { name: /Show me how it works/ }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.evaluate(() => document.querySelector('#join')!.scrollIntoView());
  await expect(page.getByTestId('join-area')).toHaveValue('');
});

test('For drivers opens the drivers page', async ({ page }) => {
  await page.goto('/?lite');
  await page.getByRole('link', { name: /See the driver app/ }).click();
  await expect(page).toHaveURL(/\/drivers$/);
});

test('the site counts visits, and the old fork, promises and Play are gone', async ({ page }) => {
  await page.goto('/?lite');
  await expect(page.locator('script[src*="insights"], script[src*="vercel-scripts"]')).toHaveCount(1);
  for (const sec of ['fork', 'promises', 'never', 'calc', 'band', 'faq', 'try']) await expect(page.locator(`[data-sec=${sec}]`)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Play the morning/ })).toHaveCount(0);
});

test('the 7 am calls are struck through as you scroll, and the steps follow the scroll', async ({ page }) => {
  await page.goto('/?lite');
  await toSection(page, '[data-sec=calls]', 0.3);
  await expect(page.locator('.log li.on').first()).toBeVisible();
  await toSection(page, '[data-sec=calls]', 0.9);
  await expect(page.locator('[data-sec=calls]')).toHaveClass(/off/);
  await toSection(page, '[data-sec=morning]', 0.95);
  await expect(page.locator('.tl li.on')).toHaveCount(4);
  await toSection(page, '[data-sec=morning]', 0.1);
  await expect(page.locator('.tl li.on')).toHaveCount(1);
});

test('the hub opens a topic at a time, and opening an honest answer is counted', async ({ page }) => {
  const seen: string[] = [];
  await stubInterest(page, 200, seen);
  await page.goto('/?lite');
  await toSection(page, '#hub');
  await expect(page.getByTestId('hub-how')).toContainText('Here’s how it starts.');
  await page.getByRole('button', { name: 'Questions', exact: true }).click();
  await expect(page.getByTestId('hub-how')).toBeHidden();
  await page.getByTestId('hub-questions').getByText('Is it safe?').click();
  await expect(page.getByTestId('hub-questions').getByText(/checks every driver’s ID and van/)).toBeVisible();
  await expect.poll(() => seen.some((s) => s.includes('"kind":"doubt"'))).toBe(true);
});

test('joining the pilot sends the form and says thank you', async ({ page }) => {
  const seen: string[] = [];
  await stubInterest(page, 200, seen);
  await page.goto('/?lite');
  await toSection(page, '#join');
  await page.getByTestId('join-send').click();
  await expect(page.getByText('Choose your area first.')).toBeVisible();
  await page.getByTestId('join-area').selectOption('gulshan');
  await page.getByPlaceholder('03XX XXXXXXX').fill('0300 1234567');
  await page.getByTestId('join-send').click();
  await expect(page.getByTestId('join-sent')).toBeVisible();
  const sent = JSON.parse(seen.find((s) => s.includes('"kind":"join"'))!);
  expect(sent).toMatchObject({ kind: 'join', role: 'parent', area: 'gulshan', whatsapp: '+923001234567', website: '' });
});

test('if the server is down the form says so and offers WhatsApp', async ({ page }) => {
  await stubInterest(page, 500);
  await page.goto('/?lite');
  await toSection(page, '#join');
  await page.getByTestId('join-area').selectOption('dha');
  await page.getByTestId('join-send').click();
  await expect(page.locator('.send .msg')).toContainText('Couldn’t send');
});

test('Urdu lives under /ur, right to left, with a way back to English', async ({ page }) => {
  await page.goto('/ur?lite');
  await expect(page.locator('.v16').first()).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('اسکول وین');
  await expect(page.getByTestId('door-parent')).toContainText('والدین کے لیے');
  // on phones the language switch sits in the menu (the top bar keeps the small join button)
  await page.locator('.menub').click();
  await page.locator('#menu a[hreflang], #menu a[href="/"]').last().click();
  await expect(page).toHaveURL(/\/$/);
});

test('old English links (/en/...) move to the new addresses', async ({ request }) => {
  const r = await request.get('/en/privacy', { maxRedirects: 0 });
  expect(r.status()).toBe(308);
  expect(r.headers().location).toBe('/privacy');
});

test('the 3D city loads on a capable browser, with no page errors', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubInterest(page);
  await page.goto('/');
  await expect(page.locator('.v16.has3d, .v16.lite')).toHaveCount(1, { timeout: 60_000 });
  await toSection(page, '[data-sec=morning]', 0.5);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('nothing scrolls sideways', async ({ page }) => {
  for (const path of ['/?lite', '/ur?lite']) {
    await page.goto(path);
    for (const sel of ['[data-sec=hero]', '[data-sec=sides]', '#hub', '#join']) {
      await toSection(page, sel);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  }
});

test('with reduced motion the page still tells the whole story', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lite');
  await toSection(page, '[data-sec=lock]', 0.9);
  await expect(page.locator('.lp')).toHaveClass(/here/);
});
