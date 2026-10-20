# Data Model: CMS Taxonomy Categories Support

**Date**: 2026-09-24 | **Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## New Types

### `TaxonomyMode` (options.ts)

Tri-state option type mirroring `DamMode`.

```
TaxonomyMode = 'automatic' | 'on' | 'off'
```

- `'automatic'` (default): SDK probes the Graph schema for `_TaxonomyTerm` type
- `'on'`: force-include `categories` in `ItemMetadata` fragment
- `'off'`: never include `categories`

**Appears on**: `GraphFragmentOptions.taxonomy` field

### `ResolvedCategory` (new exported type)

Represents a single resolved category with its breadcrumb hierarchy.

```
ResolvedCategory = {
  uri: string              -- the category term URI
  name: string | null      -- localized display label (null if term deleted/unresolvable)
  path: Array<{
    uri: string            -- ancestor term URI
    name: string | null    -- ancestor localized label
  }>                       -- ordered root-to-leaf, term itself is last element
}
```

**Invariants**:
- `path` always has at least one element (the term itself)
- `path[path.length - 1].uri === uri` (last element is the term)
- `path[path.length - 1].name === name` (convenience accessor)
- `name: null` indicates the term could not be resolved (deleted/moved)

## Modified Types

### `InferredItemMetadata` (infer.ts)

**Before**:
```
{
  changeset: string | null
  displayOption: string | null
}
```

**After**:
```
{
  changeset: string | null
  displayOption: string | null
  categories: string[] | undefined   -- NEW: raw category term URIs
}
```

This is flattened into `_metadata` via `Partial<InferredItemMetadata>`.

### `GraphFragmentOptions` (options.ts)

**Added field**:
```
taxonomy?: TaxonomyMode    -- default: 'automatic'
```

Follows the naming convention: `DamMode` type → `dam` field; `TaxonomyMode` type → `taxonomy` field.

### `GraphGetItemOptions` (options.ts)

**Added field**:
```
resolveCategories?: boolean   -- default: false (opt-in)
```

### `GraphGetContentOptions` (options.ts)

**Added field**:
```
resolveCategories?: boolean   -- default: false (opt-in)
```

### `GraphGetPreviewOptions` (new type in options.ts)

Replaces the bare `GraphQueryOptions` currently used by `getPreviewContent`.

```
GraphGetPreviewOptions = GraphQueryOptions & {
  resolveCategories?: boolean
}
```

### `QueryContext` (queryUtils.ts)

**Added field**:
```
taxonomyEnabled: boolean    -- default: false
```

Mirrors `damEnabled` and `formsEnabled`.

### `ResolvedFragmentOptions` (options.ts)

Now includes `taxonomy: TaxonomyMode` (resolved from defaults).

## Modified Constants / Fragments

### `COMMON_FRAGMENTS` in `baseTypeUtil.ts`

The `ItemMetadata` fragment conditionally includes `categories`:

**When `taxonomyEnabled: true`**:
```graphql
fragment ItemMetadata on ItemMetadata { changeset displayOption categories }
```

**When `taxonomyEnabled: false`**:
```graphql
fragment ItemMetadata on ItemMetadata { changeset displayOption }
```

This requires `getBaseTypeFragments()` to accept `taxonomyEnabled` and conditionally build the fragment string, OR `COMMON_FRAGMENTS` becomes a function rather than a constant array.

### `METADATA_QUERY_BODY` in `queries.ts`

**Added probe**:
```graphql
taxonomyType: __type(name: "_TaxonomyTerm") {
  __typename
}
```

### `createCacheKey()` in `cache.ts`

**Added component**: `taxonomyEnabled` in the key array, positioned after `formsEnabled`.

## Data Flow

```
User config: taxonomy: 'automatic' | 'on' | 'off'
  → GraphClient.fragmentDefaults.taxonomy
  → METADATA_QUERY_BODY probes: taxonomyType: __type(name: "_TaxonomyTerm")
  → getContentMetaData() resolves to taxonomyEnabled: boolean
  → fragmentContext() strips taxonomy, includes taxonomyEnabled
  → createQueryContext() stores taxonomyEnabled on QueryContext
  → getBaseTypeFragments() conditionally includes categories in ItemMetadata fragment
  → createCacheKey() includes taxonomyEnabled in key
  → Response: _metadata.categories = string[] | undefined

When resolveCategories: true (operations layer):
  → Extract _metadata.categories URIs from content response
  → Batch _TaxonomyTerm query for all unique URIs (with locale)
  → Construct ResolvedCategory[] from term data
  → Attach _metadata.resolvedCategories to response
```

## Response Shape

### Without resolveCategories (default)

```json
{
  "_metadata": {
    "categories": ["term-uri-1", "term-uri-2"],
    "key": "...",
    "types": ["PageType"],
    ...
  }
}
```

### With resolveCategories: true

```json
{
  "_metadata": {
    "categories": ["term-uri-1", "term-uri-2"],
    "resolvedCategories": [
      {
        "uri": "term-uri-1",
        "name": "Nordic",
        "path": [
          { "uri": "root-uri", "name": "Region" },
          { "uri": "parent-uri", "name": "Europe" },
          { "uri": "term-uri-1", "name": "Nordic" }
        ]
      },
      {
        "uri": "term-uri-2",
        "name": "Technology",
        "path": [
          { "uri": "term-uri-2", "name": "Technology" }
        ]
      }
    ],
    "key": "...",
    "types": ["PageType"],
    ...
  }
}
```

### When taxonomy not supported (schema-level)

```json
{
  "_metadata": {
    "key": "...",
    "types": ["PageType"],
    ...
  }
}
```

`_metadata.categories` is `undefined` (field not selected in query). `_metadata.resolvedCategories` is `undefined`.
