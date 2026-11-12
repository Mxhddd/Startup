// v20 "polish, not features": the design rules checked in a real browser. Text is never under 14 px,
// key text meets 4.5:1 contrast, tap targets are 44 px (Got in 64 px), every control shows a focus ring,
// the area dialog keeps focus and gives it back, Urdu reads at line-height 1.6, the area numbers say
// "checking" or "couldn't check" instead of "be the first", Safety and Drivers open topics from links, a
// stuttering phone switches to the painted pictures, and opening the menu never hides the 3D.
import { expect, test, type Page } from '@playwright/test';

const toSection = (page: Page, sel: string, frac = 0) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s as string) as HTMLElement; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * (f as number));
}, [sel, frac] as const);
const stub = (page: Page, opts: { status?: number; delay?: number; body?: string } = {}) => page.route('**/functions/v1/interest**', async (route) => {
  if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
  await route.fulfill({ status: opts.status ?? 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: opts.body ?? '{"areas":{},"meter":{},"proof":null}' });
});
const PAGES = ['/?lite', '/ur?lite', '/drivers', '/safety', '/privacy', '/story', '/progress', '/schools', '/download', '/ur/safety'];

/** Visible text smaller than 14 px, outside the drawn phones and decorative art. */
const smallText = (page: Page) => page.evaluate(() => {
  const bad: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement; if (!el || !n.textContent?.trim()) continue;
    if (el.closest('.v-phone, [aria-hidden="true"], .intro, svg, .sr, .trap, script, style, noscript')) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 13.95) bad.push(`${fs}px "${n.textContent.trim().slice(0, 30)}" in .${el.className}`);
  }
  return bad;
});

test('no visible text is smaller than 14 px, on any page', async ({ page }) => {
  await stub(page);
  for (const path of PAGES) {
    await page.goto(path);
    expect(await smallText(page), path).toEqual([]);
  }
});

test('labels, leads and captions meet 4.5:1 contrast against what is behind them', async ({ page }) => {
  await stub(page);
  const ratio = (path: string, sel: string) => page.evaluate((s) => {
    const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const out: number[] = [];
    document.querySelectorAll<HTMLElement>(s).forEach((el) => {
      if (!el.getClientRects().length) return;
      let bg: number[] | null = null;
      // night sections paint their ground as a gradient image, so count them as night
      for (let a: HTMLElement | null = el; a; a = a.parentElement) { if (a.matches('.night, .pnight, .sitefoot')) { bg = [16, 22, 47]; break; } const c = rgb(getComputedStyle(a).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.85) { bg = c; break; } }
      if (!bg) return;
      const fg = lum(rgb(getComputedStyle(el).color)), b = lum(bg);
      out.push((Math.max(fg, b) + 0.05) / (Math.min(fg, b) + 0.05));
    });
    return out;
  }, sel).then((r) => ({ path, sel, min: Math.min(...r, 99) }));
  await page.goto('/?lite');
  for (const sel of ['.hub .kick', '.hublead', '.hubtab', '.hubpanel p', '.qa summary', '.sitefoot small', '.sitefoot nav a', '.join .kick', '.waitmap .how', '.fld small']) {
    const r = await ratio('/', sel); expect(r.min, `${r.sel}`).toBeGreaterThanOrEqual(4.5);
  }
  await page.goto('/privacy');
  for (const sel of ['.toc a', '.doc article p', '.summary dd']) { const r = await ratio('/privacy', sel); expect(r.min, r.sel).toBeGreaterThanOrEqual(4.5); }
});

test('tap targets are at least 44 px on a phone, and Got in at least 64 px', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  await page.keyboard.press('Escape');
  const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.bar a, .bar button, .btn, .link, .hubtab, .qa summary, .seg button, fieldset.seg span, .sitefoot nav a, .area-list button, .undo, .stepper button, .chapters a')]
    .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
    .map((e) => ({ t: (e.textContent ?? '').trim().slice(0, 24) || e.className, h: e.getBoundingClientRect().height }))
    .filter((x) => x.h < 43.5));
  expect(small).toEqual([]);
  await toSection(page, '[data-sec=sides]', 0.7);
  expect((await page.getByTestId('gotin').boundingBox())!.height).toBeGreaterThanOrEqual(63.5);
});

test('every control shows a focus ring when reached with the keyboard', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  await page.keyboard.press('Escape');
  const missing: string[] = [];
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null; if (!el || el === document.body) return null;
      const target = el.matches('fieldset.seg input') ? el.nextElementSibling as HTMLElement : el;
      const cs = getComputedStyle(target);
      return { ok: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, what: `${el.tagName}.${el.className} ${(el.textContent ?? '').trim().slice(0, 20)}` };
    });
    if (r && !r.ok) missing.push(r.what);
  }
  expect(missing).toEqual([]);
});

test('the area dialog keeps focus inside, closes on Escape and gives focus back', async ({ page }) => {
  await stub(page);
  await page.goto('/?lite');
  await page.keyboard.press('Escape');
  const opener = page.getByTestId('arealine').getByRole('button');
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.area-sheet'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('Urdu text reads at line-height 1.6 or more (big Gulzar headlines aside)', async ({ page }) => {
  await stub(page);
  for (const path of ['/ur?lite', '/ur/safety', '/ur/drivers']) {
    await page.goto(path);
    const tight = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('p, li, b, span, a, button, summary, label, dd, dt, small, h3, h4')]
      .filter((e) => e.getClientRects().length && /[؀-ۿ]/.test([...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')))
      .filter((e) => !e.closest('.v-phone, [aria-hidden="true"], .intro, .couplet, .mark, svg'))
      .map((e) => { const cs = getComputedStyle(e); return { t: (e.textContent ?? '').trim().slice(0, 20), lh: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize), f: cs.fontFamily }; })
      .filter((x) => !/Gulzar/i.test(x.f.split(',')[0] ?? '') && Number.isFinite(x.lh) && x.lh < 1.55));
    expect(tight, path).toEqual([]);
  }
});

const skipIntro = async (page: Page) => { await expect(page.getByTestId('intro')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByTestId('intro')).toHaveCount(0); };
const pickGulshan = async (page: Page) => { await page.getByTestId('arealine').getByRole('button').click(); await page.getByRole('dialog').getByRole('button', { name: 'Gulshan-e-Iqbal' }).click(); };

test('while the area numbers load, the area line says it is checking', async ({ page }) => {
  await stub(page, { delay: 20000 });
  await page.goto('/?lite');
  await skipIntro(page);
  await pickGulshan(page);
  await expect(page.getByTestId('arealine')).toContainText('Checking Gulshan-e-Iqbal');
});

test('if the area numbers fail, the site says so and never says "be the first"', async ({ page }) => {
  await stub(page, { status: 500 });
  await page.goto('/?lite');
  await skipIntro(page);
  await pickGulshan(page);
  await expect(page.getByTestId('arealine')).toContainText('Couldn’t check Gulshan-e-Iqbal just now');
  await expect(page.getByTestId('arealine')).not.toContainText('Be the first');
  await page.goto('/progress');
  await expect(page.getByTestId('progress-error')).toBeVisible();
  await expect(page.getByTestId('progress-start')).toHaveCount(0);
});

test('Safety and Drivers keep everything in one hub, and links open their topic', async ({ page }) => {
  await page.goto('/safety#help');
  await expect(page.getByTestId('hub-help')).toBeVisible();
  await expect(page.getByTestId('hub-help')).toContainText('1122');
  await expect(page.getByTestId('hub-promises')).toBeHidden();
  await page.getByRole('button', { name: 'The 7 promises' }).click();
  await expect(page.getByTestId('hub-promises').locator('.promlist li')).toHaveCount(7);
  await page.goto('/drivers#questions');
  await expect(page.getByTestId('hub-faq')).toBeVisible();
  await expect(page.getByTestId('hub-faq').locator('details')).toHaveCount(4);
});

test('the join form on the drivers page sits right under its title', async ({ page }) => {
  await page.goto('/drivers');
  const gap = await page.evaluate(() => { const p = document.querySelector('#join .pwrap > p')!.getBoundingClientRect(); const f = document.querySelector('#join form legend')!.getBoundingClientRect(); return f.top - p.bottom; });
  expect(gap).toBeLessThan(120);
});

test('the menu closes with Escape', async ({ page }) => {
  await page.goto('/?lite');
  await page.keyboard.press('Escape');
  await page.locator('.menub').click();
  await expect(page.locator('#menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toBeHidden();
});

test('a phone that stutters with the 3D gets the painted pictures, and keeps them for the visit', async ({ page }) => {
  test.setTimeout(90_000);
  await stub(page);
  // every frame arrives ~80 ms late, as on a phone that can't keep up
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => window.setTimeout(() => raf(cb), 80); });
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.v16.lite')).toHaveCount(1, { timeout: 60_000 });
  await expect(page.locator('.v16.has3d')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.v16.lite')).toHaveCount(1);
});

test('opening and closing the menu never hides the 3D city', async ({ page }) => {
  test.setTimeout(90_000);
  await stub(page);
  await page.goto('/?keep3d');
  await page.keyboard.press('Escape');
  const had = await page.locator('.v16.has3d').waitFor({ timeout: 45_000 }).then(() => true, () => false);
  test.skip(!had, 'this browser could not draw the 3D');
  await page.locator('.menub').click();
  await page.locator('.menub').click();
  await expect(page.locator('.v16.has3d')).toHaveCount(1);
});
