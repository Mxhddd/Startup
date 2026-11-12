// The v16 inner pages: English at the root, Urdu under /ur, the store-required pages, the 404,
// the drivers page's demos and join form, the sitemap and robots.
import { expect, test } from '@playwright/test';

test('the delete-account page (needed for Google Play) explains both apps and the WhatsApp route', async ({ page }) => {
  await page.goto('/delete-account');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delete your account and data');
  await expect(page.getByText(/Pohnch Driver: "Help and account"/)).toBeVisible();
  await expect(page.getByText(/within 7 days/)).toBeVisible();
  await page.locator('.pbar .lang').click();
  await expect(page).toHaveURL(/\/ur\/delete-account$/);
  await expect(page.locator('.v16').first()).toHaveAttribute('dir', 'rtl');
});

test('the footer links every page the stores ask for', async ({ page }) => {
  await page.goto('/terms');
  const foot = page.locator('footer');
  for (const name of ['Privacy policy', 'Terms', 'Delete account', 'Safety', 'For drivers']) await expect(foot.getByRole('link', { name })).toBeVisible();
});

test('every page opens in both languages', async ({ page }) => {
  for (const [path, h1] of [['/drivers', 'Pohnch Driver: free for school van drivers'], ['/safety', 'Promises, not stickers.'], ['/download', 'Ready when your van is'], ['/terms', 'Terms of use'], ['/privacy', 'Privacy policy'], ['/ur/drivers', 'پہنچ ڈرائیور: اسکول وین ڈرائیورز کے لیے مفت'], ['/ur/safety', 'وعدے، اسٹیکر نہیں۔']] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('the privacy policy has a short summary and says how the pilot form is handled', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByText('In short')).toBeVisible();
  await expect(page.getByText(/WhatsApp numbers are deleted after 90 days/)).toBeVisible();
  await expect(page.getByText(/never asks for it/)).toBeVisible();
});

test('the drivers page lets drivers try the big button and join as a driver', async ({ page }) => {
  await page.route('**/functions/v1/interest**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }));
  await page.goto('/drivers');
  const hold = page.locator('.holdbtn');
  await hold.scrollIntoViewIfNeeded();
  const box = (await hold.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(1100); await page.mouse.up();
  await expect(hold).toContainText('Sent');
  await expect(page.getByRole('radio', { name: 'A van driver' })).toBeChecked();
  await page.getByTestId('join-area').selectOption('malir');
  await page.getByTestId('join-send').click();
  await expect(page.getByTestId('join-sent')).toBeVisible();
});

test('an unknown page shows the empty road with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-road');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This road doesn’t go anywhere.');
  await expect(page.getByRole('link', { name: 'Back to the home page' })).toBeVisible();
});

test('sitemap and robots: both languages listed, admin and invites kept out', async ({ request }) => {
  const map = await (await request.get('/sitemap.xml')).text();
  expect(map).toContain('/ur/delete-account');
  expect(map).toContain('/drivers');
  expect(map).not.toContain('/en/');
  expect(map).not.toContain('/admin');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).not.toContain('/admin'); // v20: not pointed at; noindex headers keep it out of search
  expect(robots).toContain('Disallow: /i/');
});
