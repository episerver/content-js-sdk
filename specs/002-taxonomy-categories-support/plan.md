# Implementation Plan: CMS Taxonomy Categories Support

**Branch**: `feature/CMS-56217-Support-CMS-Taxonomy-categories` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-taxonomy-categories-support/spec.md`

## Summary

Add taxonomy category support to `@optimizely/cms-sdk` by including `categories` in the `ItemMetadata` GraphQL fragment (always-on via `TaxonomyMode` schema detection) and providing opt-in hierarchy resolution via `resolveCategories` on operation options. Follows the established `DamMode` pattern for schema detection, fragment toggling, and cache key management. Hierarchy resolution uses a batched `_TaxonomyTerm` query in the operations layer, returning `ResolvedCategory[]` with flat breadcrumb paths.

## Technical Context

**Language/Version**: TypeScript 5.8.2, ESM (`"type": "module"`)

**Primary Dependencies**: `@opentelemetry/api` (runtime), `vitest` 3.2.6 (test), `@testing-library/react` (test)

**Storage**: N/A (client-side SDK, uses Optimizely Graph API)

**Testing**: Vitest with `--typecheck`, jsdom environment, co-located `__test__/` directories

**Target Platform**: Node.js 18+, browser (via bundlers), React 19+ / Next.js 14+ (optional peer deps)

**Project Type**: Library (npm package `@optimizely/cms-sdk` in a pnpm monorepo)

**Performance Goals**: Category hierarchy resolution adds ≤1 additional network round-trip per content fetch (SC-005)

**Constraints**: No breaking changes to existing API surface (FR-007). Cache key shape change is expected on version upgrade.

**Scale/Scope**: ~12 files modified, ~2 new files, ~4 new test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not configured (template only). No gates to evaluate. Proceeding.

**Post-Phase 1 re-check**: No violations. Design follows existing patterns (`DamMode`, `fragmentContext`, `QueryContext`, `createCacheKey`).

## Project Structure

### Documentation (this feature)

```text
specs/002-taxonomy-categories-support/
├── plan.md              # This file
├── research.md          # Phase 0 output — resolved unknowns
├── data-model.md        # Phase 1 output — type/entity changes
├── quickstart.md        # Phase 1 output — validation scenarios
├── contracts/
│   └── api-contracts.md # Phase 1 output — public API changes
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (affected files)

```text
packages/optimizely-cms-sdk/src/
├── graph/
│   ├── options.ts            # MODIFY: add TaxonomyMode, taxonomy field, resolveCategories, GraphGetPreviewOptions
│   ├── queries.ts            # MODIFY: add taxonomyType probe to METADATA_QUERY_BODY
│   ├── operations.ts         # MODIFY: resolve TaxonomyMode, add hierarchy resolution logic
│   ├── index.ts              # MODIFY: export TaxonomyMode, ResolvedCategory, GraphGetPreviewOptions
│   └── __test__/
│       ├── taxonomyMode.test.ts          # NEW: tri-state TaxonomyMode behavior tests
│       ├── createQueryTaxonomy.test.ts   # NEW: categories in generated queries
│       └── resolveCategories.test.ts     # NEW: hierarchy resolution tests
├── util/
│   ├── baseTypeUtil.ts       # MODIFY: conditional categories in ItemMetadata fragment
│   ├── cache.ts              # MODIFY: add taxonomyEnabled to cache key
│   └── queryUtils.ts         # MODIFY: add taxonomyEnabled to QueryContext
├── infer.ts                  # MODIFY: add categories to InferredItemMetadata
├── infer.test-d.ts           # MODIFY: add type-level test for categories
└── index.ts                  # MODIFY: export TaxonomyMode, ResolvedCategory
```

**Structure Decision**: No new directories needed. All changes fit within the existing `graph/`, `util/`, and root `src/` structure. Test files follow the co-located `__test__/` pattern.

## Complexity Tracking

No constitution violations to justify. The implementation follows established patterns mechanically.

## Implementation Phases

### Phase A: Schema Detection & Fragment (Story 1 core)

**Files**: `options.ts`, `queries.ts`, `queryUtils.ts`, `baseTypeUtil.ts`, `cache.ts`, `operations.ts`

1. Define `TaxonomyMode` type and add `taxonomy` field to `GraphFragmentOptions` in `options.ts`
2. Add `taxonomyType` introspection probe to `METADATA_QUERY_BODY` in `queries.ts`
3. Add `taxonomyEnabled: boolean` to `QueryContext` in `queryUtils.ts` (with default `false`)
4. Update `fragmentContext()` in `options.ts` to strip `taxonomy` and include `taxonomyEnabled`
5. Resolve `TaxonomyMode` → `taxonomyEnabled` in `getContentMetaData()` in `operations.ts` (mirroring DAM logic)
6. Make `ItemMetadata` fragment conditionally include `categories` based on `taxonomyEnabled` in `baseTypeUtil.ts`
7. Add `taxonomyEnabled` to cache key in `createCacheKey()` in `cache.ts`

### Phase B: TypeScript Types (Story 3, coupled with Story 1)

**Files**: `infer.ts`, `options.ts`, `index.ts`, `graph/index.ts`

1. Add `categories: string[] | undefined` to `InferredItemMetadata` in `infer.ts`
2. Define `ResolvedCategory` type in `options.ts` (or a new `taxonomy.ts` types file)
3. Add `resolveCategories?: boolean` to `GraphGetItemOptions` and `GraphGetContentOptions`
4. Create `GraphGetPreviewOptions` extending `GraphQueryOptions` with `resolveCategories`
5. Update `getPreviewContent` signature to use `GraphGetPreviewOptions`
6. Export `TaxonomyMode`, `ResolvedCategory`, `GraphGetPreviewOptions` from `graph/index.ts` and `index.ts`

### Phase C: Hierarchy Resolution (Story 2)

**Files**: `operations.ts`

1. Implement a `resolveCategoryHierarchy()` function that takes URIs and locale, returns `ResolvedCategory[]`
2. The function issues a single batched `_TaxonomyTerm` query for all unique URIs
3. Map results to `ResolvedCategory[]` with breadcrumb `path`
4. Handle failures gracefully: term not found → `name: null`; query failure → log warning, return `undefined`
5. Wire into `getContent`, `getContentByPath`, `getPreviewContent`: after content query, if `resolveCategories: true` and `taxonomyEnabled`, call `resolveCategoryHierarchy()` and attach result to `_metadata.resolvedCategories`
6. Handle locale propagation per operation (see research R-007)

### Phase D: Tests

**Files**: `__test__/taxonomyMode.test.ts`, `__test__/createQueryTaxonomy.test.ts`, `__test__/resolveCategories.test.ts`, `infer.test-d.ts`

1. `taxonomyMode.test.ts`: Mirror `damMode.test.ts` — test `'automatic'`, `'on'`, `'off'` behavior
2. `createQueryTaxonomy.test.ts`: Verify `categories` appears in `ItemMetadata` fragment when enabled, absent when disabled
3. `resolveCategories.test.ts`: Test hierarchy resolution with mocked `_TaxonomyTerm` response — verify `ResolvedCategory[]` shape, 1:1 invariant, `name: null` for deleted terms, graceful failure
4. `infer.test-d.ts`: Add type-level assertion that `_metadata.categories` is `string[] | undefined`
5. Cache key test: Verify `taxonomyEnabled` produces different cache keys

## Key Design Decisions

| Decision | Rationale | Reference |
|----------|-----------|-----------|
| Follow `DamMode` pattern exactly | Architectural consistency, proven pattern, team familiarity | [research.md#R-002](research.md) |
| `categories` on `ItemMetadata` fragment, not `IContentMetadata` | Categories are item-specific (not media/instance) | [research.md#R-001](research.md) |
| `resolveCategories` on operations layer, not fragment options | Hierarchy resolution is a post-query step | [research.md#R-005](research.md) |
| Separate `_metadata.resolvedCategories` from `_metadata.categories` | Avoids union types, keeps API additive | [spec.md clarification Q8](spec.md) |
| `name: string | null` (not `undefined`) for unresolvable terms | Distinguishes "no value" from "field not present" | [spec.md FR-005](spec.md) |
| Batched `_TaxonomyTerm` query (not inline) | Graph API doesn't support inline parent data on categories | [research.md#R-004](research.md) |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `_TaxonomyTerm` query shape differs from expected | Medium | High | Verify against live schema before implementing Story 2. Story 1 is independent. |
| `categories` field not on `ItemMetadata` in Graph schema | Low | High | Verify via introspection. If different, adjust fragment placement. |
| Cache invalidation on upgrade causes temporary misses | Certain | Low | Expected behavior — cache key shape change is a one-time cost. Document in changelog. |
| `getPreviewContent` signature change causes type errors in consumers | Low | Medium | `GraphGetPreviewOptions` extends `GraphQueryOptions` — existing callers conform structurally. |
