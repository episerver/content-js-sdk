# Tasks: Enable Query Caching by Removing Complex Input Arguments

**Input**: Design documents from `/specs/001-graphql-query-caching/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: No project initialization needed — this is an existing library. Phase is empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bug fixes and utilities that MUST be complete before query refactoring begins.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Fix `GET_ITEMS_QUERY` operation name from `GetPath` to `GetItems` in `packages/optimizely-cms-sdk/src/graph/index.ts` (FR-013). Change the GraphQL operation name string from `query GetPath(` to `query GetItems(` in the `GET_ITEMS_QUERY` constant.
- [X] T002 [P] Remove dead `variationFilter()` function from `packages/optimizely-cms-sdk/src/graph/filters.ts` (FR-014). Delete the function definition and its export. Verify no imports reference it (there should be none).
- [X] T003 [P] Add `stored` option to query options type in `packages/optimizely-cms-sdk/src/graph/index.ts`. Add `stored?: boolean` field (default `true`) to `GraphQueryOptions` or the equivalent options interface used by `GraphClient.request()`. This enables per-request opt-out of stored queries (FR-004).
- [X] T004 Update `GraphClient.request()` URL construction in `packages/optimizely-cms-sdk/src/graph/index.ts` to append `&stored=true` when `stored` option is `true` or undefined, and omit it when explicitly `false`. Follow the existing `?cache=true/false` URL parameter pattern. Depends on T003.

**Checkpoint**: Foundation ready — operation name bug fixed, dead code removed, stored query URL parameter wired up. User story implementation can begin.

---

## Phase 3: User Story 1 — Query with Simple Scalar Variables (Priority: P1) MVP

**Goal**: Convert all 5 `_Content`-based query types to use inlined filter structures with scalar-only variables. Eliminate `_ContentWhereInput` and `VariationInput` from all generated queries.

**Independent Test**: Issue a content retrieval query and verify the generated GraphQL uses `$key: String` (or similar scalar variables) instead of `$where: _ContentWhereInput`. Verify results are identical to the previous implementation.

### Implementation for User Story 1

- [X] T005 [US1] Refactor filter functions in `packages/optimizely-cms-sdk/src/graph/filters.ts` to return scalar variable maps instead of `ContentWhereInput` objects. Create new helper functions (or modify existing `pathFilter`, `referenceFilter`, `previewFilter`) that return `{ variables: Record<string, scalar>, filterShape: string }` identifying which static query variant to use and what scalar values to bind. Preserve the existing functions temporarily for backward compatibility during migration.
- [X] T006 [US1] Convert `GET_CONTENT_METADATA_QUERY` to multiple static variants in `packages/optimizely-cms-sdk/src/graph/index.ts`. Create 4 variants: (1) by-key with `$key: String`, (2) by-path with `$path: String, $pathNoSlash: String`, (3) by-path-with-host with `$path: String, $pathNoSlash: String, $host: String`, (4) by-preview with `$key: String, $version: String, $locale: String`. Each variant inlines the filter structure and uses only scalar variables. Replace `$where: _ContentWhereInput` and `$variation: VariationInput` entirely. Depends on T005.
- [X] T007 [US1] Convert `generateSingleContentQuery` in `packages/optimizely-cms-sdk/src/graph/createQuery.ts` to produce static query variants with scalar variables. Create variants: (1) by-key with `$key: String` (no variation), (2) by-preview with `$key: String, $version: String, $locale: String` and `variation: ALL` inlined. The dynamically-generated fragment portion remains unchanged — only the query header, variable declarations, and filter arguments change. Update the `createSingleContentQuery` wrapper accordingly. Depends on T005.
- [X] T008 [US1] Convert `generateMultipleContentQuery` in `packages/optimizely-cms-sdk/src/graph/createQuery.ts` to produce static query variants with scalar variables. Create variants: (1) by-path with `$path: String, $pathNoSlash: String, $locale: [Locales]`, (2) by-path-with-host with `$path: String, $pathNoSlash: String, $host: String, $locale: [Locales]`. Inline the `_or` array of 4 URL conditions into the static query definition. Handle variation modes: omit for NONE, inline `variation: ALL` for ALL, generate per-count variants for SOME. Depends on T005.
- [X] T009 [P] [US1] Convert `GET_PATH_QUERY` to scalar variables in `packages/optimizely-cms-sdk/src/graph/index.ts`. Change from `$where: _ContentWhereInput, $locale: [Locales]` to `$key: String, $locale: [Locales]` with inlined filter `where: { _metadata: { key: { eq: $key } } }`. Keep `$locale: [Locales]` as-is (enum array, not a complex input).
- [X] T010 [P] [US1] Convert `GET_ITEMS_QUERY` to scalar variables in `packages/optimizely-cms-sdk/src/graph/index.ts`. Change from `$where: _ContentWhereInput, $locale: [Locales]` to `$key: String, $locale: [Locales]` with inlined filter. Operation name should already be `GetItems` from T001.
- [X] T011 [US1] Update all `GraphClient` methods in `packages/optimizely-cms-sdk/src/graph/index.ts` to select the appropriate query variant and pass scalar variables. Update `getContentMetaData()`, `getContent()`, `getContentByPath()`, `getPath()`, `getItems()` to: (1) determine the correct query variant based on the call context (by-key vs by-path vs by-preview, with-host vs without-host), (2) extract scalar values from the method parameters, (3) pass scalar variables to `request()` instead of `ContentInput` objects. Remove usage of `ContentWhereInput` type from method implementations. Depends on T005–T010.
- [X] T012 [US1] Handle `VariationInput` inlining in `packages/optimizely-cms-sdk/src/graph/createQuery.ts`. Implement variation mode detection: (1) `NONE` — omit `variation` from query, (2) `ALL` — inline `variation: ALL` in query string, (3) `SOME` — generate query variant with `variation: { include: SOME, value: [$v1, $v2, ...] }` using N scalar `String` variables. Each distinct count of SOME values produces a different static query shape. Update `withQueryCaching()` interaction in `packages/optimizely-cms-sdk/src/util/cache.ts` if cache key adjustments are needed. Depends on T007, T008.
- [X] T013 [US1] Ensure filter field ordering is alphabetical in all inlined filter structures across `packages/optimizely-cms-sdk/src/graph/index.ts` and `packages/optimizely-cms-sdk/src/graph/createQuery.ts` for deterministic query string output (FR-002). Verify by inspecting all static query variant strings.
- [X] T014 [US1] Update inline snapshot tests in `packages/optimizely-cms-sdk/src/graph/__test__/createQuery.test.ts`, `createQueryDAM.test.ts`, and `createQueryMedia.test.ts` to match new query shapes with scalar variables. Run `pnpm vitest run --update` to regenerate snapshots, then manually verify each snapshot shows scalar variables and inlined filters — no `_ContentWhereInput` or `VariationInput`.
- [X] T015 [US1] Update filter tests in `packages/optimizely-cms-sdk/src/graph/__test__/pathFilter.test.ts` to match new filter function return format (scalar variable maps instead of ContentWhereInput objects). Depends on T005.
- [X] T016 [US1] Remove deprecated `ContentWhereInput`, `ContentInput`, and `GraphVariationInput` types from `packages/optimizely-cms-sdk/src/graph/filters.ts` once all callers have been migrated. Remove old filter function signatures if they were kept temporarily. Clean up any unused imports across the graph/ directory.

**Checkpoint**: All 5 query types now use scalar variables. Zero occurrences of `_ContentWhereInput` or `VariationInput` in generated queries. Existing tests updated and passing.

---

## Phase 4: User Story 2 — Stored and Cached Queries (Priority: P1)

**Goal**: Enable server-side stored query reuse by appending `stored=true` to request URLs and ensuring deterministic query output.

**Independent Test**: Issue the same content query twice. Verify `stored=true` is in the request URL. Verify both requests produce byte-identical query strings.

### Implementation for User Story 2

- [X] T017 [US2] Verify deterministic query output by adding tests in `packages/optimizely-cms-sdk/src/graph/__test__/createQuery.test.ts` that call the same query generator twice with identical parameters and assert the output strings are byte-identical. Cover all 5 query types.
- [X] T018 [US2] Add tests for `stored` URL parameter in `packages/optimizely-cms-sdk/src/graph/__test__/getClient.test.ts`: (1) default requests include `stored=true` in URL, (2) requests with `{ stored: false }` omit it, (3) verify URL format is `?cache=true&stored=true`.
- [X] T019 [US2] Verify `withQueryCaching()` in `packages/optimizely-cms-sdk/src/util/cache.ts` correctly differentiates query variants. Ensure the cache key incorporates the filter shape and variation mode so different query variants (by-key vs by-path, NONE vs ALL vs SOME-N) produce different cache entries. Add tests if the existing `cache.ts` tests don't cover this.

**Checkpoint**: Stored query mechanism fully wired. Deterministic output verified. Opt-out tested.

---

## Phase 5: User Story 3 — Backward-Compatible Content Retrieval (Priority: P2)

**Goal**: Verify all existing content retrieval scenarios continue to work without regression after the query format changes.

**Independent Test**: Run the full existing test suite. All tests pass without consumer-facing behavior changes.

### Implementation for User Story 3

- [X] T020 [US3] Run full test suite with `pnpm vitest run` in `packages/optimizely-cms-sdk/` and fix any remaining test failures not addressed in Phase 3. Ensure all test files in `src/graph/__test__/` pass: `createQuery.test.ts`, `createQueryDAM.test.ts`, `createQueryMedia.test.ts`, `pathFilter.test.ts`, `getClient.test.ts`, `graphReference.test.ts`, `contract.test.ts`, `convertProperty.test.ts`, `namespace.test.ts`, `context.test.ts`.
- [X] T021 [US3] Run TypeScript type checking with `pnpm vitest --typecheck` in `packages/optimizely-cms-sdk/` and fix any type errors introduced by the refactoring.
- [X] T022 [US3] Build the SDK with `pnpm build` in `packages/optimizely-cms-sdk/` and verify both CJS and ESM outputs compile successfully with no errors.
- [X] T023 [US3] Build and verify the sample application in `samples/nextjs-template/` compiles and runs against the updated SDK. Run `pnpm build` in the sample directory.

**Checkpoint**: Full backward compatibility verified. All tests, type checks, and builds pass.

---

## Phase 6: User Story 5 — Preview Flow with Stored Queries (Priority: P2)

**Goal**: Ensure preview requests correctly use `stored=true` for query definition reuse while keeping HTTP cache disabled (`cache=false`).

**Independent Test**: Issue a preview content request and verify URL has `?cache=false&stored=true`. Verify Bearer token auth works with stored queries.

### Implementation for User Story 5

- [X] T024 [US5] Verify `getPreviewContent()` in `packages/optimizely-cms-sdk/src/graph/index.ts` passes `cache=false` and `stored=true` in the request URL. The preview flow already sets `cache=false` — confirm `stored=true` is also appended (should be automatic from T004 default behavior).
- [X] T025 [US5] Add or update preview-specific test cases in `packages/optimizely-cms-sdk/src/graph/__test__/getClient.test.ts` to verify: (1) preview URL includes `cache=false&stored=true`, (2) preview query uses Bearer token auth, (3) preview query inlines `variation: ALL`.

**Checkpoint**: Preview flow works correctly with stored queries. No stale content risk.

---

## Phase 7: User Story 4 — Improved Query Processing Performance (Priority: P2)

**Goal**: Validate at least 50% latency reduction for repeated queries using stored query mechanism.

**Independent Test**: Measure query processing latency before and after the change for 10 identical requests. Compare average of requests 2–10.

### Implementation for User Story 4

- [X] T026 [US4] Create a performance benchmark script at `packages/optimizely-cms-sdk/src/graph/__test__/benchmark.ts` that: (1) configures SDK against a live Graph instance, (2) issues the same content query 10 times, (3) records response time for each request, (4) outputs average latency for requests 2–10 and compares against a baseline. This is a manual validation tool, not an automated test.

**Checkpoint**: Performance improvement measured and documented.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final validation.

- [X] T027 [P] Update SDK documentation and code examples to reflect new query patterns — remove references to `_ContentWhereInput` and `VariationInput` as query variable types. Update any JSDoc comments in `packages/optimizely-cms-sdk/src/graph/index.ts` and `packages/optimizely-cms-sdk/src/graph/createQuery.ts`.
- [X] T028 [P] Final code cleanup: remove any temporary backward-compatibility shims added during migration, unused imports, and commented-out old code across `packages/optimizely-cms-sdk/src/graph/` and `packages/optimizely-cms-sdk/src/util/`.
- [X] T029 Run quickstart.md validation scenarios V1–V8 end-to-end and document results.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty — skip.
- **Foundational (Phase 2)**: No dependencies — start immediately. T001, T002, T003 are parallel. T004 depends on T003.
- **US1 (Phase 3)**: Depends on Phase 2 completion. This is the core work — most tasks are sequential within the phase.
- **US2 (Phase 4)**: Depends on Phase 2 (T004 for stored param) and Phase 3 (T013 for determinism). Can start T017–T18 after T004 if testing stored param independently, but full validation needs Phase 3.
- **US3 (Phase 5)**: Depends on Phase 3 and Phase 4 — runs the full regression suite.
- **US5 (Phase 6)**: Depends on Phase 2 (T004) and Phase 3 (query refactoring). Can run in parallel with US3.
- **US4 (Phase 7)**: Depends on Phase 3, 4, and 5 — needs working end-to-end implementation for meaningful benchmarking.
- **Polish (Phase 8)**: Depends on all previous phases.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. **MVP scope.**
- **US2 (P1)**: Depends on Foundational + US1 (needs deterministic queries to validate stored query behavior).
- **US3 (P2)**: Depends on US1 + US2 (regression validation of all changes).
- **US5 (P2)**: Depends on Foundational + US1. Can run in parallel with US3.
- **US4 (P2)**: Depends on US1 + US2 + US3 (needs stable implementation for benchmarking).

### Within User Story 1

```
T005 (filter refactoring)
  ├── T006 (metadata query) ──┐
  ├── T007 (single query) ────┤
  ├── T008 (multiple query) ──┤── T011 (update GraphClient methods)
  ├── T009 [P] (path query) ──┤     │
  └── T010 [P] (items query) ─┘     ├── T013 (filter ordering)
                                     ├── T014 (snapshot tests)
  T012 (variation inlining) ─────────┤
  T015 (filter tests) ───────────────┘
  T016 (type cleanup) — last, after all callers migrated
```

### Parallel Opportunities

- **Phase 2**: T001, T002, T003 can all run in parallel (different files/functions)
- **Phase 3**: T009 and T010 can run in parallel (both are static query constants in the same file but independent sections). T006, T007, T008 can potentially run in parallel after T005 (different files/functions).
- **Phase 4**: T017, T018, T019 can all run in parallel (different test files)
- **Phase 5**: T020, T021, T022 are sequential (fix → typecheck → build). T023 depends on T022.
- **Phase 6**: T024, T025 can run in parallel
- **Phase 8**: T027, T028 can run in parallel

---

## Parallel Example: User Story 1

```bash
# After T005 (filter refactoring) completes, launch query conversions in parallel:
Task: "Convert GET_CONTENT_METADATA_QUERY to static variants in graph/index.ts"
Task: "Convert generateSingleContentQuery to scalar variables in graph/createQuery.ts"
Task: "Convert generateMultipleContentQuery to scalar variables in graph/createQuery.ts"
Task: "Convert GET_PATH_QUERY to scalar variables in graph/index.ts"
Task: "Convert GET_ITEMS_QUERY to scalar variables in graph/index.ts"

# After all conversions + T011 complete, launch tests in parallel:
Task: "Update inline snapshot tests in graph/__test__/createQuery.test.ts"
Task: "Update filter tests in graph/__test__/pathFilter.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (fix op name, remove dead code, wire stored param)
2. Complete Phase 3: User Story 1 (refactor all 5 query types to scalar variables)
3. **STOP and VALIDATE**: Run test suite, verify no `_ContentWhereInput` or `VariationInput` in output
4. This alone delivers deterministic queries eligible for caching

### Incremental Delivery

1. Foundational → Foundation ready
2. US1 (scalar variables) → Core change complete, queries cacheable (MVP!)
3. US2 (stored queries) → `stored=true` wired, determinism verified
4. US3 (backward compat) → Full regression suite passing
5. US5 (preview flow) → Preview-safe stored queries confirmed
6. US4 (performance) → 50% latency reduction measured
7. Polish → Documentation updated, code cleaned

### Parallel Team Strategy

With multiple developers after Foundational phase:

- Developer A: US1 tasks T005–T012 (core query refactoring)
- Developer B: US2 tasks T017–T019 (stored query tests, can start after T004)
- After US1 merges: Developer B runs US3, Developer A handles US5
- US4 (benchmarking) last, once everything is stable

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All file paths are relative to repository root (`e:/content-js-sdk/`)
- The SDK package path prefix is `packages/optimizely-cms-sdk/src/`
- Key files: `graph/index.ts` (GraphClient + static queries), `graph/createQuery.ts` (dynamic query generators), `graph/filters.ts` (filter functions + types), `util/cache.ts` (query caching)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
