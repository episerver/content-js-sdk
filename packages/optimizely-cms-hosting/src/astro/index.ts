import type { CacheProviderConfig } from 'astro';

/** Astro `cache.provider` config that stores pages in the platform's Redis. */
export const redisCache = (): CacheProviderConfig => ({
  name: 'optimizely-redis',
  entrypoint: '@optimizely/cms-hosting/astro/cache-provider',
});
