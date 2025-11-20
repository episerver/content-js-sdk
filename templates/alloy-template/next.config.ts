import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['app-opinjssdk1sob7t001.cms.optimizely.com'],
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
