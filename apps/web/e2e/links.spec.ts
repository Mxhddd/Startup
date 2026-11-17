// v23 /links: the standee's QR page. Six links (app first), truck-art crown, fits a phone, both languages.
import { expect, test } from '@playwright/test';

test('/links has the six links, the app first, and fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/links');
  await expect(page.locator('.lk-main a')).toHaveCount(6);
  await expect(page.locator('.lk-main a').first()).toHaveAttribute('href', '/app');
  await expect(page.getByTestId('link-wa')).toHaveAttribute('href', /wa\.me\/923001478729/);
  await expect(page.getByTestId('link-site')).toHaveAttribute('href', '/');
  await expect(page.getByTestId('link-ig')).toHaveAttribute('href', 'https://www.instagram.com/pohnch.pk/');
  await expect(page.getByTestId('link-tt')).toHaveAttribute('href', 'https://www.tiktok.com/@pohnch.pk');
  await expect(page.getByTestId('link-privacy')).toHaveAttribute('href', '/privacy');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('/ur/links is in Urdu, right to left', async ({ page }) => {
  await page.goto('/ur/links');
  await expect(page.locator('.lk')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('link-app')).toHaveAttribute('href', '/ur/app');
});
