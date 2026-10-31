import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Our shared packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@pohnch/ui', '@pohnch/messages', '@pohnch/core'],
  poweredByHeader: false,
};

export default nextConfig;
