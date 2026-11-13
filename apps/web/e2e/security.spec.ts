// Security (v20): every page sends the protective headers (a Content-Security-Policy that only allows our own
// code, Cloudflare's bot check and the page counter; no framing by other sites; HSTS), the team page is
// stricter and never cached, robots.txt doesn't point at the team page, old /en links can't redirect off-site,
// and pages load with no CSP errors.
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/ur', '/app', '/ur/app', '/drivers', '/safety', '/privacy', '/story', '/progress', '/schools', '/download', '/admin', '/i/' + 'a'.repeat(43)];

test('every page sends the protective headers', async ({ request }) => {
  for (const path of PAGES) {
    const r = await request.get(path);
    const h = r.headers();
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy'], path).toContain("object-src 'none'");
    expect(h['content-security-policy'], path).toContain("default-src 'self'");
    expect(h['x-frame-options'], path).toBe('DENY');
    expect(h['strict-transport-security'], path).toContain('includeSubDomains');
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['cross-origin-opener-policy'], path).toBe('same-origin');
  }
});

test('the team page allows no third-party code but the bot check, and is never cached or indexed', async ({ request }) => {
  const h = (await request.get('/admin')).headers();
  expect(h['content-security-policy']).not.toContain('va.vercel-scripts.com');
  expect(h['content-security-policy']).toContain('challenges.cloudflare.com');
  expect(h['cache-control']).toContain('no-store');
  expect(h['x-robots-tag']).toContain('noindex');
});

test('invite links never pass their address on, and are never cached', async ({ request }) => {
  const h = (await request.get('/i/' + 'b'.repeat(43))).headers();
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['cache-control']).toContain('no-store');
});

test('robots.txt does not point at the team page', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).not.toContain('/admin');
  expect(body).toContain('Disallow: /i/');
});

test('old /en links cannot be bent into a redirect to another site', async ({ request }) => {
  for (const path of ['/en//evil.example', '/en/%2F%2Fevil.example', '/en/\\evil.example']) {
    const r = await request.get(path, { maxRedirects: 0 });
    const loc = r.headers().location ?? '';
    expect(loc.startsWith('//') || /^https?:\/\/(?!localhost|127\.0\.0\.1|(www\.)?pohnch\.pk)/.test(loc), `${path} -> ${loc}`).toBe(false);
  }
});

test('pages load with no Content-Security-Policy errors', async ({ page }) => {
  const blocked: string[] = [];
  // (Vercel's page-counter script only exists on Vercel; locally it is a 404, which isn't a CSP matter)
  page.on('console', (m) => { if (/Content.Security.Policy/i.test(m.text())) blocked.push(m.text().slice(0, 160)); });
  await page.route('**/functions/v1/interest**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"areas":{},"meter":{},"proof":null}' }));
  for (const path of ['/?lite', '/drivers', '/safety', '/privacy', '/progress']) {
    await page.goto(path);
    await page.waitForTimeout(500);
  }
  expect(blocked).toEqual([]);
});
