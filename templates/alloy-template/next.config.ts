import type { NextConfig } from 'next';

const CMS_DOMAIN =
  process.env.OPTIMIZELY_CMS_URL?.replace('https://', '') || '';

const nextConfig: NextConfig = {
  images: {
    domains: [CMS_DOMAIN],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cms.optimizely.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
