import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
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
