# GraphClient

The client that fetches content from Optimizely Graph. The SDK builds each GraphQL query
from your registered content types, so the methods take a path or a key rather than a
query.

```ts
import { getClient } from '@optimizely/cms-sdk';

const client = getClient();
const content = await client.getContentByPath('/en/about/');
```

Get a client with `getClient()` after calling `config()`, or construct one with
`new GraphClient(apiKey, options)`. Both are described in
[`config()`, `getClient()` and `GraphClient`](./config.md), with every option they take.

## Options by method

Every method accepts the `query` options from [`config()`](./config.md) as its last
argument. A value passed to a method overrides the configured default for that call. Not
every method uses every option:

| Option            | `getContentByPath` | `getContent`                                 | `getPreviewContent` | `getPath`, `getItems`                  |
| ----------------- | ------------------ | -------------------------------------------- | ------------------- | -------------------------------------- |
| `cache`           | Yes                | Yes. Defaults to `false` with `previewToken` | No, always `false`  | Yes                                    |
| `stored`          | Yes                | Yes                                          | Yes                 | Yes                                    |
| `slot`            | Yes                | Yes                                          | Yes                 | Yes                                    |
| `host`            | Yes                | No                                           | No                  | Only when given a URL path             |
| `publishedOnly`   | Yes                | Not with `previewToken` or a `version`       | No, always `false`  | Not when the reference has a `version` |
| `resolveTaxonomy` | Yes                | Yes                                          | Yes                 | No                                     |

Some methods take extra options of their own: `variation` for `getContentByPath()`,
`previewToken` for `getContent()`, and `locales` for `getPath()` and `getItems()`.

The option types are exported from `@optimizely/cms-sdk`: `GraphGetContentOptions`,
`GraphGetItemOptions`, `GraphGetPreviewOptions`, `GraphGetLinksOptions` and
`GraphQueryOptions`.

## getContentByPath()

Fetches the content published at a URL path.

```ts
client.getContentByPath(path: string, options?: GraphGetContentOptions): Promise<any[]>
```

### Parameters

- `path` — a URL path, such as `'/en/about/'`. It matches the content's default or
  hierarchical URL, with or without a trailing slash.
- `options` (optional):
  - `variation` — which experience variations to return:
    - `{ include: 'NONE' }` returns the original content only. Leaving `variation` out is
      the same.
    - `{ include: 'ALL' }` returns the original and every variation.
    - `{ include: 'SOME', value: ['<variation>', …], includeOriginal? }` returns the
      listed variations, plus the original if `includeOriginal` is `true`.
  - `cache`, `stored`, `slot`, `host`, `publishedOnly`, `resolveTaxonomy` — see
    [Options by method](#options-by-method).

### Returns

A promise of an array with every item at the path. The array is empty if nothing matches.

### Caveats

- **The result is an array.** Without `host`, a path that exists on several sites returns
  one item per site. With `variation`, each variation is a separate item.
- **A content type you haven't registered returns an empty array.** The SDK can only build
  a query for types passed to `initContentTypeRegistry()`.
- **`resolveTaxonomy` needs taxonomy fields.** It does nothing when `fragment.taxonomy` is
  `'off'`, or when it's `'automatic'` and the Graph schema has no categories.

### Usage

#### Fetching the page for a route

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (content.length === 0) notFound();

  return <OptimizelyComponent content={content[0]} />;
}
```

#### Fetching a variation

Pass the variation a visitor should see. With `includeOriginal`, a visitor still gets the
original when the page has no such variation:

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContentByPath('/en/pricing/', {
  variation: { include: 'SOME', value: ['business'], includeOriginal: true },
});
```

#### Fetching from a specific site

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContentByPath('/en/contact/', {
  host: 'https://shop.example.com',
});
```

## getContent()

Fetches one content item by its key.

```ts
client.getContent(reference: string | GraphReference, options?: GraphGetItemOptions): Promise<any>
```

### Parameters

- `reference` — a [`GraphReference`](#graphreference) object, or the same reference as a
  `graph://` string.
- `options` (optional):
  - `previewToken` — a preview token, to fetch a version that isn't published.
  - `cache`, `stored`, `slot`, `publishedOnly`, `resolveTaxonomy` — see
    [Options by method](#options-by-method).

### Returns

A promise of the content item, or `null` if nothing matches.

### Caveats

- **A string must be a `graph://` reference.** A URL path such as `'/en/about/'` throws.
  Use `getContentByPath()` for paths.
- **`locale` and `version` both filter.** With only `locale`, you get the published
  version in that locale. With `version`, you get that version, and if you also pass a
  `locale` that doesn't match it, you get `null`.
- **A `version` or a `previewToken` turns `publishedOnly` off for the call**, because the
  version asked for is rarely the published one.
- **`previewToken` replaces the client's credential.** Neither the single key nor `auth`
  is sent with that request, and `cache` defaults to `false` unless you pass it.
- **A content type you haven't registered returns `null`.**

### Usage

#### Fetching an item by key

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContent({
  key: '880777d5a2824399b07e93e3ca70668e',
  locale: 'en',
});
```

#### Fetching an item from a `graph://` string

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContent(
  'graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=sv',
);
```

#### Fetching a draft version

```ts
import { getClient } from '@optimizely/cms-sdk';

export async function getDraft(previewToken: string) {
  return getClient().getContent(
    { key: '880777d5a2824399b07e93e3ca70668e', version: '123' },
    { previewToken },
  );
}
```

Pass the `preview_token` the CMS adds to the preview URL.

## getPreviewContent()

Fetches the version an editor is previewing, from the parameters the CMS adds to the
preview URL.

```ts
client.getPreviewContent(params: PreviewParams, options?: GraphGetPreviewOptions): Promise<any>
```

### Parameters

- `params` — the preview URL's query parameters:

  | Field           | Description                                 |
  | --------------- | ------------------------------------------- |
  | `preview_token` | The token that authorises the request       |
  | `key`           | The key of the content being previewed      |
  | `ver`           | The version being previewed                 |
  | `loc`           | The locale being previewed                  |
  | `ctx`           | `'edit'` in the editor, `'preview'` outside |

- `options` (optional) — `stored`, `slot`, `resolveTaxonomy`. See
  [Options by method](#options-by-method).

### Returns

A promise of the content item. Every object in it that has a `__typename` also gets a
`__context` property, `{ edit: boolean, preview_token: string }`, which the React
components use to add editing attributes.

### Caveats

- **It always bypasses the cache and returns drafts.** `cache` and `publishedOnly` are
  forced to `false`.
- **It throws if the content doesn't exist.** The error is a `GraphResponseError` with the
  message `Content with key '<key>' could not be found. Verify it exists in the CMS.`
- **It throws for an unregistered content type**, with a `GraphMissingContentTypeError`.
- **It fills in the request context** with the preview token, key, version, locale,
  content type and mode, so that components further down can read them. In React, wrap the
  page in `withAppContext()`. See [Request context](../guides/request-context.md).

### Usage

#### Rendering a preview route

```tsx
// src/app/preview/page.tsx
import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent, withAppContext } from '@optimizely/cms-sdk/react/server';
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
import Script from 'next/script';

type Props = {
  searchParams: Promise<Record<string, string>>;
};

async function Page({ searchParams }: Props) {
  const content = await getClient().getPreviewContent(
    (await searchParams) as PreviewParams,
  );

  return (
    <>
      <Script
        src={
          new URL(
            '/util/javascript/communicationinjector.js',
            process.env.OPTIMIZELY_CMS_URL,
          ).href
        }
      />
      <NextPreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}

export default withAppContext(Page);
```

See [Live preview](../learn/live-preview.md) for the rest of the setup.

## getPath()

Fetches the ancestors of a page, for breadcrumbs.

```ts
client.getPath(reference: string | GraphReference, options?: GraphGetLinksOptions): Promise<PageLink[] | null>
```

### Parameters

- `reference` — the page, as one of:
  - a URL path, such as `'/en/about/team/'`
  - a `graph://` string
  - a [`GraphReference`](#graphreference) object
- `options` (optional):
  - `locales` — the locales to return the pages in, such as `['en', 'sv']`. Language
    fallbacks apply. Defaults to the reference's `locale`, if it has one.
  - `cache`, `stored`, `slot`, `host`, `publishedOnly` — see
    [Options by method](#options-by-method).

### Returns

A promise of an array of pages, from the top-most ancestor down to the page itself. It is
`null` if the page doesn't exist. Each item has this shape:

```ts
type PageLink = {
  _metadata?: {
    key: string;
    sortOrder?: number;
    displayName?: string;
    locale?: string;
    types: string[];
    url?: { base?: string; hierarchical?: string; default?: string };
  };
};
```

The SDK doesn't export a `PageLink` type. The name is used here for readability.

### Caveats

- **It only works for pages.** For a component or other content without a place in the
  page tree, it throws a `GraphResponseError`.
- **A string that doesn't start with `graph://` is treated as a URL path.**
- **The first item is usually the start page.** Drop it with `slice(1)` if your
  breadcrumbs shouldn't show it.

### Usage

#### Building breadcrumbs

```tsx
// src/components/Breadcrumbs.tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function Breadcrumbs({ path }: { path: string }) {
  const ancestors = (await getClient().getPath(path)) ?? [];
  const crumbs = ancestors.slice(1);

  return (
    <nav aria-label='Breadcrumb'>
      <ol>
        {crumbs.map(page => (
          <li key={page._metadata?.key}>
            <a href={page._metadata?.url?.hierarchical}>{page._metadata?.displayName}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

#### Fetching ancestors by key

```ts
import { getClient } from '@optimizely/cms-sdk';

const ancestors = await getClient().getPath({
  key: '880777d5a2824399b07e93e3ca70668e',
  locale: 'sv',
});
```

## getItems()

Fetches the child pages of a page, for navigation menus.

```ts
client.getItems(reference: string | GraphReference, options?: GraphGetLinksOptions): Promise<PageLink[] | null>
```

### Parameters

Same as [`getPath()`](#getpath).

### Returns

A promise of an array of the page's child pages, each with the same `PageLink` shape as
[`getPath()`](#getpath) returns. It is `null` if the page doesn't exist.

### Caveats

- **The SDK doesn't sort the children.** Sort by `_metadata.sortOrder` to match the order
  in the CMS page tree.
- **Only pages are returned.** Child items that aren't pages are left out.
- **A string that doesn't start with `graph://` is treated as a URL path.**

### Usage

#### Building a navigation menu

```tsx
// src/components/MainNavigation.tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function MainNavigation() {
  const children = (await getClient().getItems('/en/')) ?? [];
  const sorted = [...children].sort(
    (a, b) => (a._metadata?.sortOrder ?? 0) - (b._metadata?.sortOrder ?? 0),
  );

  return (
    <nav aria-label='Main'>
      <ul>
        {sorted.map(page => (
          <li key={page._metadata?.key}>
            <a href={page._metadata?.url?.hierarchical}>{page._metadata?.displayName}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

#### Fetching children in several locales

```ts
import { getClient } from '@optimizely/cms-sdk';

const children = await getClient().getItems('/en/', { locales: ['en', 'sv'] });
```

## request()

Sends a GraphQL query you write yourself, for anything the other methods don't cover.

```ts
client.request(query: string, variables: any, previewToken?: string, cache?: boolean, slot?: GraphSlot, stored?: boolean): Promise<any>
```

### Parameters

- `query` — the GraphQL query.
- `variables` — the query's variables. Pass `{}` if it has none.
- `previewToken` (optional) — a preview token, sent instead of the client's credential.
- `cache` (optional) — whether Graph may serve a cached response. Defaults to `true`.
- `slot` (optional) — `'Current'` or `'New'`. Defaults to `'Current'`.
- `stored` (optional) — whether to send the query as a stored query. Defaults to `false`.

### Returns

A promise of the response's `data` field.

### Caveats

- **It ignores the client's `query` defaults.** `cache` defaults to `true` even when
  `auth` is set. Pass `false` explicitly for a request whose response depends on who asks.
- **It throws when Graph returns errors and no data.** If Graph returns errors alongside
  partial data, the SDK logs a warning and returns the data.
- **Errors are exported as `GraphErrors`**, such as `GraphErrors.GraphResponseError`, so
  you can check them with `instanceof`.

### Usage

#### Listing pages for static generation

```ts
import { getClient } from '@optimizely/cms-sdk';

const data = await getClient().request(
  `query GetPages {
    _Page(limit: 100) {
      items {
        _metadata {
          url {
            default
          }
        }
      }
    }
  }`,
  {},
);
```

## GraphReference

A reference to one content item, accepted by `getContent()`, `getPath()` and `getItems()`.

```ts
import type { GraphReference } from '@optimizely/cms-sdk';

const reference: GraphReference = {
  key: '880777d5a2824399b07e93e3ca70668e',
  locale: 'en',
};
```

| Field     | Type     | Required | Description                                    |
| --------- | -------- | -------- | ---------------------------------------------- |
| `key`     | `string` | Yes      | The content key                                |
| `locale`  | `string` | No       | The locale, such as `'en'` or `'sv'`           |
| `version` | `string` | No       | A specific version                             |
| `type`    | `string` | No       | The content type key. Not used in the query    |
| `source`  | `string` | No       | Reserved for future use. Not used in the query |

### The `graph://` string format

The same reference can be written as a string:

```text
graph://[<source>/][<type>/]<key>[?loc=<locale>&ver=<version>]
```

The path has one, two or three segments, read like this:

| String                                        | Parsed as                                            |
| --------------------------------------------- | ---------------------------------------------------- |
| `graph://<key>`                               | `{ key }`                                            |
| `graph://<type>/<key>`                        | `{ type, key }`                                      |
| `graph://<source>/<type>/<key>`               | `{ source, type, key }`                              |
| `graph://<source>/<type>/<key>?loc=en&ver=12` | `{ source, type, key, locale: 'en', version: '12' }` |

So `graph://Page/880777d5a2824399b07e93e3ca70668e` and
`graph://cms/Page/880777d5a2824399b07e93e3ca70668e` are both valid and fetch the same
item, since only `key`, `loc` and `ver` affect the query.

### Caveats

- **A string must start with `graph://`.** Otherwise `getContent()` throws
  `Invalid graph reference format. Expected to start with "graph://"`, while `getPath()`
  and `getItems()` treat it as a URL path.
- **A string with no key throws**
  `Invalid graph reference format. Expected at least key to be present`.
- **Don't use more than three segments.** With four or more, the first segment is read as
  the key.
- Query parameters other than `loc` and `ver` are ignored, and so are trailing slashes.

## Troubleshooting

### `getContentByPath()` returns an empty array

- Check that the content is published, and that the path matches its URL in the CMS,
  including the locale prefix.
- Check that its content type is registered with `initContentTypeRegistry()`.
- If you set `host`, check that it matches the site's URL base, including the scheme.

### `Unknown type` or `Cannot query field` errors

The content types in your code and in the CMS are out of sync. Push them with
`optimizely-cms-cli config push`. See [CLI](./cli.md).

### `getPath()` throws that `_metadata` has no `path` field

The full message starts with ``The `_metadata` does not contain any `path` field``.
`getPath()` was called for content that isn't a page. Pass the path or key of a page.
