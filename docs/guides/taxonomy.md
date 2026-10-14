# Use taxonomy categories

Editors in Optimizely CMS can tag content with **taxonomy categories**: hierarchical terms
managed in Category Admin. The SDK fetches these categories with your content and can
resolve them into display names and parent chains, so you can render breadcrumbs, build
navigation or filter content by category.

> **You will learn**
>
> - How the SDK decides whether to fetch categories
> - How to read a content item's categories
> - How to resolve categories into names and hierarchy
> - How resolved terms are cached

## How the SDK detects taxonomy

By default, the SDK checks whether your Graph schema supports taxonomy by looking for a
`categories` field on the `_Metadata` type. The check rides along on the metadata request
the SDK already makes, so it costs no extra round trip. When the field exists, every
content query includes the item's categories.

To skip the check, set `fragment.taxonomy` when you configure the client:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    taxonomy: 'on',
  },
});
```

| Value                   | Behaviour                                             |
| ----------------------- | ----------------------------------------------------- |
| `'automatic'` (default) | Fetch categories when the schema has a taxonomy field |
| `'on'`                  | Always fetch categories                               |
| `'off'`                 | Never fetch categories                                |

The setting shapes the generated query, so it is fixed for the lifetime of the client and
can't be changed on a single request.

## Read categories

When taxonomy is on, every content item has `_metadata.categories`, an array of term keys:

```ts
import { getClient } from '@optimizely/cms-sdk';

const page = await getClient().getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

console.log(page._metadata.categories);
// ['nordic', 'technology']
```

Graph returns each category as a reference to the term. The SDK keeps only the last path
segment of that reference, which is the term's key.

- If the content has no categories, `categories` is an empty array.
- If taxonomy is off or not available in the schema, `categories` is `undefined`.

## Resolve names and hierarchy

Keys are enough for filtering, but to show a category to a visitor you need its name. Pass
`resolveTaxonomy: true` and the SDK looks the terms up and adds them as
`_metadata.resolvedCategories`:

```ts
import { getClient } from '@optimizely/cms-sdk';

const page = await getClient().getContent(
  { key: '880777d5a2824399b07e93e3ca70668e' },
  { resolveTaxonomy: true },
);

const breadcrumbs = page._metadata.resolvedCategories?.map(term =>
  term.path.map(ancestor => ancestor.displayName).join(' › '),
);
// ['Region › Europe › Nordic', 'Topic › Technology']
```

`resolvedCategories` has one entry per category, in the same order as
`_metadata.categories`. Each entry is a `TaxonomyTerm`:

| Field          | Type              | Description                                                     |
| -------------- | ----------------- | --------------------------------------------------------------- |
| `key`          | `string`          | The short term key, the same value as in `_metadata.categories` |
| `displayName`  | `string \| null`  | The term's label in the content item's locale                   |
| `description`  | `string \| null`  | The term's description                                          |
| `taxonomy`     | `string \| null`  | The taxonomy the term belongs to                                |
| `usage`        | `string \| null`  | Usage information                                               |
| `path`         | `object[]`        | The term's ancestors and the term itself, root first. See below |
| `sortOrder`    | `number \| null`  | Always `null`. The SDK doesn't fetch it yet                     |
| `isAvailable`  | `boolean \| null` | Always `null`. The SDK doesn't fetch it yet                     |
| `isSelectable` | `boolean \| null` | Always `null`. The SDK doesn't fetch it yet                     |

`path` is the breadcrumb: it starts at the root of the taxonomy and ends with the term
itself, so a top-level term has a one-entry path. The SDK follows up to 20 levels of
parents. Each entry carries the same `key`, `displayName`, `description`, `taxonomy` and
`usage` fields as the term itself, so you can render any level of the breadcrumb in full.

To resolve categories on every request, set it once in the client's `query` group instead:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  query: { resolveTaxonomy: true },
});
```

`resolveTaxonomy` works on `getContent`, `getContentByPath` and `getPreviewContent`.
`getContentByPath` can return items in several locales, so it resolves each item's labels
in that item's own `_metadata.locale`.

### When a term can't be resolved

If a category points to a deleted or moved term, its entry is still there, so the order
still matches `_metadata.categories`. Every field except `key` and `path` is `null`, and
`path` holds only the term itself:

```ts
const unresolved = {
  key: 'deleted-term',
  displayName: null,
  path: [
    {
      key: 'deleted-term',
      displayName: null,
      description: null,
      taxonomy: null,
      usage: null,
    },
  ],
  // description, taxonomy, usage, … are null
};
```

### When the lookup fails

If the taxonomy query fails, for example because of a network error, `resolvedCategories`
is `undefined` and the SDK logs a warning. The content itself, including
`_metadata.categories`, is returned as normal.

`resolvedCategories` is also `undefined` when taxonomy is off, and an empty array when the
content has no categories.

## Caching

Resolved terms are cached in memory for the lifetime of the process, separately for each
Graph endpoint, key and locale:

- The first fetch looks up the terms it needs and caches them.
- Later fetches reuse the cache. Only keys it hasn't seen yet trigger a query.
- Twenty content items sharing the same categories cost one taxonomy query, not twenty.

> [!WARNING]
>
> The cache has no expiry and no public way to clear it. After you rename or move terms in
> the CMS, restart the server to pick up the change.

## TypeScript types

```ts
import type { TaxonomyMode, TaxonomyTerm } from '@optimizely/cms-sdk';
```

`TaxonomyMode` is `'automatic' | 'on' | 'off'`. `TaxonomyTerm` is the shape of one entry
in `resolvedCategories`.

## Recap

- The SDK fetches `_metadata.categories` when your Graph schema supports taxonomy. Force
  it with `fragment.taxonomy`.
- `categories` holds short term keys, useful for filtering.
- `resolveTaxonomy: true` adds `resolvedCategories`, with display names and a root-first
  `path` for breadcrumbs.
- Resolved terms are cached for the life of the process.

## Related

- [Fetch content](../learn/fetch-content.md)
- [Navigation](./navigation.md)
- [Configuration reference](../reference/config.md)
- [GraphClient reference](../reference/graph-client.md)
