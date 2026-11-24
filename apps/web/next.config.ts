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
  // 'wasm-unsafe-eval': the web copies of the apps at /try draw with Skia, which is WebAssembly.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${scripts}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  // v24: drivers' paper previews on the admin page come from our Supabase storage (2-minute links).
  `img-src 'self' data: blob: ${SUPA}`,
  "font-src 'self'",
  // open-meteo: the apps' rain mode (the web copies at /try) checks Karachi's weather.
  `connect-src 'self' ${SUPA} ${SUPA.replace(/^https:/, 'wss:')} ${TURNSTILE} https://api.open-meteo.com https://tiles.openfreemap.org https://photon.komoot.io${LOCAL}`,
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
      // v22: the launch ad, shareable as pohnch.pk/ad (investor emails, WhatsApp).
      { source: '/ad', destination: '/media/pohnch-ad.mp4', permanent: false },
      // Nov 2026: Beaconhouse PECHS's parent circular; the sign-up form opens with the school filled in.
      { source: '/bcp', destination: '/?school=Beaconhouse%20PECHS#join', permanent: false },
      { source: '/ur/bcp', destination: '/ur?school=Beaconhouse%20PECHS#join', permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Every invite link shows the same static page; the server never handles the token itself.
      { source: '/i/:token', destination: '/invite' },
      // The web copies of the two apps (scripts/build-try.sh): every screen address loads the app, which routes itself.
      { source: '/try/parent/:path*', destination: '/try/parent/index.html' },
      { source: '/try/driver/:path*', destination: '/try/driver/index.html' },
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
