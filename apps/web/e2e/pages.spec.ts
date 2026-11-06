import { expect, test } from '@playwright/test';

test('the delete-account page (needed for Google Play) explains both apps and the WhatsApp route', async ({ page }) => {
  await page.goto('/en/delete-account');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delete your account and data');
  await expect(page.getByText(/Pohnch Driver: "Help and account"/)).toBeVisible();
  await expect(page.getByText(/within 7 days/)).toBeVisible();
  await page.getByRole('link', { name: 'اردو' }).click();
  await expect(page).toHaveURL(/\/delete-account$/);
  await expect(page.locator('main')).toHaveAttribute('dir', 'rtl');
});

test('the footer links every page the stores ask for', async ({ page }) => {
  await page.goto('/en/terms');
  const foot = page.locator('footer');
  for (const name of ['Privacy policy', 'Terms', 'Delete account', 'Safety', 'Drivers']) {
    await expect(foot.getByRole('link', { name })).toBeVisible();
  }
});

test('drivers, safety, download and terms open in both languages', async ({ page }) => {
  for (const [path, h1] of [['/en/drivers', 'Pohnch Driver: free for school van drivers'], ['/en/safety', 'Our promises'], ['/en/download', 'Get Pohnch'], ['/en/terms', 'Terms of use'], ['/drivers', 'پہنچ ڈرائیور: اسکول وین ڈرائیورز کے لیے مفت']] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
  }
});

test('an unknown page shows the lost-van page with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-road');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /واپس گھر/ })).toBeVisible();
});

test('sitemap and robots: public pages listed, admin and invites kept out', async ({ request }) => {
  const map = await (await request.get('/sitemap.xml')).text();
  expect(map).toContain('/en/delete-account');
  expect(map).not.toContain('/admin');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /admin');
  expect(robots).toContain('Disallow: /i/');
});
