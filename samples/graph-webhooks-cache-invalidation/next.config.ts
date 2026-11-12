import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Shares the ISR cache between instances through the platform's Redis
  cacheHandler: require.resolve('./cache-handler.mjs'),
  // Without this, each instance keeps its own in-memory copy of the pages
  cacheMaxMemorySize: 0,
};

export default nextConfig;
