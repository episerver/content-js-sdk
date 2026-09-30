# Working with Taxonomy Categories

Content in Optimizely CMS can be assigned taxonomy categories — hierarchical terms that editors manage in Category Admin. The SDK automatically includes these categories in content queries and can optionally resolve their full hierarchy (parent chain, display names) so you can render breadcrumbs, build navigation trees, or filter content by category.

## How taxonomy detection works

By default, the SDK detects whether your Content Graph schema supports taxonomy and, when it does, adds the `categories` field to the `ItemMetadata` fragment. This detection rides along on the metadata request the SDK already makes, so it costs no extra round trip.

You can control this behaviour with the `taxonomy` option, which accepts:

- `'automatic'` (default) — include `categories` when the schema exposes taxonomy types.
- `'on'` — always include `categories`.
- `'off'` — never include `categories`.

Set it in the `fragment` group when configuring the client:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    taxonomy: 'automatic', // 'automatic' | 'on' | 'off'
  },
});
```

This shapes the generated query, so it is fixed for the lifetime of a client and cannot be overridden on a single request.

## Reading categories

When taxonomy is enabled (detected or forced on), every content item includes `_metadata.categories` — an array of taxonomy term keys:

```ts
const page = await client.getContent(reference);

console.log(page._metadata.categories);
// ['region-europe-nordic', 'topic-technology']
```

If the content has no categories assigned, this is an empty array `[]`. If taxonomy is not available in the schema, it is `undefined`.

## Resolving category hierarchy

Raw category keys are useful for filtering, but to display names or breadcrumbs you need the full term data. Pass `resolveTaxonomy: true` on any content-fetching call:

```ts
const page = await client.getContent(reference, {
  resolveTaxonomy: true,
});

console.log(page._metadata.resolvedCategories);
// [
//   {
//     key: 'region-europe-nordic',
//     displayName: 'Nordic',
//     description: 'Nordic countries',
//     taxonomy: 'Region',
//     usage: null,
//     sortOrder: null,
//     isAvailable: null,
//     isSelectable: null,
//     path: [
//       { key: 'region', displayName: 'Region' },
//       { key: 'region-europe', displayName: 'Europe' },
//       { key: 'region-europe-nordic', displayName: 'Nordic' },
//     ],
//   },
//   ...
// ]
```

Each resolved term includes:

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | The term's unique identifier |
| `displayName` | `string \| null` | Localized display label (matches the content item's locale) |
| `description` | `string \| null` | Term description |
| `taxonomy` | `string \| null` | Which taxonomy tree the term belongs to |
| `usage` | `string \| null` | Usage information |
| `sortOrder` | `number \| null` | Sort position within siblings |
| `isAvailable` | `boolean \| null` | Whether the term is available for assignment |
| `isSelectable` | `boolean \| null` | Whether the term can be selected by editors |
| `path` | `Array<{ key, displayName }>` | Full breadcrumb from root to this term |

The `path` array is ordered root-to-leaf, with the term itself as the last element. For a root-level term, `path` has a single entry.

### When a term cannot be resolved

If a category key points to a deleted or moved term, the entry is still present (preserving the 1:1 mapping with `_metadata.categories`) but with `displayName: null`:

```ts
{
  key: 'deleted-term-key',
  displayName: null,
  path: [{ key: 'deleted-term-key', displayName: null }],
  // ...
}
```

### When the resolution query fails

If the `_TaxonomyTerm` query fails (network error, timeout), `resolvedCategories` is `undefined` and the SDK logs a warning. The content data itself (`_metadata.categories` with raw keys) remains intact.

## Caching

Resolved taxonomy terms are cached in memory for the lifetime of the process, keyed by endpoint and locale. This means:

- The first content fetch resolves and caches the terms.
- Subsequent fetches reuse cached terms — only new, uncached term keys trigger a query.
- 20 content items on a page sharing the same categories result in 1 taxonomy query, not 20.

The cache is cleared on process restart. To clear it manually (e.g., after a taxonomy restructure in the CMS):

```ts
import { clearTaxonomyCache } from '@optimizely/cms-sdk/graph';

clearTaxonomyCache();
```

## Works with all content-fetching methods

The `resolveTaxonomy` option is available on:

- `client.getContent(reference, { resolveTaxonomy: true })`
- `client.getContentByPath(path, { resolveTaxonomy: true })`
- `client.getPreviewContent(params, { resolveTaxonomy: true })`

For `getContentByPath`, which can return items in multiple locales, category labels are resolved per-item using each item's `_metadata.locale`.

## TypeScript

The `TaxonomyTerm` type is exported from the SDK:

```ts
import type { TaxonomyTerm, TaxonomyMode } from '@optimizely/cms-sdk';
```
