# Data Model: Enable Query Caching by Removing Complex Input Arguments

**Date**: 2026-08-20 | **Plan**: [plan.md](plan.md)

## Entities

### QueryVariant

Represents a specific static query shape for a given use case.

| Attribute | Type | Description |
|-----------|------|-------------|
| `operationName` | string | GraphQL operation name (e.g., `GetContent`, `GetContentByPath`, `GetItems`) |
| `queryType` | enum | One of: `metadata`, `single`, `multiple`, `path`, `items` |
| `filterShape` | enum | One of: `by-key`, `by-path`, `by-path-with-host`, `by-preview`, `by-reference` |
| `variationMode` | enum | One of: `none`, `all`, `some-N` (where N = value count) |
| `queryString` | string | The complete static GraphQL query definition with inlined filters and scalar variables |
| `variables` | Record<string, scalar> | Map of variable name → scalar value (string, number, boolean, enum) |

**Identity**: A QueryVariant is uniquely identified by the combination of `queryType` + `filterShape` + `variationMode` + content type fragments.

**Lifecycle**: QueryVariants are generated at query time and cached client-side by `withQueryCaching()`. They are also registered server-side as stored queries on first use.

### GraphQueryOptions (modified)

Extends the existing options type with a `stored` flag.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `cache` | boolean | `true` | Existing: controls HTTP response caching via `?cache=` URL param |
| `stored` | boolean | `true` | New: controls stored query registration via `&stored=` URL param |

### Static Query Catalog

Enumerates all known static query shapes. Each entry maps to a QueryVariant template.

| Query Type | Filter Shape | Scalar Variables | Variation |
|------------|-------------|-----------------|-----------|
| `metadata` | `by-key` | `$key: String` | N/A |
| `metadata` | `by-path` | `$path: String, $pathNoSlash: String` | N/A |
| `metadata` | `by-path-with-host` | `$path: String, $pathNoSlash: String, $host: String` | N/A |
| `metadata` | `by-preview` | `$key: String, $version: String, $locale: String` | `ALL` (inlined) |
| `single` | `by-key` | `$key: String` | `none` (omitted) |
| `single` | `by-preview` | `$key: String, $version: String, $locale: String` | `ALL` (inlined) |
| `multiple` | `by-path` | `$path: String, $pathNoSlash: String, $locale: [Locales]` | configurable |
| `multiple` | `by-path-with-host` | `$path: String, $pathNoSlash: String, $host: String, $locale: [Locales]` | configurable |
| `path` | `by-key` | `$key: String, $locale: [Locales]` | N/A |
| `items` | `by-key` | `$key: String, $locale: [Locales]` | N/A |

## Relationships

```
GraphClient
  ├── uses → QueryVariant (selects appropriate variant based on method + options)
  ├── uses → GraphQueryOptions (receives stored/cache flags)
  └── uses → withQueryCaching() (caches generated query strings by variant key)

QueryVariant
  ├── determined by → filterShape (which static template to use)
  ├── determined by → variationMode (which variation to inline)
  └── cached by → withQueryCaching() (memoized by content type + options)
```

## Validation Rules

- All query variables MUST be scalar types (String, Int, Boolean) or GraphQL enums (`Locales`). No complex input objects.
- Operation names MUST be unique across all query variants to prevent stored query collisions.
- Filter field ordering within inlined structures MUST be alphabetical for determinism.
- `stored` option MUST default to `true` when not explicitly set.
- Preview queries MUST set `cache=false` and `stored=true` simultaneously.

## State Transitions

QueryVariant lifecycle:

```
[Not Generated] → (query requested) → [Generated & Cached Client-Side]
                                         → (first server request) → [Registered as Stored Query Server-Side]
                                         → (subsequent requests) → [Reused from Stored Query]
```

No invalidation mechanism exists client-side (Map is per-process). Server-side stored query invalidation is managed by the server.
