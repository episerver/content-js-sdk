# Research: CMS Taxonomy Categories Support

**Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

## R-001: Where does `categories` live in the Graph schema?

**Decision**: `categories` is a field on the `ItemMetadata` GraphQL type (which is a subtype of `IContentMetadata`). It is selected via `...on ItemMetadata { categories }` in the `ItemMetadata` fragment — the same fragment that already selects `changeset` and `displayOption` in `baseTypeUtil.ts` (line ~132).

**Rationale**: The existing `COMMON_FRAGMENTS` array defines `fragment ItemMetadata on ItemMetadata { changeset displayOption }`. Adding `categories` to this fragment means it is automatically spread into `_metadata` via the `IContentMetadata` → `_IContent` fragment chain — no changes to `createQuery.ts` or any operation are needed for the raw field selection.

**Alternatives considered**:
- Adding a separate fragment for categories: rejected — would duplicate the `ItemMetadata` typed fragment and risk missing it in existing spreads.
- Adding to `IContentMetadata` directly: rejected — `categories` is specific to `ItemMetadata` (items have categories; media/instances do not).

**Verification needed**: Confirm the exact field name and type by inspecting a taxonomy-enabled Graph schema. If the field name differs from `categories`, the fragment and type must be adjusted. The spec's `[MUST VERIFY IN PLANNING]` assumption covers this.

## R-002: TaxonomyMode schema detection mechanism

**Decision**: Follow the existing `DamMode` pattern exactly. Add a `__type` introspection probe to `METADATA_QUERY_BODY` in `queries.ts`:

```graphql
taxonomyType: __type(name: "_TaxonomyTerm") {
  __typename
}
```

This is resolved in `getContentMetaData()` in `operations.ts` using the same tri-state logic as `DamMode`:

```typescript
const { taxonomy } = context.fragmentDefaults;
const taxonomyEnabled =
  taxonomy === 'on' ? true
  : taxonomy === 'off' ? false
  : data.taxonomyType !== null;
```

**Rationale**: The `DamMode` pattern is proven, tested, and understood by the team. `damMode.test.ts` provides a template for the taxonomy test. The `__type` introspection query is lightweight and piggybacked on the existing metadata query — no additional network call.

**Alternatives considered**:
- Runtime try/catch on query failure: rejected — would cause a visible error before recovery, and the query would need to be retried.
- Separate introspection query: rejected — adds a network round-trip.
- Build-time detection only: rejected — wouldn't handle runtime schema differences.

## R-003: How does `taxonomyEnabled` flow through the system?

**Decision**: Exact mirror of the `damEnabled` flow:

1. `TaxonomyMode` type defined in `options.ts` (`'automatic' | 'on' | 'off'`)
2. `taxonomy` field on `GraphFragmentOptions` (default `'automatic'`)
3. `taxonomyType` probe added to `METADATA_QUERY_BODY` in `queries.ts`
4. Resolved to `taxonomyEnabled: boolean` in `getContentMetaData()` in `operations.ts`
5. Passed to `fragmentContext()` — update to strip `taxonomy` tri-state and include `taxonomyEnabled` boolean
6. `taxonomyEnabled` added to `QueryContext` in `queryUtils.ts`
7. `createCacheKey()` in `cache.ts` includes `taxonomyEnabled` in the key array
8. `getBaseTypeFragments()` in `baseTypeUtil.ts` conditionally includes `categories` in the `ItemMetadata` fragment based on `taxonomyEnabled`

**Rationale**: Maintains architectural consistency. Every component in the chain already handles `damEnabled`; adding `taxonomyEnabled` alongside it is mechanical.

## R-004: Hierarchy resolution mechanism

**Decision**: Use a separate batched `_TaxonomyTerm` query in the operations layer. After the content query returns `_metadata.categories` (array of URIs), the SDK issues a single batched query to resolve all unique URIs to their hierarchy.

**Rationale**: 
- The Graph API does not currently support inline parent/ancestor selection on the `categories` field within `ItemMetadata` — `categories` returns raw URIs only.
- A batched `_TaxonomyTerm` query allows fetching all term hierarchies in a single request.
- This is orchestrated in `operations.ts` (post-content-query), which is why `resolveCategories` lives on the operations layer options, not on fragment options.

**Alternatives considered**:
- Inline query extension (selecting parent fields on categories): preferred if API supports it, but the Graph schema does not expose inline parent data on the `categories` field within `ItemMetadata`. If this changes in the future, the SDK can migrate the implementation without API changes.
- Per-term individual queries: rejected — N+1 problem.

**Verification needed**: Confirm the exact `_TaxonomyTerm` query shape and available fields (parent chain, name/label, locale support). If `_TaxonomyTerm` does not exist or has a different shape, Story 2 (hierarchy resolution) degrades gracefully: `resolvedCategories` is always `undefined`.

## R-005: Where does `resolveCategories` live and how does it affect caching?

**Decision**: `resolveCategories` is a boolean option on `GraphGetItemOptions` and `GraphGetContentOptions` (and a new `GraphGetPreviewOptions`). It is NOT on `GraphFragmentOptions` or `GraphQueryOptions`.

For caching: `resolveCategories` is included in the cache key at the operations level. Since `withQueryCaching` operates on the raw GraphQL query (not the augmented response), and `resolveCategories` does not change the GraphQL query itself (it's a post-query step), the cache key for the raw query does NOT need `resolveCategories`. Instead, the operations layer caches the augmented response separately, or computes `resolvedCategories` on cache hit when requested.

**Simplified approach**: Don't cache `resolvedCategories` separately. The raw content query is cached by `withQueryCaching` (which already includes `taxonomyEnabled`). The taxonomy term resolution query can also be cached (by URI set). When `resolveCategories: true`, the operations layer:
1. Fetches content (may hit cache)
2. Extracts `_metadata.categories` from the response
3. Fetches taxonomy terms (may hit a separate cache or be an inline query cache)
4. Attaches `resolvedCategories` to the response

This avoids complicating the existing `createCacheKey` with an operations-level concern.

**Rationale**: Keeps the query-level cache orthogonal to the response-augmentation concern.

## R-006: `resolvedCategories` type surfacing mechanism

**Decision**: Add `resolvedCategories` to the response in the operations layer by augmenting the returned object after the content query. The TypeScript type for `resolvedCategories` is surfaced by widening the return type of `getContent`/`getContentByPath`/`getPreviewContent` to include `_metadata: { resolvedCategories?: ResolvedCategory[] }`.

**Approach**: Define a `ResolvedCategory` type and export it. In the operations layer, when `resolveCategories: true`, attach `resolvedCategories` to the `_metadata` object on the response before returning. Since `_metadata` is already a plain object at this point (not a frozen/sealed type), property assignment works.

**Rationale**: This is the simplest approach that doesn't require changes to `InferredContentMetadata` or `InferredItemMetadata` for a non-GraphQL field. `resolvedCategories` is SDK-side augmentation, not a GraphQL field.

## R-007: Locale propagation for hierarchy resolution

**Decision**: The locale for the taxonomy term query is derived from:
- `getContent`: the `locale` field from the parsed `GraphReference` (from the graph URI's `loc` parameter)
- `getPreviewContent`: the `loc` field from `PreviewParams`
- `getContentByPath`: each returned item's `_metadata.locale` from the response (since the path-based operation can return items in multiple locales)

**Rationale**: Matches the content operation's locale context. For `getContentByPath`, using the response locale per-item is the only correct approach since the operation can return items in different locales.
