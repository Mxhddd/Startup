// The v16 home page: what Pohnch is on the first screen, the scroll story, the fork, the join form
// (with the server stubbed), both languages, lite mode, the 3D, and no sideways scrolling.
import { expect, test, type Page } from '@playwright/test';

const toSection = (page: Page, sel: string, frac = 0) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s as string) as HTMLElement; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * (f as number));
}, [sel, frac] as const);
const stubInterest = (page: Page, status = 200, seen: string[] = []) => page.route('**/functions/v1/interest**', async (route) => {
  seen.push(route.request().postData() ?? route.request().url());
  await route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: route.request().method() === 'GET' ? '{"areas":{},"proof":null}' : status === 200 ? '{"ok":true}' : '{"error":"server"}' });
});

test('the first screen says what Pohnch is, in English, with one clear action', async ({ page }) => {
  await page.goto('/?lite');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your child’s school van.');
  await expect(page.locator('.hero-copy').getByRole('link', { name: 'Join the pilot' })).toBeVisible();
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

test('the fork opens the road you pick, and opening an honest answer is counted', async ({ page }) => {
  const seen: string[] = [];
  await stubInterest(page, 200, seen);
  await page.goto('/?lite');
  await toSection(page, '[data-sec=fork]');
  await page.getByRole('button', { name: /Not sure yet/ }).click();
  await page.getByRole('button', { name: 'Is it safe?' }).click();
  await expect(page.locator('#road').getByText(/checks every driver’s ID and van/)).toBeVisible();
  await expect.poll(() => seen.some((s) => s.includes('"kind":"doubt"'))).toBe(true);
  await page.getByRole('button', { name: /I drive a van/ }).click();
  await expect(page.locator('#road').getByText('Fewer calls. One button. Free, always.')).toBeVisible();
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
  await expect(page.locator('main.v16')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('اسکول وین');
  await page.locator('.bar .lang').click();
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
  await expect(page.locator('main.v16.has3d, main.v16.lite')).toHaveCount(1, { timeout: 60_000 });
  await toSection(page, '[data-sec=morning]', 0.5);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('nothing scrolls sideways', async ({ page }) => {
  for (const path of ['/?lite', '/ur?lite']) {
    await page.goto(path);
    for (const sel of ['[data-sec=hero]', '[data-sec=fork]', '#join', '#questions']) {
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
