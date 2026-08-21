# Query Contracts: Enable Query Caching by Removing Complex Input Arguments

**Date**: 2026-08-20 | **Plan**: [plan.md](plan.md)

## Overview

This document defines the interface contracts for the SDK's GraphQL query generation. These are the public-facing query shapes and options that consumers interact with through the SDK's public API. The SDK's public method signatures remain unchanged — these contracts describe the internal query format sent to the server.

## Contract 1: GraphQL Query Variable Types

**Before** (complex input objects):
```graphql
query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) { ... }
}
```

**After** (scalar variables only):
```graphql
query GetContent($key: String) {
  _Content(where: { _metadata: { key: { eq: $key } } }) { ... }
}
```

**Rule**: All GraphQL query variables MUST be one of: `String`, `Int`, `Boolean`, `[Locales]` (enum array). No `_ContentWhereInput`, `VariationInput`, or other complex input types.

## Contract 2: URL Query Parameters

**Endpoint format**:
```
{GRAPH_URL}?cache={true|false}&stored={true|false}
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `cache` | `true` | Controls HTTP response caching (existing) |
| `stored` | `true` | Controls server-side stored query registration (new) |

**Rules**:
- `stored=true` is appended by default for all requests
- Preview requests: `cache=false&stored=true`
- Developer opt-out: `stored=false` via `GraphQueryOptions`

## Contract 3: GraphQueryOptions Extension

**New option**:

```typescript
interface GraphQueryOptions {
  cache?: boolean;   // existing, default true
  stored?: boolean;  // new, default true
}
```

**Rules**:
- When `stored` is `undefined` or `true`, append `&stored=true` to the endpoint URL
- When `stored` is explicitly `false`, omit `stored` from the URL (or append `&stored=false`)
- The `stored` option is independent of `cache` — they control different server-side behaviors

## Contract 4: Operation Name Uniqueness

Each query type MUST use a unique GraphQL operation name:

| Query Type | Operation Name |
|------------|---------------|
| Metadata discovery (by-key) | `GetContentMetadata` |
| Metadata discovery (by-path) | `GetContentMetadataByPath` |
| Metadata discovery (by-preview) | `GetPreviewContentMetadata` |
| Single content (by-key) | `GetContent` |
| Single content (by-preview) | `GetPreviewContent` |
| Multiple content (by-path) | `GetContentByPath` |
| Multiple content (by-path, with host) | `GetContentByPathWithHost` |
| Path/ancestors | `GetPath` |
| Child items | `GetItems` |

**Rule**: Operation names MUST NOT collide. The existing `GET_ITEMS_QUERY` using operation name `GetPath` (copy-paste bug) MUST be fixed to `GetItems`.

## Contract 5: Filter Structure Determinism

**Rule**: When multiple filter fields exist at the same nesting level, they MUST be ordered alphabetically by field name in the inlined GraphQL structure.

Example — fields ordered as `base`, `default`, `hierarchical`:
```graphql
_metadata: {
  url: {
    base: { eq: $host },
    default: { eq: $path },
    hierarchical: { eq: $path }
  }
}
```

This ensures identical logical queries always produce identical query strings.

## Contract 6: Public API Stability

The following public SDK methods remain unchanged in signature and behavior:

| Method | Signature (unchanged) |
|--------|----------------------|
| `getContent` | `(ref: ContentReference, options?: GetContentOptions): Promise<T>` |
| `getContentByPath` | `(path: string, options?: GetContentByPathOptions): Promise<T>` |
| `getPreviewContent` | `(params: PreviewParams): Promise<T>` |
| `getPath` | `(ref: ContentReference, options?): Promise<PathItem[]>` |
| `getItems` | `(ref: ContentReference, options?): Promise<ContentItem[]>` |

**Rule**: No breaking changes to method signatures, parameter types, or return types. The query format change is internal to the SDK. Consumers should not need to modify any code.

## Contract 7: Variation Handling

| Mode | Query Shape | Variables |
|------|------------|-----------|
| `NONE` (default) | `variation` omitted from query | None |
| `ALL` (preview) | `variation: ALL` inlined in query | None |
| `SOME` (selective) | `variation: { include: SOME, value: [$v1, $v2, ...] }` inlined with scalar vars | `$v1: String, $v2: String, ...` |

**Rule**: Each distinct count of `SOME` values produces a different static query shape. Different counts = different stored queries.
