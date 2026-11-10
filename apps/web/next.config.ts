import type { NextConfig } from 'next';

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
      { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
    ];
    return [
      { source: '/:path*', headers: base },
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
    ];
  },
};

export default nextConfig;
