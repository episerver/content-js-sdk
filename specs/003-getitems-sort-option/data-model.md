# Data Model: getItems Sort Option

## New Types

### SortField

Enumeration of metadata fields that can be sorted on.

| Value | Maps to GraphQL `orderBy` path | Notes |
|-------|-------------------------------|-------|
| `'sortOrder'` | `{ _metadata: { sortOrder: <dir> } }` | CMS-defined sort position |
| `'displayName'` | `{ _metadata: { displayName: <dir> } }` | Alphabetical by page name |
| `'published'` | `{ _metadata: { published: <dir> } }` | Publication timestamp |

### SortDirection

| Value | Maps to GraphQL enum |
|-------|---------------------|
| `'asc'` | `ASC` |
| `'desc'` | `DESC` |

### SortOption

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field` | `SortField` | Yes | Metadata field to sort by |
| `direction` | `SortDirection` | Yes | Sort direction |

### Validation Rules

- `field` must be one of the allowed `SortField` values; otherwise a runtime error is thrown listing valid fields
- `direction` must be `'asc'` or `'desc'`

## Modified Types

### GraphGetLinksOptions (existing)

| Field | Type | Required | Change |
|-------|------|----------|--------|
| `cache` | `boolean` | No | Unchanged (inherited from `GraphQueryOptions`) |
| `stored` | `boolean` | No | Unchanged |
| `slot` | `GraphSlot` | No | Unchanged |
| `host` | `string` | No | Unchanged |
| `publishedOnly` | `boolean` | No | Unchanged |
| `resolveTaxonomy` | `boolean` | No | Unchanged |
| `locales` | `string[]` | No | Unchanged |
| **`sort`** | **`SortOption`** | **No** | **New — optional sort parameter** |

## GraphQL Query Changes

### Current `_Page` invocation (inside `_link`)

```graphql
_Page(locale: $locale)
```

### New `_Page` invocation (when sort provided)

```graphql
_Page(locale: $locale, orderBy: { _metadata: { sortOrder: ASC } })
```

### Metadata field additions

`published` added to the `_metadata` selection in `LINKS_BODY`:

```graphql
_metadata {
  key
  sortOrder
  displayName
  published    # NEW
  locale
  types
  url { base hierarchical default }
}
```
