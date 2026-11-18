// v24 /van-uncle: five answers give a result to share; a shared link opens the friend's result first.
import { expect, test } from '@playwright/test';

test('the quiz gives a result with a WhatsApp share link that carries only the result id', async ({ page }) => {
  await page.goto('/van-uncle');
  await page.getByTestId('vu-start').click();
  for (const a of [1, 2, 0, 3, 2]) await page.getByTestId(`vu-a${a}`).click();
  const result = page.getByTestId('vu-result');
  await expect(result).toHaveAttribute('data-type', 'paanch');
  await expect(page.getByTestId('vu-share')).toHaveAttribute('href', /wa\.me\/\?text=.*van-uncle%3Fr%3Dpaanch/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('a friend\'s link shows their result, then lets you take the quiz (in Urdu too)', async ({ page }) => {
  await page.goto('/ur/van-uncle?r=dj');
  await expect(page.getByTestId('vu-result')).toHaveAttribute('data-type', 'dj');
  await page.getByTestId('vu-take').click();
  await expect(page.getByTestId('vu-start')).toBeVisible();
  await page.goto('/van-uncle?r=<script>');
  await expect(page.getByTestId('vu-start')).toBeVisible();
});
