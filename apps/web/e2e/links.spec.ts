// v22 /links: the standee's QR page lists every Pohnch link, the app first, in both languages.
import { expect, test } from '@playwright/test';

test('/links lists every link with the app first, and fits a phone', async ({ page }) => {
  await page.goto('/links');
  const links = page.locator('.linkhub li a');
  await expect(links).toHaveCount(9);
  await expect(links.first()).toHaveAttribute('href', '/app');
  await expect(page.getByTestId('link-wa')).toHaveAttribute('href', /wa\.me\/923001478729/);
  await expect(page.getByTestId('link-ig')).toHaveAttribute('href', 'https://www.instagram.com/pohnch.pk/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('/ur/links is in Urdu, right to left', async ({ page }) => {
  await page.goto('/ur/links');
  await expect(page.locator('.v16').first()).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('link-app')).toHaveAttribute('href', '/ur/app');
});
