// v21 pohnch.pk/app: the poster's QR code lands here. A person picks parent or driver and gets the three
// steps for that app (testers' group, become a tester, install), each opening the right Google page; the
// choice survives in the address; Urdu reads right to left; it fits a 320-wide phone.
import { expect, test } from '@playwright/test';

test('a parent gets the parent app\'s three steps, in order', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Who are you?');
  await page.getByTestId('join-parent').click();
  await expect(page.getByTestId('join-parent')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('join-step-1')).toHaveAttribute('href', 'https://groups.google.com/g/pohnch-testers');
  await expect(page.getByTestId('join-step-2')).toHaveAttribute('href', 'https://play.google.com/apps/testing/pk.pohnch.parent');
  await expect(page.getByTestId('join-step-3')).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=pk.pohnch.parent');
  expect(page.url()).toContain('#parent');
});

test('a driver gets the driver app, and a shared #driver link opens on it', async ({ page }) => {
  await page.goto('/app#driver');
  await expect(page.getByTestId('join-driver')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('join-step-2')).toHaveAttribute('href', 'https://play.google.com/apps/testing/pk.pohnch.driver');
});

test('each step ticks off once tapped', async ({ page, context }) => {
  await page.goto('/app');
  await page.getByTestId('join-parent').click();
  const popup = context.waitForEvent('page').catch(() => null);
  await page.route('https://groups.google.com/**', (r) => r.fulfill({ status: 200, body: 'ok' }));
  await page.getByTestId('join-step-1').click();
  await popup;
  await expect(page.locator('.joinroute li').first()).toHaveClass(/done/);
  await expect(page.locator('.joinroute li').nth(1)).toHaveClass(/now/);
});

test('Urdu reads right to left and nothing spills off a 320-wide phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/ur/app');
  await expect(page.locator('.v16')).toHaveAttribute('dir', 'rtl');
  await page.getByTestId('join-driver').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
