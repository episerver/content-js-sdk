# config(), getClient() and GraphClient

The three ways to set up a connection to Optimizely Graph. `config()` stores your options
once for the whole app, `getClient()` returns a client built from them, and
`new GraphClient()` builds a client from options you pass directly. All three take the
same options object.

```ts
import { config, getClient } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
});

const client = getClient();
```

## Reference

### `config(options)`

```ts
config(options: GraphOptions): void
```

Stores `options` as the global configuration that `getClient()` reads.

- `options` — the [options](#options). `apiKey` is required.

Returns nothing. Throws an `OptimizelyGraphError` if `apiKey` is missing or empty, or if
`auth` is malformed.

### `getClient(overrides?)`

```ts
getClient(overrides?: Partial<GraphOptions>): GraphClient
```

Returns a new `GraphClient` built from the options passed to `config()`.

- `overrides` (optional) — options that replace the configured ones for this client only.
  Top-level options replace the configured value. `fragment` and `query` are merged key by
  key, so you only pass the keys you want to change.

Returns a [`GraphClient`](./graph-client.md). Throws an `OptimizelyGraphError` if
`config()` has not been called.

### `new GraphClient(apiKey, options?)`

```ts
new GraphClient(apiKey: string, options?: Omit<GraphOptions, 'apiKey'>)
```

Builds a client without the global configuration.

- `apiKey` — the Graph single key.
- `options` (optional) — every [option](#options) except `apiKey`.

Returns a [`GraphClient`](./graph-client.md). Throws an `OptimizelyGraphError` if `auth`
is malformed.

### Options

The options are grouped in three levels:

- **Top level** — how to connect to Graph.
- **`fragment`** — the shape of the GraphQL query the SDK generates. These are fixed for
  the lifetime of a client. To change one, build another client with
  `getClient({ fragment: { … } })`.
- **`query`** — defaults for the options that every fetching method also accepts. A value
  passed to a method overrides the default for that one call.

#### Top level

| Option      | Type                                 | Default                                  | Description                                                                                                                                      |
| ----------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiKey`    | `string`                             | Required                                 | The Graph single key, from **Settings → API Keys** in the CMS. `new GraphClient()` takes it as its first argument instead                        |
| `graphUrl`  | `string`                             | `'https://cg.optimizely.com/content/v2'` | The Graph endpoint. A URL with no path gets `/content/v2` appended, and trailing slashes are removed                                             |
| `userAgent` | `string`                             | `'OptimizelySDK/<version> (JS)'`         | The `User-Agent` header sent with every request                                                                                                  |
| `secrets`   | `{ appKey: string; secret: string }` | None                                     | The app key and secret that the `hmac` auth mode signs with. Authenticates nothing on its own. See [Authentication](../guides/authentication.md) |
| `auth`      | `GraphAuthMode \| GraphAuthResolver` | None (the single key)                    | The credential each request carries instead of the single key. See [Authentication](../guides/authentication.md)                                 |
| `fragment`  | `GraphFragmentOptions`               | See below                                | Settings that shape the generated query                                                                                                          |
| `query`     | `GraphQueryOptions`                  | See below                                | Defaults for the per-request options                                                                                                             |

`auth` takes one of these:

- `{ type: 'hmac', asUser?, includeDeleted?, includeExpired? }` — signs each request with
  `secrets`. Server-side only.
- `{ type: 'bearer', token }` — forwards a token you already hold. `token` can be a string
  or a function that returns one.
- `(request) => headers` — a resolver function that returns the headers to send.

#### `fragment`

| Option             | Type                                  | Default       | Description                                                                                                                                                         |
| ------------------ | ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `richTextFormat`   | `'html' \| 'json' \| 'both'`          | `'json'`      | Which representation of rich text properties to fetch. See [Rich text](../guides/rich-text.md)                                                                      |
| `compositionDepth` | `number`                              | `4`           | How many levels of nested composition the query fetches. See [Experiences](../guides/experiences.md)                                                                |
| `expandContracts`  | `boolean`                             | `false`       | When `allowedTypes` lists a contract, also fetch every content type that extends it. See [Contracts](../guides/contracts.md)                                        |
| `maxThreshold`     | `number`                              | `100`         | The most fragments the SDK generates for one content property without `allowedTypes` or `restrictedTypes`. Above it, the SDK throws a `GraphFragmentThresholdError` |
| `dam`              | `'automatic' \| 'on' \| 'off'`        | `'automatic'` | Whether to fetch DAM asset fields. `'automatic'` checks the Graph schema. See [DAM assets](../guides/dam-assets.md)                                                 |
| `taxonomy`         | `'automatic' \| 'on' \| 'off'`        | `'automatic'` | Whether to fetch `_metadata.categories`. `'automatic'` checks the Graph schema. See [Taxonomy](../guides/taxonomy.md)                                               |
| `typeFilter`       | `(contentTypeKey: string) => boolean` | None          | Return `false` to leave a content type out of the fragments generated for content and content area properties                                                       |

#### `query`

| Option            | Type                 | Default                        | Description                                                                                                                   |
| ----------------- | -------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `cache`           | `boolean`            | `true`, or `false` with `auth` | Lets Graph serve a cached response                                                                                            |
| `stored`          | `boolean`            | `true`, or `false` with `auth` | Sends queries as stored queries, so Graph reuses the query plan for identical query text                                      |
| `slot`            | `'Current' \| 'New'` | `'Current'`                    | Which index to query during a smooth rebuild of Graph. `'New'` queries the index being built                                  |
| `host`            | `string`             | None                           | Only return content whose URL base matches, such as `'https://example.com'`. Applies to lookups by path only                  |
| `publishedOnly`   | `boolean`            | `true`                         | Only return content whose status is `Published`. Matters only under `auth`. See [Authentication](../guides/authentication.md) |
| `resolveTaxonomy` | `boolean`            | `false`                        | Resolve category keys into full terms, as `_metadata.resolvedCategories`. See [Taxonomy](../guides/taxonomy.md)               |

Which methods honour each `query` option is listed per method in
[`GraphClient`](./graph-client.md).

### Caveats

- **Setting `auth` turns `cache` and `stored` off by default.** An explicit `query.cache`
  or `query.stored` still wins, including one set in `config()` when `auth` is added later
  with `getClient({ auth })`. Turn them back on only where the response doesn't depend on
  who asks.
- **An option set to `undefined` counts as unset.** It falls back to the SDK default, not
  to the value passed to `config()`. For example, `getClient({ auth: undefined })` returns
  a client that uses the single key.
- **`config()` replaces the previous configuration.** Calling it a second time discards
  the first set of options.
- **`getClient()` returns a new client on every call.** Building one is cheap, and the
  schema lookups the SDK makes are shared across clients in the same process.
- **`new GraphClient()` doesn't check `apiKey`.** Only `config()` rejects an empty key. A
  client built with an empty key fails on its first request.

## Usage

### Configuring the SDK once for the whole app

Call `config()` in a file that every route loads, and import that file in the root layout:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  fragment: {
    richTextFormat: 'both',
  },
});
```

```tsx
// src/app/layout.tsx
import '@/lib/optimizely';
```

Then call `getClient()` wherever you fetch content:

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const content = await getClient().getContentByPath(`/${slug.join('/')}/`);

  return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
}
```

If `OPTIMIZELY_GRAPH_GATEWAY` isn't set, `graphUrl` is `undefined` and the client uses the
production endpoint.

### Using a non-production Graph

Point `graphUrl` at the other environment:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  graphUrl: 'https://cg.staging.optimizely.com',
});
```

A URL with no path, as here, becomes `https://cg.staging.optimizely.com/content/v2`. A URL
with any other path is used as it is.

### Serving several sites from one CMS

When several sites share a CMS instance, the same path can exist on more than one of them.
Set `host` to the site's URL base, including the scheme, so that lookups by path return
only that site's content:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  query: {
    host: process.env.APPLICATION_HOST, // for example 'https://www.example.com'
  },
});
```

To fetch from another site for one call, pass `host` to the method:

```ts
import { getClient } from '@optimizely/cms-sdk';

const contact = await getClient().getContentByPath('/en/contact/', {
  host: 'https://shop.example.com',
});
```

`host` applies to `getContentByPath()`, and to `getPath()` and `getItems()` when you pass
them a URL path. Lookups by key ignore it.

### Raising the fragment limit

A content property without `allowedTypes` or `restrictedTypes` can hold any content type,
so the SDK generates a fragment for every registered type. When that count passes
`fragment.maxThreshold`, the query is not sent and the SDK throws:

```text
GraphFragmentThresholdError: Fragment generation for "LandingPage" produced 140 inner fragments, exceeding the configured limit of 100. Add "allowedTypes" or "restrictedTypes" to the content area property to narrow which content types are included, or increase "fragment.maxThreshold" in your graph configuration if this is intentional.
```

The better fix is to narrow the property, which also makes the query smaller:

```ts
// src/components/LandingPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { HeroContentType } from './Hero';
import { BannerContentType } from './Banner';

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    blocks: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [HeroContentType, BannerContentType],
      },
    },
  },
});
```

If the property really does accept every type, raise the limit instead:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    maxThreshold: 150,
  },
});
```

See [Property types](./property-types.md) for `allowedTypes` and `restrictedTypes`.

### Skipping content types you don't render

`typeFilter` is called with the key of each content type the SDK is about to add to a
content or content area property. Return `false` to leave it out of the query. A common
use is skipping types that have no component. Keep the components in one object, and check
it from both `initReactComponentRegistry()` and `typeFilter`:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article from '@/components/Article';
import Hero from '@/components/Hero';

const components = { Article, Hero };

initReactComponentRegistry({ resolver: components });

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    typeFilter: contentTypeKey => contentTypeKey in components,
  },
});
```

> [!WARNING]
>
> `typeFilter` also receives contract keys, and media base types such as `_image` when a
> property's `allowedTypes` lists them. Returning `false` for a contract leaves out the
> contract's fields as well, so allow those keys explicitly.

`typeFilter` doesn't affect the components in an experience's composition. The SDK caches
generated queries keyed by which registered types pass the filter, so make the filter
return the same answer for the same key every time.

### Overriding options for one request

To change a `query` option for one call, pass it to the method:

```ts
import { getClient } from '@optimizely/cms-sdk';

const client = getClient();

const page = await client.getContentByPath('/en/news/', { cache: false });
```

To change a `fragment` option, or a top-level one such as `auth`, build a client with
`getClient()` overrides. The configured `fragment` and `query` keys you don't pass are
kept:

```ts
import { getClient } from '@optimizely/cms-sdk';

const htmlClient = getClient({ fragment: { richTextFormat: 'html' } });
const page = await htmlClient.getContentByPath('/en/about/');
```

### Building a client without `config()`

`new GraphClient()` takes the key as its first argument and the remaining options as its
second. Nothing is stored globally:

```ts
import { GraphClient } from '@optimizely/cms-sdk';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  query: { host: 'https://www.example.com' },
});

const content = await client.getContentByPath('/en/');
```

## Troubleshooting

### `Invalid Optimizely Graph API key: key must be a non-empty string`

`config()` was called with an empty `apiKey`. This usually means the environment variable
isn't set in the environment the code runs in. Check `.env`, and restart the dev server
after you change it.

### `The Graph client is not configured. Call config() in the application entry point.`

`getClient()` ran before `config()`. Make sure the file that calls `config()` is imported
by every route that fetches content, such as through the root layout.

### `Error when calling fetch. Ensure the Graph URL is correct or try again later.`

The request didn't reach Graph. Check `graphUrl`, and that the server can reach it.

### `GraphFragmentThresholdError`

A content property without type restrictions produced too many fragments. See
[Raising the fragment limit](#raising-the-fragment-limit).
