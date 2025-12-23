import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cmstest.optimizely.com',
      },
      {
        protocol: 'https',
        hostname: '**.optimizely.com', // or add cms.optimizely.com, cmp.optimizely.com
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
