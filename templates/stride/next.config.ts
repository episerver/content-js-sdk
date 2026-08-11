import type { NextConfig } from 'next';

// Chrome Origin Trial token (standards/native-registration validation ONLY —
// not native Gemini support; see docs/storefront-v2/PRD.md §5). Enrollment is
// a Mario-only manual step; when the env var is empty/unset, no header is
// emitted and the config is byte-for-byte the previous behavior.
const originTrialToken = process.env.ORIGIN_TRIAL_TOKEN;

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
  ...(originTrialToken
    ? {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [{ key: 'Origin-Trial', value: originTrialToken }],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
