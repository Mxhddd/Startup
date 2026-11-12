// v18 "Karachi, hand-painted": the new pages (Our story, Pilot progress, For schools),
// the school interest form, the night footer, the page scenes' stills, and calm with reduced motion.
import { expect, test, type Page } from '@playwright/test';

const stub = (page: Page, opts: { status?: number; summary?: string; seen?: string[] } = {}) => page.route('**/functions/v1/interest**', async (route) => {
  opts.seen?.push(route.request().postData() ?? route.request().url());
  const get = route.request().method() === 'GET';
  await route.fulfill({ status: get ? 200 : (opts.status ?? 200), contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: get ? (opts.summary ?? '{"areas":{},"proof":null}') : (opts.status ?? 200) === 200 ? '{"ok":true}' : '{"error":"server"}' });
});

test('the new pages open in both languages, each with its own scene, and nothing scrolls sideways', async ({ page }) => {
  await stub(page);
  for (const [path, h1] of [['/story', 'We wanted the 7 am call to stop.'], ['/progress', 'Where the pilot is'], ['/schools', 'A calmer school gate, later.'],
    ['/ur/story', 'ہم صبح سات بجے کی کال ختم کرنا چاہتے تھے۔'], ['/ur/schools', 'بعد میں، ایک پُرسکون اسکول گیٹ۔']] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    await expect(page.locator('.pscene img')).toHaveAttribute('src', /\/v18\/(story|progress|schools)\.webp$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('our story is signed by the team, with no names, and ends with a way to talk to us', async ({ page }) => {
  await page.goto('/story');
  await expect(page.getByRole('heading', { name: 'What we will never do' })).toBeVisible();
  await expect(page.locator('.nolist li')).toHaveCount(4);
  await expect(page.locator('.signoff')).toHaveText('Team Pohnch, Karachi');
  await expect(page.locator('.talk').getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', /wa\.me/);
});

test('pilot progress says "just starting" until there are numbers that are safe to show', async ({ page }) => {
  await stub(page);
  await page.goto('/progress');
  await expect(page.getByTestId('progress-start')).toContainText('We’re just starting.');
  await expect(page.getByTestId('progress-counts')).toHaveCount(0);
});

test('pilot progress counts families, areas and pilot numbers once the summary has them', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stub(page, { summary: '{"areas":{"gulshan":5,"dha":3},"proof":{"vans":4,"trips":63,"alerts":410}}' });
  await page.goto('/progress');
  const counts = page.getByTestId('progress-counts');
  await expect(counts).toContainText('8families waiting');
  await expect(counts).toContainText('2areas of Karachi');
  await expect(counts).toContainText('63trips tracked end to end');
  await expect(page.getByTestId('progress-start')).toHaveCount(0);
});

test('a school can leave its interest: name and office WhatsApp are needed', async ({ page }) => {
  const seen: string[] = [];
  await stub(page, { seen });
  await page.goto('/schools');
  await page.getByTestId('school-send').click();
  await expect(page.locator('form.school .msg')).toHaveText('Choose your area first.');
  await page.getByTestId('school-area').selectOption('gulshan');
  await page.getByTestId('school-send').click();
  await expect(page.locator('form.school .msg')).toHaveText('Please write the school’s name.');
  await page.getByTestId('school-name').fill('City School Gulshan');
  await page.getByTestId('school-send').click();
  await expect(page.locator('form.school .msg')).toHaveText('Please add a WhatsApp number for the office.');
  await page.getByTestId('school-wa').fill('0300 1112233');
  await page.getByTestId('school-send').click();
  await expect(page.getByTestId('school-sent')).toBeVisible();
  const sent = JSON.parse(seen.find((s) => s.includes('"kind":"join"'))!);
  expect(sent).toMatchObject({ kind: 'join', role: 'school', area: 'gulshan', school: 'City School Gulshan', whatsapp: '+923001112233', kids: null, website: '' });
});

test('if the server is down the school form says so and offers WhatsApp', async ({ page }) => {
  await stub(page, { status: 500 });
  await page.goto('/schools');
  await page.getByTestId('school-name').fill('City School');
  await page.getByTestId('school-area').selectOption('dha');
  await page.getByTestId('school-wa').fill('03001112233');
  await page.getByTestId('school-send').click();
  await expect(page.locator('form.school .msg')).toContainText('Couldn’t send');
  await expect(page.locator('form.school .msg').getByRole('link', { name: 'WhatsApp' })).toBeVisible();
});

test('the night footer links the new pages and carries a Pohnch line in both scripts', async ({ page }) => {
  await page.goto('/drivers');
  const foot = page.locator('footer.sitefoot');
  for (const [name, href] of [['Our story', '/story'], ['Pilot progress', '/progress'], ['For schools', '/schools']] as const) await expect(foot.getByRole('link', { name })).toHaveAttribute('href', href);
  await expect(foot.locator('.couplet b')).toHaveText('ہر بچہ، ہر صبح');
  await expect(foot.locator('.couplet blockquote span')).toHaveText('Every child, every morning');
  await page.goto('/?lite');
  await expect(page.locator('footer.sitefoot').getByRole('link', { name: 'Our story' })).toHaveAttribute('href', '/story');
});

test('with reduced motion nothing sways, tilts or twinkles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/story');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.sitefoot .fkite')!).animationName)).toBe('none');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.glints')!).display)).toBe('none');
  await expect(page.locator('.pscene')).not.toHaveClass(/live/);
});

test('the 404 shows the van at a dead end with a painted "wrong turn" board', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.locator('.wrongturn')).toContainText('Wrong turn');
  await expect(page.locator('.wrongturn')).toContainText('غلط موڑ');
});
