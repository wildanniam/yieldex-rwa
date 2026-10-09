import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@rwa/shared'],
  poweredByHeader: false,
  async redirects() {
    // Browsers request /favicon.ico when viewing a JSON endpoint directly.
    return [
      { source: '/favicon.ico', destination: '/icon.svg', permanent: false },
    ];
  },
};
export default nextConfig;
