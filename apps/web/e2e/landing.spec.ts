import { expect, test } from '@playwright/test';

test('the home page is in Urdu, right to left, with the WhatsApp number', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main).toHaveAttribute('dir', 'rtl');
  await expect(main).toHaveAttribute('lang', 'ur');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('آپ کے بچے کی وین، آپ کے فون پر');
  await expect(page.getByRole('link', { name: /0300 1478729/ })).toBeVisible();
});

test('the language switch opens the English page, left to right', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('main')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Your child's school van, on your phone");
});

test('no sideways scrolling, even at 320 px wide', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
