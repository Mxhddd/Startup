// v19 "a real reason behind every part": the school-day dial and the live area meter, playing the
// driver, the painted arrival, and the "Everything you'd ask" hub (topics by click and by link).
import { expect, test, type Page } from '@playwright/test';

const toSection = (page: Page, sel: string, frac = 0) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s as string) as HTMLElement; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * (f as number));
}, [sel, frac] as const);
const METER = '{"areas":{"gulshan":5},"meter":{"gulshan":{"f":"3-9","d":"yes","s":"needs-families","m":"few"}},"proof":null}';
const stub = (page: Page, summary = METER) => page.route('**/functions/v1/interest**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: route.request().method() === 'GET' ? summary : '{"ok":true}' }));

test('the school-day dial opens at Karachi time, and moving it changes what a parent would see', async ({ page }) => {
  // 07:09 on a Monday in Karachi = 02:09 UTC: the van is at the door
  await page.clock.setFixedTime(new Date('2026-11-09T02:09:00Z'));
  await page.goto('/?lite');
  const cap = page.getByTestId('daycap');
  await expect(cap).toContainText('07:09');
  await expect(cap).toContainText('The van is at your door');
  const dial = page.getByTestId('daydial');
  await dial.focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await expect(cap).toContainText('06:59');
  await expect(cap).toContainText('The van is 10 min from your door');
  await dial.fill('461');
  await expect(cap).toContainText('Reached school');
});

test('at night the dial shows tomorrow morning and says so', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-09T17:00:00Z')); // 22:00 in Karachi
  await page.goto('/?lite');
  await expect(page.getByTestId('daycap')).toContainText('06:30');
  await expect(page.getByTestId('daystrip')).toContainText('It’s night in Karachi now');
});

test('picking an area shows its live meter in ranges, never exact numbers', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  const line = page.getByTestId('arealine');
  await line.getByRole('button', { name: /Pick your area/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Gulshan-e-Iqbal' }).click();
  await expect(line).toContainText('Gulshan-e-Iqbal: 3–9 families waiting · a driver interested · needs a few more families');
  await expect(line).not.toContainText('5');
  await line.getByRole('button', { name: 'Change area' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Saddar' }).click();
  await expect(line).toContainText('No one from Saddar yet. Be the first.');
});

test('the waiting map and the join thank-you use the same meter', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  await toSection(page, '#join');
  await expect(page.locator('.legend')).toBeVisible();
  await page.getByTestId('join-area').selectOption('gulshan');
  await page.getByPlaceholder('03XX XXXXXXX').fill('0300 1234567');
  await page.getByTestId('join-send').click();
  await expect(page.getByTestId('join-meter')).toContainText('3–9 families waiting');
});

test('you play the driver: holding Got in lights the parent’s phone', async ({ page }) => {
  await page.goto('/?lite');
  await toSection(page, '[data-sec=sides]', 0.7);
  await expect(page.getByTestId('youdrive')).toHaveText('You’re the driver now. Hold Got in.');
  await expect(page.locator('.sides .pp')).not.toContainText('Your child is in the van');
  const btn = page.getByTestId('gotin');
  await btn.focus();
  await page.keyboard.down('Enter'); await page.waitForTimeout(900); await page.keyboard.up('Enter');
  await expect(page.getByTestId('youdrive')).toHaveText('Sent. Look at the parent’s phone.');
  await expect(page.locator('.sides .pp')).toContainText('Your child is in the van');
});

test('scrolling on without holding taps it for you', async ({ page }) => {
  await page.goto('/?lite');
  await toSection(page, '[data-sec=sides]', 0.97);
  await expect(page.locator('.sides .pp')).toContainText('Your child is in the van');
});

test('with an area picked, the story names it', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  await page.getByRole('button', { name: /Show me how it works/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Gulshan-e-Iqbal' }).click();
  await toSection(page, '[data-sec=morning]', 0.2);
  await expect(page.locator('.tl')).toContainText('The van left for Gulshan-e-Iqbal');
  await expect(page.locator('.tl')).toContainText('6 min to your door in Gulshan-e-Iqbal');
});

test('پہنچ گئے arrives on a painted panel, fully inside it', async ({ page }) => {
  await page.goto('/?lite');
  await toSection(page, '[data-sec=morning]', 0.995);
  const arrive = page.getByTestId('arrive');
  await expect.poll(() => arrive.evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(0.95);
  const [panel, word] = await page.evaluate(() => [document.querySelector('.arrpanel')!.getBoundingClientRect().toJSON(), document.querySelector('.arrword text')!.getBoundingClientRect().toJSON()]);
  expect(word.top).toBeGreaterThanOrEqual(panel.top);
  // nothing can cut the letters off (the old version masked the top of the words away)
  expect(await page.locator('.arrword').evaluate((e) => getComputedStyle(e).overflow)).toBe('visible');
  expect(word.top).toBeGreaterThanOrEqual(0);
  await expect(page.locator('.arrsub')).toHaveText('Reached school · 7:41');
});

test('#safety and the menu open their hub topic', async ({ page }) => {
  await page.goto('/?lite#safety');
  await expect(page.getByTestId('hub-safety')).toBeVisible();
  await expect(page.getByTestId('hub-safety').locator('.promlist li')).toHaveCount(7);
  await expect(page.getByTestId('hub-how')).toBeHidden();
  await page.locator('.menub').click();
  await page.locator('#menu').getByRole('link', { name: 'Questions' }).click();
  await expect(page.getByTestId('hub-questions')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('hub')!.getBoundingClientRect().top < innerHeight)).toBe(true);
});

test('on phones the hub is an accordion: tapping an open topic closes it', async ({ page }) => {
  await page.goto('/?lite');
  await toSection(page, '#hub');
  const tab = page.locator('[data-topic=privacy]');
  await tab.click();
  await expect(tab).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('hub-privacy').locator('.nolist li')).toHaveCount(4);
  await tab.click();
  await expect(tab).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('hub-privacy')).toBeHidden();
});

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1280, height: 860 }, isMobile: false, hasTouch: false });
  test('topics sit on the left and the open one fills the right', async ({ page }) => {
    await page.goto('/?lite');
    await toSection(page, '#hub');
    await page.locator('[data-topic=cost]').click();
    const [tab, panel] = await page.evaluate(() => [document.querySelector('[data-topic=cost]')!.getBoundingClientRect().toJSON(), document.querySelector('[data-testid=hub-cost]')!.getBoundingClientRect().toJSON()]);
    expect(panel.left).toBeGreaterThan(tab.right);
    await page.locator('[data-topic=cost]').click();
    await expect(page.getByTestId('hub-cost')).toBeVisible();
    await expect(page.getByTestId('hub-cost')).toContainText('calls a school year you won’t have to make.');
  });
});

test('the Urdu page has the hub and the arrival, right to left', async ({ page }) => {
  await page.goto('/ur?lite');
  await expect(page.locator('#hub')).toContainText('آپ کے ہر سوال کا جواب');
  await expect(page.locator('.arrword text')).toHaveText('پہنچ گئے');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
