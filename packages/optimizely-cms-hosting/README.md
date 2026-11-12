# @optimizely/cms-hosting

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-hosting)](https://www.npmjs.com/package/@optimizely/cms-hosting)

Incremental Static Regeneration (ISR) for Next.js and Astro sites on Optimizely front-end
hosting. Pages are served from a cache that every instance shares, and a page refreshes
within seconds of an editor publishing it.

- A Redis cache for Next.js (`cacheHandler`) and Astro (cache provider)
- An Optimizely Graph webhook that is registered when the site starts
- A webhook route that refreshes the published page in the cache and purges it from the
  CDN

Requires Next.js 16 or later, or Astro 7 or later. The platform supplies every setting.

## Installation

```sh
npm install @optimizely/cms-hosting
```

## Next.js

```js
// cache-handler.mjs
export { default } from '@optimizely/cms-hosting/nextjs/cache-handler';
```

```ts
// next.config.ts
const nextConfig = {
  cacheHandler: require.resolve('./cache-handler.mjs'),
  cacheMaxMemorySize: 0,
};

export default nextConfig;
```

```ts
// src/instrumentation.ts
export { register } from '@optimizely/cms-hosting/nextjs';
```

```ts
// src/app/hooks/graph/route.ts
export { POST } from '@optimizely/cms-hosting/nextjs/route';
```

## Astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { redisCache } from '@optimizely/cms-hosting/astro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  cache: { provider: redisCache() },
  routeRules: { '/[...slug]': { maxAge: 600, swr: 1800 } },
  security: { checkOrigin: false },
});
```

```ts
// src/pages/hooks/graph.ts
export { POST } from '@optimizely/cms-hosting/astro/route';
```

```json
{
  "scripts": {
    "start": "optimizely-hosting register-webhook & node ./dist/server/entry.mjs"
  }
}
```

## Documentation

- [Refresh pages on publish](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/refresh-pages-on-publish.md) -
  How it works, setup, limits and troubleshooting
- [Deploy to front-end hosting](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/deploy-to-frontend-hosting.md) -
  Put the site live with one command
- [Sample](https://github.com/episerver/content-js-sdk/tree/main/samples/graph-webhooks-cache-invalidation) -
  A Next.js site that uses this package

## License

Apache-2.0
