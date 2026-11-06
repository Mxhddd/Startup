import { expect, test } from '@playwright/test';

test('the home page is in Urdu, right to left, with the new headline and the WhatsApp number', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main).toHaveAttribute('dir', 'rtl');
  await expect(main).toHaveAttribute('lang', 'ur');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('وین کہاں ہے؟');
  await expect(page.getByRole('link', { name: /0300 1478729/ }).first()).toBeVisible();
});

test('the language switch opens the English page, left to right', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('main')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Where's the van?");
});

test('try it: holding the driver key sends the (pretend) push, and Undo takes it back', async ({ page }) => {
  await page.goto('/en');
  const key = page.getByTestId('try-key');
  await key.scrollIntoViewIfNeeded();
  const box = (await key.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1100);
  await page.mouse.up();
  await expect(page.getByTestId('try-say')).toHaveText('Ali is in the van · Rafiq bhai');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('try-say')).toHaveText('Undone. Nothing changed for the family.');
});

test('try it: a quick tap is not enough (hold to confirm), and "Off today" can be undone', async ({ page }) => {
  await page.goto('/en');
  await page.getByTestId('try-key').click();
  await expect(page.getByTestId('try-say')).toHaveText('');
  await page.getByTestId('try-chutti').click();
  await expect(page.getByTestId('try-say')).toHaveText('Rafiq bhai knows Ali is off today');
  await page.getByTestId('try-chutti').click();
  await expect(page.getByTestId('try-say')).toHaveText('Undone. Nothing changed for the family.');
});

test('a promise sticker flips over to explain itself', async ({ page }) => {
  await page.goto('/en');
  const s = page.getByTestId('sticker-1');
  const face = await s.locator('.f').boundingBox();
  expect(face!.width).toBeGreaterThan(120);
  expect(face!.height).toBeGreaterThan(100);
  await s.click();
  await expect(s).toHaveAttribute('aria-pressed', 'true');
  await expect(s).toContainText('never at other times');
});

test('the questions open with the keyboard', async ({ page }) => {
  await page.goto('/en');
  const q = page.locator('#faq summary').first();
  await q.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
});

for (const path of ['/', '/en', '/drivers', '/en/drivers', '/safety', '/download', '/delete-account', '/en/delete-account', '/terms', '/privacy', '/en/privacy']) {
  test(`no sideways scrolling on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
