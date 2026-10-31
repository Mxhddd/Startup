import { expect, test } from '@playwright/test';

const TOKEN = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde';

test('the privacy policy reads in Urdu and English and says what is never kept', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('main')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('پرائیویسی پالیسی');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
  await expect(page.getByText(/never asks for it/)).toBeVisible();
});

test('the home page links to the privacy policy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'پرائیویسی پالیسی' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test('an invite link opens the apps, and the token never leaves the browser', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const res = await page.goto(`/i/${TOKEN}`);
  expect(res?.headers()['referrer-policy']).toBe('no-referrer');
  expect(res?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.getByTestId('open-parent')).toHaveAttribute('href', `pohnch://i/${TOKEN}`);
  await expect(page.getByTestId('open-driver')).toHaveAttribute('href', `pohnch-driver://i/${TOKEN}`);
  // Only the page itself carries the token; no other request (scripts, fonts, data) does.
  expect(requests.filter((u) => u.includes(TOKEN))).toEqual([requests[0]]);
});

test('a broken invite link says so calmly', async ({ page }) => {
  await page.goto('/i/short');
  await expect(page.getByRole('alert').filter({ hasText: 'This link is incomplete' })).toBeVisible();
});

test('the app-link files are served for iPhone and Android', async ({ request }) => {
  const apple = await (await request.get('/.well-known/apple-app-site-association')).json();
  expect(apple.applinks.details[0].components[0]['/']).toBe('/i/*');
  const android = await (await request.get('/.well-known/assetlinks.json')).json();
  expect(android[0].target.package_name).toBe('pk.pohnch.parent');
});
