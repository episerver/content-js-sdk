# Research: getItems Sort Option

## R1: Graph API `orderBy` support inside `_link`

**Decision**: Use query-level `orderBy` on `_Page` inside `_link(type: ITEMS)`.

**Rationale**: Schema introspection of the Graph API confirms that content types inside `_link` accept `orderBy` as a parameter alongside `locale`, `where`, `limit`, `skip`, `cursor`. Server-side sorting is more efficient and consistent than client-side post-sort.

**Alternatives considered**:
- Client-side post-sort after fetch — rejected because it's less efficient, doesn't compose with future `limit`/`skip` pagination, and the `sortOrder` field already comes back in the response but is never used.

## R2: `orderBy` clause format for `_metadata` fields

**Decision**: Use nested `_metadata` path in orderBy: `orderBy: { _metadata: { sortOrder: ASC } }`.

**Rationale**: The Graph API schema nests metadata fields under `_metadata` in the `orderBy` input type. This matches the structure used in top-level queries (e.g., `_Content(orderBy: { _metadata: { published: DESC } })`).

**Alternatives considered**:
- Flat field reference (`orderBy: { sortOrder: ASC }`) — not valid per the schema; metadata fields must be referenced via `_metadata`.

## R3: Null value handling in Graph API `orderBy`

**Decision**: Rely on Graph API's default null handling, with client-side fallback sort to ensure nulls-last behavior if needed.

**Rationale**: The spec requires nulls to always sort last regardless of direction. The Graph API may or may not guarantee this. If testing reveals the API already sorts nulls last, no client-side adjustment is needed. If not, a lightweight post-sort that moves null-valued items to the end preserves the server's relative ordering for non-null items.

**Alternatives considered**:
- Pure client-side sort for all cases — rejected because it defeats the purpose of query-level sorting.
- Accept whatever null ordering the API returns — rejected because the spec explicitly requires nulls-last.

## R4: Sort field validation approach

**Decision**: Validate the sort field at runtime against a static allowlist before constructing the query.

**Rationale**: The spec requires throwing a descriptive error listing valid fields when an unsupported field is provided (FR-009). A static allowlist (`sortOrder`, `displayName`, `published`) is simple and avoids sending invalid queries to the Graph API.

**Alternatives considered**:
- Pass through to Graph API and let it error — rejected because the API error message may be opaque and unhelpful.
- Type-level only validation (TypeScript union type) — not sufficient alone; runtime JS callers would bypass it.

## R5: `published` field availability in the query

**Decision**: Add `published` to the `LINKS_BODY` metadata selection if not already present.

**Rationale**: The current `LINKS_BODY` template selects `key`, `sortOrder`, `displayName`, `locale`, `types`, and `url` from `_metadata`. It does not select `published`. While `orderBy` may work without selecting the field, adding it ensures consistency and allows client-side null-handling fallback to inspect the value.

**Alternatives considered**:
- Only add `published` when sort by published is requested — adds complexity to the query builder for minimal benefit. Always selecting it is simpler and the field is lightweight.

## R6: Impact on `getPath` / `getLinksQuery`

**Decision**: `LINKS_BODY` changes (adding `published`) apply to both `getItems` and `getPath` queries since they share the template. The `orderBy` clause is only added for `getItems`.

**Rationale**: `getPath` uses its own client-side sort (reordering by the `path` array) and does not need `orderBy`. Sharing the `LINKS_BODY` template for field selection is fine; the `orderBy` parameter is injected only in `getItemsQuery`.

**Alternatives considered**:
- Separate `LINKS_BODY` templates for PATH vs ITEMS — rejected; adds duplication for no benefit since only the `_Page(...)` arguments differ.
