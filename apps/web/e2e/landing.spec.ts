import { expect, test, type Page } from '@playwright/test';

// The home page is the city journey: one gesture = one scene. window.__journey exposes the scene for tests.
const scene = (page: Page) => page.evaluate(() => (window as unknown as { __journey: { scene: number } }).__journey.scene);
const settle = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => (window as unknown as { __journey: { busy: boolean } }).__journey.busy), { timeout: 6000 }).toBe(false);
};
const jump = (page: Page, i: number) => page.evaluate((n) => (window as unknown as { __journey: { jump: (n: number) => void } }).__journey.jump(n), i);

test('the home page is in Urdu, right to left, and says what Pohnch is', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main).toHaveAttribute('dir', 'rtl');
  await expect(main).toHaveAttribute('lang', 'ur');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('وین کہاں ہے؟');
});

test('the language switch opens the English journey, left to right', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('main')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('the van?');
});

test('one small scroll moves exactly one scene, forward and back', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the wheel is for desktops; swipes are covered below');
  await page.goto('/');
  await page.waitForFunction(() => 'window' in globalThis && (window as unknown as { __journey?: unknown }).__journey);
  await page.mouse.move(200, 300);
  for (let v = 60; v > 1; v *= 0.9) { await page.mouse.wheel(0, v); await page.waitForTimeout(16); } // a flick with momentum
  await settle(page);
  expect(await scene(page)).toBe(1);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -50);
  await settle(page);
  expect(await scene(page)).toBe(0);
});

test('a swipe on a phone moves one scene', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await page.evaluate(() => {
    const mk = (type: string, y: number) => { const t = new Touch({ identifier: 1, target: document.body, clientX: 150, clientY: y }); document.body.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true })); };
    mk('touchstart', 500); for (let i = 1; i <= 6; i++) mk('touchmove', 500 - i * 25); mk('touchend', 350);
  });
  await settle(page);
  expect(await scene(page)).toBe(1);
});

test('the arrow keys step through the scenes', async ({ page }) => {
  await page.goto('/en');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await page.keyboard.press('ArrowDown'); await settle(page);
  await page.keyboard.press('ArrowDown'); await settle(page);
  expect(await scene(page)).toBe(2);
});

test('hold to tap: the driver holds, the family hears; Undo takes it back', async ({ page }) => {
  await page.goto('/en');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await jump(page, 3); await settle(page);
  const hold = page.locator('#hold');
  await expect(hold).toBeVisible();
  const box = (await hold.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(1100); await page.mouse.up();
  await expect(hold).toContainText('Sent: Ali is in the van');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#undo')).toHaveText('Undone. Nothing went to anyone.');
});

test('a promise signboard turns over to explain itself', async ({ page }) => {
  await page.goto('/en');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await jump(page, 4); await settle(page);
  const board = page.locator('.board').nth(1);
  await expect(board).toBeVisible();
  await board.click();
  await expect(board).toHaveAttribute('aria-pressed', 'true');
  await expect(board).toContainText('never asks for your location');
});

test('the end: questions open with the keyboard, and the footer has the store pages', async ({ page }) => {
  await page.goto('/en');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await page.keyboard.press('End'); await settle(page);
  const panel = page.locator('#panel');
  await expect(panel).toBeVisible();
  const q = panel.locator('summary').first();
  await q.focus(); await page.keyboard.press('Enter');
  await expect(panel.locator('details').first()).toHaveAttribute('open', '');
  for (const name of ['Privacy policy', 'Terms', 'Delete account']) await expect(panel.getByRole('link', { name })).toBeVisible();
});

test('with "reduce motion" the scenes still change, without flights', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/en');
  await page.waitForFunction(() => (window as unknown as { __journey?: unknown }).__journey);
  await page.keyboard.press('ArrowDown'); await settle(page);
  expect(await scene(page)).toBe(1);
  await ctx.close();
});

for (const path of ['/', '/en', '/drivers', '/en/drivers', '/safety', '/download', '/delete-account', '/en/delete-account', '/terms', '/privacy', '/en/privacy']) {
  test(`no sideways scrolling on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
