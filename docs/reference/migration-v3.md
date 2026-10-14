# Migrating to 3.0

Version 3.0.0 of `@optimizely/cms-sdk` and `@optimizely/cms-cli` changes how you configure
the client, what Rich Text queries fetch, and what `config push` accepts. This page lists
every breaking change, with the code to change for each one.

Upgrade both packages together:

```sh
npm install @optimizely/cms-sdk@^3
npm install -D @optimizely/cms-cli@^3
```

Skip the second command if you run the CLI with `npx @optimizely/cms-cli@latest`.

| Change                                                                                                          | Who it affects                                                |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`config()` options moved into `fragment` and `query`](#config-options-moved-into-fragment-and-query)           | Anyone passing more than `apiKey`, `graphUrl` or `userAgent`  |
| [Rich Text fetches only `json`](#rich-text-fetches-only-json-by-default)                                        | Apps that render the `html` field of a Rich Text property     |
| [`config push` rejects unconstrained content properties](#config-push-rejects-unconstrained-content-properties) | Content types with `content` or `contentReference` properties |
| [The `'standard'` Rich Text preset is gone](#the-standard-rich-text-preset-is-gone)                             | Content types using `editorSettings: { preset: 'standard' }`  |
| [`dam` can't be set per request](#dam-cant-be-set-per-request)                                                  | Code written against the 2.3.0 pre-release                    |

## `config()` options moved into `fragment` and `query`

The options that used to sit at the top level of `config()` now live in one of two groups:

- **`fragment`** holds the settings that shape the generated GraphQL query. They are fixed
  for the lifetime of a client.
- **`query`** holds the defaults for options you can also override on a single request.

`maxFragmentThreshold` is also renamed to `fragment.maxThreshold`.

Before:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  maxFragmentThreshold: 100,
  expandContracts: true,
  cache: true,
  slot: 'Current',
  host: process.env.APPLICATION_HOST,
});
```

After:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  fragment: {
    maxThreshold: 100,
    expandContracts: true,
  },
  query: {
    cache: true,
    slot: 'Current',
    host: process.env.APPLICATION_HOST,
  },
});
```

To fix it, move each option into its group:

| Option                 | Goes in                            |
| ---------------------- | ---------------------------------- |
| `maxFragmentThreshold` | `fragment`, renamed `maxThreshold` |
| `expandContracts`      | `fragment`                         |
| `cache`                | `query`                            |
| `slot`                 | `query`                            |
| `host`                 | `query`                            |
| `dam`                  | `fragment`                         |

`dam` only existed in the 2.3.0 pre-release. The same moves apply to the options object of
`new GraphClient()` and to overrides passed to `getClient()`.

> [!WARNING]
>
> An option left at the top level is ignored, so the client silently falls back to the
> default. TypeScript reports it, but plain JavaScript doesn't.

Per-request options such as `cache`, `slot` and `host` are unchanged:

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContentByPath('/about/', {
  host: 'https://www.example.com',
});
```

See [`config()`](./config.md) for every option in each group.

## Rich Text fetches only `json` by default

Every Rich Text property has two representations in Graph: `html` and `json`. Queries used
to select both. They now select only `json`, which is what the `<RichText>` component
renders, so queries and responses are smaller.

As a result, `html` is `undefined`, and a component that renders the raw HTML string shows
nothing:

```tsx
// src/components/Article.tsx
import { contentType, type ContentProps } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    body: { type: 'richText' },
  },
});

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  // Renders nothing in 3.0: `html` is no longer fetched
  return <div dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }} />;
}
```

There are two ways to fix it:

- **Render with `<RichText>`** (recommended). It reads `json`, so the default works as is:

  ```tsx
  // src/components/Article.tsx
  import { contentType, type ContentProps } from '@optimizely/cms-sdk';
  import { RichText } from '@optimizely/cms-sdk/react/richText';

  export const ArticleContentType = contentType({
    key: 'Article',
    displayName: 'Article',
    baseType: '_page',
    properties: {
      body: { type: 'richText' },
    },
  });

  type Props = {
    content: ContentProps<typeof ArticleContentType>;
  };

  export default function Article({ content }: Props) {
    return <RichText content={content.body?.json} />;
  }
  ```

- **Keep the HTML string** by setting `fragment.richTextFormat` to `'html'`, or to
  `'both'` if the app uses both representations:

  ```ts
  // src/lib/optimizely.ts
  import { config } from '@optimizely/cms-sdk';

  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    fragment: {
      richTextFormat: 'html',
    },
  });
  ```

Apps that already render Rich Text with `<RichText>` need no change. See
[Rich text](../guides/rich-text.md).

## `config push` rejects unconstrained content properties

Every `content` and `contentReference` property, including array items, must now declare
exactly one form of type constraint:

- `contentType`, on a `contentReference` property only, or
- a non-empty `allowedTypes` or `restrictedTypes`.

These used to be warnings. Now `config push` lists each violation and exits without
uploading anything, so a content model that pushed cleanly on 2.x can be rejected.
Unconstrained properties make the SDK generate a fragment for every registered content
type, which produces large, slow queries.

Before:

```ts
// src/components/LandingPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { ImageContentType } from './Image';

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    // missing type constraints
    mainContent: { type: 'content' },
    // empty type constraints
    gallery: { type: 'content', allowedTypes: [] },
    // conflicting type constraints
    hero: {
      type: 'contentReference',
      contentType: ImageContentType,
      allowedTypes: [ImageContentType],
    },
  },
});
```

After:

```ts
// src/components/LandingPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { ImageContentType } from './Image';
import { TeaserContentType } from './Teaser';

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    mainContent: { type: 'content', allowedTypes: [TeaserContentType] },
    gallery: { type: 'content', restrictedTypes: ['_folder'] },
    hero: { type: 'contentReference', contentType: ImageContentType },
  },
});
```

To fix it, run `optimizely-cms-cli config push --dryRun` to list every violation without
uploading anything. Then give each property the constraint that matches your intent. If a
property really accepts a wide range of types, use `restrictedTypes` to exclude what it
can't hold, rather than leaving it open.

The CLI also rejects `contentType` on a `content` property, because the CMS ignores it
there. Use `allowedTypes` instead. See [Content types](../guides/content-types.md) for the
constraint options.

## The `'standard'` Rich Text preset is gone

The CMS never supported a `'standard'` editor preset, so the SDK no longer accepts it. The
presets are now `'default'`, `'expanded'` and `'minimal'`, and a content type that uses
`'standard'` no longer type-checks.

Before:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    summary: { type: 'richText', editorSettings: { preset: 'standard' } },
  },
});
```

After:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    summary: { type: 'richText', editorSettings: { preset: 'default' } },
  },
});
```

To fix it, replace `preset: 'standard'` with `preset: 'default'`. See
[Property types](./property-types.md).

## `dam` can't be set per request

`fragment.dam` decides whether the generated query includes DAM asset fragments. Because
it shapes the query, it is fixed for the lifetime of a client. The 2.3.0 pre-release
accepted it on individual requests. 3.0.0 doesn't.

Before:

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient().getContentByPath('/about/', { dam: 'on' });
```

After:

```ts
import { getClient } from '@optimizely/cms-sdk';

const content = await getClient({ fragment: { dam: 'on' } }).getContentByPath('/about/');
```

To fix it, set `dam` in the `fragment` group of `config()`, or pass it to `getClient()`
when one part of the app needs a different setting. See
[DAM assets](../guides/dam-assets.md).

## Other changes to check

These aren't listed as breaking, but they change behaviour you may rely on:

- **Section properties are flat on `content`.** Read the properties of a `_section`
  content type as `content.title`, not `content.component.title`. Code that used the old
  path stops type-checking.
- **Live preview refreshes sooner.** The default `refreshTimeout` of `PreviewComponent` is
  now `50` ms instead of `300`. Pass `refreshTimeout` to keep the old delay. See
  [React components](./react-components.md).
