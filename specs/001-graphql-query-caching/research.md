# Research: Enable Query Caching by Removing Complex Input Arguments

**Date**: 2026-08-20 | **Plan**: [plan.md](plan.md)

## R1: Static Query Shape Strategy

**Decision**: Generate multiple static query variants per query type rather than a single dynamic query with complex input objects.

**Rationale**: Each logical use case (by-key, by-path, by-preview, with-host, without-host) has a fixed filter structure — only the values are dynamic. Creating static variants with inlined filter structures and scalar-only variables makes every query deterministic and eligible for server-side stored query reuse.

**Alternatives considered**:
- **Single parameterized query with restructured input types**: Would still require complex input objects, defeating the caching goal.
- **String interpolation of filters**: Fragile, prone to injection, breaks the GraphQL variable contract.

## R2: `stored=true` Delivery Mechanism

**Decision**: Append `stored=true` as a URL query parameter on the GraphQL endpoint, alongside the existing `?cache=true` parameter.

**Rationale**: The existing codebase already uses URL query parameters for cache control (`?cache=true/false`). Using the same pattern for `stored=true` is consistent and requires minimal changes to the HTTP request layer. The `GraphClient.request()` method already constructs the URL with query parameters.

**Alternatives considered**:
- **GraphQL directive (`@stored`)**: Would require server-side directive registration — outside SDK scope.
- **HTTP header**: Less visible in logs/debugging than URL parameters. Inconsistent with existing `?cache` pattern.

## R3: Variation Handling (Non-Scalar Type)

**Decision**: Inline variation mode into the static query definition. `NONE` → omit variation, `ALL` → inline `variation: ALL`, `SOME` → generate a query variant with N scalar `String` variables for values.

**Rationale**: `VariationInput` is a discriminated union with 3 modes. Two modes (`NONE`, `ALL`) are constant and can be fully inlined. `SOME` mode has a dynamic-length value array — each distinct count of values becomes a separate static query shape. The existing `withQueryCaching()` already incorporates a filter hash that differentiates these shapes.

**Alternatives considered**:
- **Keep `VariationInput` as-is**: Would leave one complex input type, partially defeating the caching benefit.
- **Flatten to a single comma-separated `String` variable**: Would require server-side parsing changes — outside scope.

## R4: Host Filtering for Multi-Site

**Decision**: Generate two static query variants for path-based queries: without-host (default) and with-host (when `host` is configured). The with-host variant adds a `$host: String` scalar variable and `base: { eq: $host }` to each `_or` condition.

**Rationale**: The `pathFilter()` function already conditionally adds `base: { eq: host }` — this is a known, binary condition (host present or not). Two static variants cover both cases without dynamic filter construction.

**Alternatives considered**:
- **Always include host variable, pass `null` when unused**: GraphQL `eq: null` semantics may differ from omission — risk of incorrect results.
- **Single variant with optional host**: Complex input structure would remain — defeats the goal.

## R5: Filter Ordering Normalization

**Decision**: Normalize filter field ordering alphabetically when constructing inlined filter structures to ensure deterministic query strings.

**Rationale**: The spec requires identical requests to produce identical query strings (FR-002). Without normalization, different field orderings in the same logical filter would produce different strings, causing cache misses and duplicate stored queries.

**Alternatives considered**:
- **Hash-based query identity (ignore string order)**: Would require server-side changes to use hash-based identity for stored queries — outside scope.
- **Preserve insertion order**: Non-deterministic, breaks caching guarantee.

## R6: Metadata Discovery Query Transition

**Decision**: Convert `GET_CONTENT_METADATA_QUERY` to multiple static variants (by-key, by-path, by-preview) with inlined filters, just like the other query types.

**Rationale**: This query runs before every content retrieval to discover the content type. It already has a fixed set of filter shapes (key-based from `referenceFilter`, path-based from `pathFilter`, preview from `previewFilter`). Converting it to static variants is straightforward and ensures the entire query pipeline benefits from stored queries.

**Alternatives considered**:
- **Leave metadata query as-is**: Would leave one query type using complex inputs, inconsistent and missing caching benefit for a frequently-executed query.

## R7: Impact on `withQueryCaching()` Cache Keys

**Decision**: The existing `withQueryCaching()` mechanism in `util/cache.ts` remains as-is. Cache keys already incorporate content type, options, and a filter hash. The new static query variants will naturally produce distinct cache keys due to different content type and option combinations.

**Rationale**: `withQueryCaching()` caches generated query *strings* (the fragment-based dynamic queries). Since the static query template is now determined by the use case (by-key, by-path, etc.) and the fragments are still dynamically generated based on content type, the existing cache key scheme continues to work correctly.

**Alternatives considered**:
- **Rebuild cache key scheme**: Unnecessary complexity — existing scheme already differentiates query shapes.

## R8: Opt-Out Mechanism for Stored Queries

**Decision**: Add a `stored` option to `GraphQueryOptions` (or equivalent options type) with default value `true`. When `false`, omit `stored=true` from the URL query parameters.

**Rationale**: Developers need an escape hatch for debugging (e.g., bypassing stored query to test schema changes). The opt-out follows the same pattern as the existing `cache` option.

**Alternatives considered**:
- **Environment variable toggle**: Less granular — can't control per-request. Useful as an additional global override but not sufficient alone.
- **No opt-out**: Limits developer control, makes debugging harder.
