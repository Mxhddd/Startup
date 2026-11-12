import type { NextConfig } from 'next';

// The Content-Security-Policy (v20 security): pages may only load code from pohnch.pk itself, Cloudflare's
// bot check (Turnstile) and Vercel's page-view counter; may only talk to our Supabase project; may not be
// framed by another site. Next's small inline start-up scripts need 'unsafe-inline' (nonces would make every
// page dynamic and slow); inline styles carry the truck-art patterns. In `next dev` no CSP is sent, because
// the dev overlay needs eval.
const SUPA = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vsyunieszswpreogzolx.supabase.co').replace(/\/$/, '');
const TURNSTILE = 'https://challenges.cloudflare.com';
// Local builds (tests, `next start` on a laptop) may also talk to a local stand-in for Supabase; Vercel builds never.
const LOCAL = process.env.VERCEL ? '' : ' http://127.0.0.1:9 http://localhost:54321';
const csp = (scripts: string) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${scripts}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${SUPA} ${SUPA.replace(/^https:/, 'wss:')} ${TURNSTILE}${LOCAL}`,
  `frame-src ${TURNSTILE}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');
const prod = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Our shared packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@pohnch/ui', '@pohnch/messages', '@pohnch/core'],
  poweredByHeader: false,
  async redirects() {
    return [
      // v16: English moved from /en to the root (Urdu is now under /ur). Old links keep working.
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Every invite link shows the same static page; the server never handles the token itself.
      { source: '/i/:token', destination: '/invite' },
      { source: '/.well-known/apple-app-site-association', destination: '/api/app-links/apple' },
      { source: '/.well-known/assetlinks.json', destination: '/api/app-links/android' },
    ];
  },
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      ...(prod ? [{ key: 'Content-Security-Policy', value: csp(`${TURNSTILE} https://va.vercel-scripts.com`) }] : []),
    ];
    return [
      { source: '/:path*', headers: base },
      // The team page: the same rules, minus the page-view counter (only our code and the bot check run there).
      ...(prod ? [{ source: '/admin/:path*', headers: [{ key: 'Content-Security-Policy', value: csp(TURNSTILE) }] }, { source: '/admin', headers: [{ key: 'Content-Security-Policy', value: csp(TURNSTILE) }] }] : []),
      {
        // Invite pages: never pass the address (with its token) on to another site, never index, never cache.
        source: '/i/:token',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/invite', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
