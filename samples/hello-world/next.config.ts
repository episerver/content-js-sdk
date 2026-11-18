import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Shows the start page at `/` as well, which front-end hosting requests when it starts the site
  rewrites: async () => [{ source: '/', destination: '/en' }],
};

export default nextConfig;
