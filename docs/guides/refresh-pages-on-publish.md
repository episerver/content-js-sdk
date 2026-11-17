# Refresh pages on publish

On Optimizely front-end hosting, your site can serve pages from a cache that every
instance shares, and refresh a page within seconds of an editor publishing it. The
`@optimizely/cms-hosting` package connects Next.js or Astro to the parts of the platform
that make this work, so you do not write the infrastructure code yourself.

> **You will learn**
>
> - What happens when an editor publishes
> - How to set it up in Next.js
> - How to set it up in Astro
> - Which pages are refreshed, and what is not supported

## What happens when an editor publishes

1. A visitor requests a page. The site renders it and stores it in the platform's Redis,
   which every instance of the site shares. The CDN caches it as well.
2. An editor publishes a change. Optimizely Graph calls a **webhook** on your site.
3. The webhook finds the URL of the changed content, removes that page and the home pages
   from Redis, and purges them from the CDN.
4. The next visitor gets a freshly rendered page, which is cached again.

The package registers the webhook when the site starts, so you do not create it by hand.
The platform supplies every setting it needs. See
[Environment variables](#environment-variables).

Install the package in your site:

```sh
npm install @optimizely/cms-hosting
```

## Set up Next.js

Next.js 16 or later is required. You add four small files.

Point Next.js at the Redis cache handler, and turn off the in-memory cache that each
instance would otherwise keep:

```js
// cache-handler.mjs
export { default } from '@optimizely/cms-hosting/nextjs/cache-handler';
```

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheHandler: require.resolve('./cache-handler.mjs'),
  cacheMaxMemorySize: 0,
};

export default nextConfig;
```

Register the webhook when the server starts:

```ts
// src/instrumentation.ts
export { register } from '@optimizely/cms-hosting/nextjs';
```

Add the route that Graph calls:

```ts
// src/app/hooks/graph/route.ts
export { POST } from '@optimizely/cms-hosting/nextjs/route';
```

Only pages that Next.js renders statically are cached. Run `next build` and check the
route list: a page marked `ƒ` (dynamic) is rendered on every request. Reading
`searchParams`, `cookies()` or `headers()` makes a page dynamic. To keep a catch-all
content page static, export `dynamic`:

```tsx
// src/app/[...slug]/page.tsx
export const dynamic = 'force-static';
```

## Set up Astro

Astro 7 or later with `output: 'server'` is required.

Use the Redis cache provider, and choose how long each route stays cached with
`routeRules`:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { redisCache } from '@optimizely/cms-hosting/astro';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  cache: { provider: redisCache() },
  routeRules: {
    '/': { maxAge: 600, swr: 1800 },
    '/[...slug]': { maxAge: 600, swr: 1800 },
    // Endpoints that must not be cached
    '/api/[...path]': { maxAge: 0 },
  },
  // Graph sends the webhook as a text/plain POST, which this check blocks
  security: { checkOrigin: false },
});
```

`maxAge` is how many seconds a page counts as fresh. `swr` is how many seconds after that
the stale page is still served while a fresh one renders in the background.

`'/[...slug]'` matches every path, endpoints included, so a GET endpoint would be cached
as well. Give endpoints that must stay fresh their own rule with `maxAge: 0`. A more
specific rule wins over the catch-all.

> [!WARNING]
>
> `checkOrigin: false` turns off Astro's protection against cross-site form submissions
> for the whole site. Only use it if your site has no forms that change data.

Add the endpoint that Graph calls:

```ts
// src/pages/hooks/graph.ts
export { POST } from '@optimizely/cms-hosting/astro/route';
```

Astro has no startup hook in production, so register the webhook from the `start` script.
The `&` runs the registration in the background, so it does not delay the server:

```json
{
  "scripts": {
    "start": "optimizely-hosting register-webhook & node ./dist/server/entry.mjs"
  }
}
```

## Which pages are refreshed

A publish refreshes:

- the page's URL, and its simple address if it has one
- its previous URL, if the page moved
- the site root `/` and the home page of the page's locale, such as `/en`, because home
  pages often list other pages

Other pages that show the changed content, such as listings and menus, update when their
cache time runs out. Keep that time short enough for your editors, or refresh those pages
as well (see below). The same goes for URLs with a query string, such as
`/en/news?page=2`: the CDN caches each one separately, and a publish purges only the plain
URL.

The site remembers the URLs of every page it refreshes. When a page expires or is deleted,
Graph no longer knows its URL, so the site refreshes the remembered one. A page that has
not been published since the site started using the package has no remembered URL.
Deleting such a page removes every page of the deployment from Redis instead, and the CDN
keeps the deleted page until its cache time ends.

### Refreshing more pages on each publish

Create the webhook route with `alsoRefresh`. It receives the changed content's `docId`,
`locale` and `paths`, and returns the paths to refresh besides the content's own:

```ts
// src/app/hooks/graph/route.ts
import { createWebhookRoute, homePagePaths } from '@optimizely/cms-hosting/nextjs/route';

export const POST = createWebhookRoute({
  // The default home pages, plus the news listing
  alsoRefresh: change => [...homePagePaths(change), '/en/news'],
});
```

`homePagePaths` is the default: `/` and the locale's home page. Return `[]` to refresh
only the changed page. In Astro, import the same functions from
`@optimizely/cms-hosting/astro/route`.

These are not supported:

- **Tags.** `revalidateTag()` in Next.js and `cache.invalidate({ tags })` in Astro are
  ignored with a warning. Only paths are invalidated.
- **`'use cache'` in Next.js.** With `cacheComponents` turned on, Next.js keeps these
  entries in each instance's memory, so a webhook only clears the instance that received
  it.
- **Query strings in Astro.** Requests with a query string, such as `/search?q=shoes`, are
  not cached. Tracking parameters such as `utm_source` and `gclid` are ignored.
- **Other hosts.** The cache and the CDN purge use services of Optimizely front-end
  hosting.

## Environment variables

Front-end hosting sets all of these. You do not set them:

| Variable                                   | Used for                                         |
| ------------------------------------------ | ------------------------------------------------ |
| `OPTIMIZELY_GRAPH_SINGLE_KEY`              | Finding the URL of the published content         |
| `OPTIMIZELY_GRAPH_GATEWAY`                 | The Graph address                                |
| `OPTIMIZELY_GRAPH_APP_KEY`                 | Registering the webhook                          |
| `OPTIMIZELY_GRAPH_SECRET`                  | Registering the webhook                          |
| `OPTIMIZELY_GRAPH_CALLBACK_APIKEY`         | Checking that a webhook request comes from Graph |
| `OPTIMIZELY_SITE_HOSTNAME`                 | The webhook's address                            |
| `REDIS_URL`                                | The shared cache                                 |
| `AZURE_CLIENT_ID`                          | Signing in to Redis and the CDN purge API        |
| `OPTIMIZELY_DXP_DEPLOYMENT_ID`             | Keeping each deployment slot's pages apart       |
| `OPTIMIZELY_CLOUDPLATFORM_API_URL`         | Purging the CDN                                  |
| `OPTIMIZELY_CLOUDPLATFORM_API_RESOURCE_ID` | Purging the CDN                                  |

Without them, for example on your machine, the site still runs: each instance caches pages
in its own memory, no webhook is registered and the CDN is not purged. Messages starting
with `[cms-hosting]` in the server log say which part is missing.

## Troubleshooting

### A published change does not appear

- Check that you publish in the CMS the site is connected to. The platform connects the
  site to one CMS, and registers the webhook with that CMS's Graph.
- Check that the site's hostname is under **Hostnames** in **Settings > Applications**, so
  Graph returns a URL for the content. See
  [After the first deploy](./deploy-to-frontend-hosting.md#after-the-first-deploy).
- Look for `[cms-hosting]` messages in the server log. `Registered the Graph webhook`
  appears once after the first start.
- In Next.js, check that the page is static in the `next build` output.

### Graph gets 403 from the Astro webhook

Astro's origin check blocked the request. Set `security: { checkOrigin: false }`, as in
[Set up Astro](#set-up-astro).

### An endpoint returns out-of-date data

The platform's CDN caches responses that have no `Cache-Control` header, such as those of
a Next.js route handler or an Astro endpoint. Send `no-store` from responses that must
always be fresh:

```ts
return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
```

In Astro, also give the endpoint a `maxAge: 0` rule, as in [Set up Astro](#set-up-astro).
Otherwise the catch-all rule replaces the header.

## Recap

- Next.js needs a cache handler, `instrumentation.ts` and a webhook route.
- Astro needs the cache provider, `routeRules`, a webhook endpoint and a `start` script
  that registers the webhook.
- A publish refreshes the changed page, `/` and the locale's home page. Expired and
  deleted pages are refreshed at their remembered URLs.
- `createWebhookRoute({ alsoRefresh })` refreshes more pages on each publish.
- Front-end hosting supplies every setting.

## Related

- [Deploy to front-end hosting](./deploy-to-frontend-hosting.md)
- [Sample: graph-webhooks-cache-invalidation](../../samples/graph-webhooks-cache-invalidation)
- [Next.js incremental static regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
