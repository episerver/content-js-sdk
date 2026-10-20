# Tasks: CMS Taxonomy Categories Support

**Input**: Design documents from `specs/002-taxonomy-categories-support/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: Included — FR-009 explicitly requires tests for query generation, TaxonomyMode detection, response typing, hierarchy resolution, and cache key.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo package**: `packages/optimizely-cms-sdk/src/` — all source code changes are in this package
- **Tests**: co-located in `__test__/` directories alongside source files

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Define the TaxonomyMode type system and schema detection infrastructure that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Define `TaxonomyMode` type (`'automatic' | 'on' | 'off'`) and add `taxonomy?: TaxonomyMode` field to `GraphFragmentOptions` in `packages/optimizely-cms-sdk/src/graph/options.ts`. Follow the `DamMode` pattern: type definition near `DamMode` (line 23), field on `GraphFragmentOptions` (alongside `dam` at line 94). Update `DEFAULT_FRAGMENT_OPTIONS` to include `taxonomy: 'automatic'`. Update `ResolvedFragmentOptions` to include `taxonomy`.
- [x] T002 [P] Add `taxonomyType` introspection probe to `METADATA_QUERY_BODY` in `packages/optimizely-cms-sdk/src/graph/queries.ts`. Add `taxonomyType: __type(name: "_TaxonomyTerm") { __typename }` after the existing `damAssetType` probe (line 37-39).
- [x] T003 [P] Add `taxonomyEnabled: boolean` field to `QueryContext` type and default it to `false` in `createQueryContext()` in `packages/optimizely-cms-sdk/src/util/queryUtils.ts`. Add the field to the `QueryContext` type (alongside `damEnabled` and `formsEnabled` around line 86-141) and include `taxonomyEnabled: options.taxonomyEnabled ?? false` in `createQueryContext` (line 173-185).
- [x] T004 Update `fragmentContext()` in `packages/optimizely-cms-sdk/src/graph/options.ts` to strip the `taxonomy` tri-state from `ResolvedFragmentOptions` and include `taxonomyEnabled: boolean` in the returned object. Follow the existing pattern at line 239-243 where `dam` is destructured out and `damEnabled` is passed in.
- [x] T005 Add `taxonomyEnabled` to the cache key array in `createCacheKey()` in `packages/optimizely-cms-sdk/src/util/cache.ts`. Position it after `formsEnabled` (around line 63-79) to maintain a consistent key shape.

**Checkpoint**: TaxonomyMode type system and infrastructure are in place. Schema detection probe is in the metadata query. Cache key includes taxonomyEnabled. User story implementation can begin.

---

## Phase 2: User Story 1 — Fetch Content with Categories (Priority: P1) 🎯 MVP

**Goal**: Content fetched via the SDK automatically includes `_metadata.categories` as a typed array of category term URIs when taxonomy is enabled.

**Independent Test**: Fetch any content item and verify `_metadata.categories` is populated with URIs (or `undefined` when taxonomy not detected). No manual query patching required.

### Implementation for User Story 1

- [x] T006 [US1] Resolve `TaxonomyMode` → `taxonomyEnabled: boolean` in `getContentMetaData()` in `packages/optimizely-cms-sdk/src/graph/operations.ts`. Add the resolution logic after the existing `damEnabled` resolution (line 233-237): read `context.fragmentDefaults.taxonomy`, resolve against `data.taxonomyType` from the schema probe, and return `taxonomyEnabled` alongside `damEnabled`/`formsEnabled`/`sectionTypes`. Update the return type to include `taxonomyEnabled`.
- [x] T007 [US1] Pass `taxonomyEnabled` through the operation functions in `packages/optimizely-cms-sdk/src/graph/operations.ts`. In `getContentByPath` (line 275), `getPreviewContent` (line 336), and `getContent` (line 412): destructure `taxonomyEnabled` from `getContentMetaData()` result, include it in the object spread passed to `fragmentContext()`, and pass it through to `createSingleContentQuery`/`createMultipleContentQuery` via the options object.
- [x] T008 [US1] Make the `ItemMetadata` fragment conditionally include `categories` based on `taxonomyEnabled` in `packages/optimizely-cms-sdk/src/util/baseTypeUtil.ts`. The current `COMMON_FRAGMENTS` array (line 131-138) has `ItemMetadata` as a static string `'fragment ItemMetadata on ItemMetadata { changeset displayOption }'`. Refactor so `getBaseTypeFragments()` accepts `taxonomyEnabled` and conditionally appends `categories` to the `ItemMetadata` fragment string. Ensure `getFixedFragments()` and any other consumers of `COMMON_FRAGMENTS` are updated accordingly.
- [x] T009 [P] [US1] Add `categories: string[] | undefined` to `InferredItemMetadata` in `packages/optimizely-cms-sdk/src/infer.ts` (line 45-48). This field is automatically flattened into `_metadata` via the existing `Partial<InferredItemMetadata>` intersection in `InferredContentMetadata` (line 62-77).

### Tests for User Story 1

- [x] T010 [US1] Create `packages/optimizely-cms-sdk/src/graph/__test__/taxonomyMode.test.ts` — test `TaxonomyMode` tri-state behavior following the pattern in `damMode.test.ts`. Test cases: (a) `'automatic'` with schema supporting taxonomy → `categories` present in generated query, (b) `'automatic'` without taxonomy in schema → `categories` absent, (c) `'on'` → always include `categories`, (d) `'off'` → never include `categories`. Mock `client.request` to return `taxonomyType: { __typename: '__Type' }` or `null`.
- [x] T011 [P] [US1] Create `packages/optimizely-cms-sdk/src/graph/__test__/createQueryTaxonomy.test.ts` — verify the generated `ItemMetadata` fragment includes `categories` when `taxonomyEnabled: true` and excludes it when `false`. Use `createSingleContentQuery` and `createMultipleContentQuery` directly with explicit `QueryContext` values.
- [x] T012 [P] [US1] Add cache key test in an existing or new test file under `packages/optimizely-cms-sdk/src/util/__test__/` — verify that `createCacheKey()` produces different keys when `taxonomyEnabled` differs (all other fields equal). Follow the pattern of existing cache tests.

**Checkpoint**: User Story 1 is complete. Content fetched via the SDK includes `_metadata.categories` when taxonomy is enabled. TaxonomyMode tri-state works correctly. All US1 tests pass. This is the MVP — can be shipped independently.

---

## Phase 3: User Story 2 — Category Hierarchy Resolution (Priority: P2)

**Goal**: Developers can opt in to hierarchy resolution via `resolveCategories: true` to get `_metadata.resolvedCategories` with breadcrumb paths — without writing a separate `_TaxonomyTerm` query.

**Independent Test**: Fetch content with `resolveCategories: true` and verify `_metadata.resolvedCategories` contains `ResolvedCategory[]` with correct `path` arrays.

**Depends on**: User Story 1 (needs `_metadata.categories` populated to resolve)

### Implementation for User Story 2

- [x] T013 [P] [US2] Define `ResolvedCategory` type in `packages/optimizely-cms-sdk/src/graph/options.ts`: `{ uri: string; name: string | null; path: Array<{ uri: string; name: string | null }> }`. Place it near the other type definitions. This type will be exported in Phase 4 (US3).
- [x] T014 [P] [US2] Add `resolveCategories?: boolean` field to `GraphGetItemOptions` and `GraphGetContentOptions` in `packages/optimizely-cms-sdk/src/graph/options.ts`. `GraphGetItemOptions` is at line 130-132, `GraphGetContentOptions` at line 122-124.
- [x] T015 [P] [US2] Create `GraphGetPreviewOptions` type in `packages/optimizely-cms-sdk/src/graph/options.ts` as `GraphQueryOptions & { resolveCategories?: boolean }`. This replaces the bare `GraphQueryOptions` on `getPreviewContent`'s signature.
- [x] T016 [US2] Update `getPreviewContent` signature in `packages/optimizely-cms-sdk/src/graph/operations.ts` (line 336) to accept `GraphGetPreviewOptions` instead of `GraphQueryOptions` as the options parameter. Import `GraphGetPreviewOptions` from `options.js`.
- [x] T017 [US2] Implement `resolveCategoryHierarchy()` function in `packages/optimizely-cms-sdk/src/graph/operations.ts`. This function: (a) accepts `context: GraphClientContext`, `categoryUris: string[]`, `locale: string | undefined`, (b) deduplicates URIs, (c) issues a single batched `_TaxonomyTerm` GraphQL query, (d) maps results to `ResolvedCategory[]` matching the 1:1 invariant with the input URIs (same order), (e) handles missing terms with `name: null` and single-element `path`, (f) handles query failure by logging a warning and returning `undefined`, (g) handles empty `categoryUris` by returning `[]` without querying.
- [x] T018 [US2] Wire `resolveCategories` into `getContent` in `packages/optimizely-cms-sdk/src/graph/operations.ts` (line 412). After the content query returns and `_metadata.categories` is populated, if `options?.resolveCategories === true` and `taxonomyEnabled`, call `resolveCategoryHierarchy()` with the categories and the locale from `ref.locale` (parsed `GraphReference`). Attach result to `_metadata.resolvedCategories` on the response object.
- [x] T019 [US2] Wire `resolveCategories` into `getContentByPath` in `packages/optimizely-cms-sdk/src/graph/operations.ts` (line 275). After the content query returns, if `options?.resolveCategories === true` and `taxonomyEnabled`, iterate over returned items, extract each item's `_metadata.categories` and `_metadata.locale`, and call `resolveCategoryHierarchy()`. Attach `resolvedCategories` to each item's `_metadata`. Use per-item locale since `getContentByPath` can return items in different locales.
- [x] T020 [US2] Wire `resolveCategories` into `getPreviewContent` in `packages/optimizely-cms-sdk/src/graph/operations.ts` (line 336). After the content query returns, if `options?.resolveCategories === true` and `taxonomyEnabled`, call `resolveCategoryHierarchy()` with the categories and the locale from `params.loc` (`PreviewParams`). Attach result to `_metadata.resolvedCategories`.

### Tests for User Story 2

- [x] T021 [US2] Create `packages/optimizely-cms-sdk/src/graph/__test__/resolveCategories.test.ts`. Test cases: (a) `resolveCategories: true` with categories assigned → `_metadata.resolvedCategories` is `ResolvedCategory[]` with correct `path` arrays, (b) `resolveCategories: false` (default) → `resolvedCategories` is `undefined`, (c) 1:1 invariant — each URI in `categories` has exactly one entry in `resolvedCategories` in the same order, (d) deleted term → entry has `name: null` with single-element `path`, (e) `_TaxonomyTerm` query failure → `resolvedCategories` is `undefined` (not thrown), warning logged, (f) no categories assigned → `resolvedCategories` is `[]`, (g) `resolveCategories: true` but taxonomy disabled → silently ignored, both `undefined`. Mock `client.request` to intercept the `_TaxonomyTerm` query and return controlled responses.

**Checkpoint**: User Story 2 is complete. Hierarchy resolution works end-to-end with opt-in. All US2 tests pass. Stories 1 and 2 together deliver the full category experience.

---

## Phase 4: User Story 3 — Typed Category Data (Priority: P1, tested separately)

**Goal**: TypeScript consumers get full autocompletion and type safety for `_metadata.categories`, `_metadata.resolvedCategories`, and `ResolvedCategory` without any casts.

**Independent Test**: In a TypeScript file, access `_metadata.categories` and `_metadata.resolvedCategories` and verify IDE autocompletion and compiler enforce correct types.

**Note**: The actual type changes are implemented in US1 (T009 — `InferredItemMetadata`) and US2 (T013 — `ResolvedCategory`). This phase covers public exports and type-level verification.

### Implementation for User Story 3

- [x] T022 [P] [US3] Export `TaxonomyMode`, `ResolvedCategory`, and `GraphGetPreviewOptions` from `packages/optimizely-cms-sdk/src/graph/index.ts`. Add to the PUBLIC TYPES section (line 27-40): `TaxonomyMode` as a `type` export, `ResolvedCategory` as a `type` export, `GraphGetPreviewOptions` as a value+type export.
- [x] T023 [P] [US3] Export `TaxonomyMode`, `ResolvedCategory`, and `GraphGetPreviewOptions` from `packages/optimizely-cms-sdk/src/index.ts`. Add to the GraphQL types section (line 28-38).

### Tests for User Story 3

- [x] T024 [US3] Add type-level test assertions in `packages/optimizely-cms-sdk/src/infer.test-d.ts`. Verify: (a) `_metadata.categories` is `string[] | undefined` (not `any`), (b) `ResolvedCategory` type is importable and has `uri: string`, `name: string | null`, `path: Array<{ uri: string; name: string | null }>`, (c) `TaxonomyMode` type is importable and is `'automatic' | 'on' | 'off'`.

**Checkpoint**: All types are exported and verified. TypeScript consumers get full autocompletion and type safety.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and regression check

- [x] T025 Run the full existing test suite (`pnpm test` in `packages/optimizely-cms-sdk/`) and verify zero regressions — all pre-existing tests pass without modification
- [x] T026 Run quickstart.md validation scenarios (Scenarios 1-10) against a taxonomy-enabled Graph instance or with appropriate mocks to confirm end-to-end behavior
- [x] T027 Verify the TypeScript build succeeds (`pnpm build` in `packages/optimizely-cms-sdk/`) with no type errors from the new exports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Foundational completion.
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (needs `_metadata.categories` populated).
- **User Story 3 (Phase 4)**: Depends on User Story 1 AND User Story 2 (verifies types from both).
- **Polish (Phase 5)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependencies on other stories. **This is the MVP.**
- **User Story 2 (P2)**: Depends on User Story 1 — requires `_metadata.categories` to be populated before hierarchy resolution can work.
- **User Story 3 (P1 coupled)**: Depends on US1 and US2 — verifies types introduced by both stories. Implementation is minimal (exports + type tests).

### Within Each Phase

- Tasks marked `[P]` can run in parallel (different files, no dependencies)
- Tasks without `[P]` must run sequentially in listed order
- Tests should run after all implementation tasks in the same phase

### Parallel Opportunities

**Phase 1 (Foundational)**: T001, T002, T003 can all run in parallel (different files: `options.ts`, `queries.ts`, `queryUtils.ts`). T004 depends on T001. T005 is independent.

**Phase 2 (US1)**: T009 can run in parallel with T006-T008. T010, T011, T012 can run in parallel after implementation tasks.

**Phase 3 (US2)**: T013, T014, T015 can run in parallel (all in `options.ts` but different sections — may need sequential if file conflicts). T018, T019, T020 are in the same file but different functions — sequential recommended.

**Phase 4 (US3)**: T022, T023 can run in parallel (different files).

---

## Parallel Example: Phase 1 (Foundational)

```
# These three tasks touch different files — run in parallel:
T001: Define TaxonomyMode in options.ts
T002: Add taxonomyType probe in queries.ts
T003: Add taxonomyEnabled to QueryContext in queryUtils.ts

# Then sequentially:
T004: Update fragmentContext() in options.ts (depends on T001)
T005: Add taxonomyEnabled to cache key in cache.ts
```

## Parallel Example: Phase 2 (User Story 1)

```
# Run in parallel (different files):
T009: Add categories to InferredItemMetadata in infer.ts
T006: Resolve TaxonomyMode in operations.ts (can start same time as T009)

# Then sequentially (same file):
T007: Pass taxonomyEnabled through operations in operations.ts (depends on T006)
T008: Conditional ItemMetadata fragment in baseTypeUtil.ts

# Tests in parallel after implementation:
T010: taxonomyMode.test.ts
T011: createQueryTaxonomy.test.ts
T012: cache key test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001-T005)
2. Complete Phase 2: User Story 1 (T006-T012)
3. **STOP and VALIDATE**: Fetch content → verify `_metadata.categories` is populated
4. Ship — developers can access raw category URIs immediately

### Incremental Delivery

1. Phase 1 (Foundational) → Infrastructure ready
2. Phase 2 (US1: Categories) → MVP! Raw category URIs available → Ship
3. Phase 3 (US2: Hierarchy) → Opt-in breadcrumb resolution → Ship
4. Phase 4 (US3: Types) → Full type exports verified → Ship
5. Phase 5 (Polish) → Full validation, regression check

### Single Developer Strategy

Execute phases sequentially: 1 → 2 → 3 → 4 → 5. Each phase builds on the previous. Total: 27 tasks.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- User Story 2 depends on User Story 1 (hierarchy needs raw categories first)
- User Story 3 is lightweight (exports + type tests) — most type work is done in US1 and US2
- The `_TaxonomyTerm` query shape in T017 must be verified against a taxonomy-enabled Graph instance — see research.md R-004
- All tasks include exact file paths relative to `packages/optimizely-cms-sdk/src/`
