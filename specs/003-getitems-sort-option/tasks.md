# Tasks: getItems Sort Option

**Input**: Design documents from `specs/003-getitems-sort-option/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sort-api.md

**Tests**: Included — spec FR-010 explicitly requires unit tests for sorting by each field in both directions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Package root**: `packages/optimizely-cms-sdk/src/graph/`
- **Tests**: `packages/optimizely-cms-sdk/src/graph/__test__/`
- **Docs**: `docs/`

---

## Phase 1: Setup

**Purpose**: No project initialization needed — this is an enhancement to an existing package.

*(No tasks — project structure already exists)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the sort-related types and extend `GraphGetLinksOptions`. These types are needed by ALL user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Add `SortField`, `SortDirection`, and `SortOption` types to `packages/optimizely-cms-sdk/src/graph/options.ts`. `SortField = 'sortOrder' | 'displayName' | 'published'`, `SortDirection = 'asc' | 'desc'`, `SortOption = { field: SortField; direction: SortDirection }`
- [x] T002 [P] Add optional `sort?: SortOption` property to `GraphGetLinksOptions` type in `packages/optimizely-cms-sdk/src/graph/options.ts`
- [x] T003 Export `SortOption`, `SortField`, `SortDirection` from `packages/optimizely-cms-sdk/src/graph/index.ts` and `packages/optimizely-cms-sdk/src/index.ts`

**Checkpoint**: New types compile and are exported. No runtime behavior changes yet.

---

## Phase 3: User Story 1 - Sort by sortOrder (Priority: P1) MVP

**Goal**: Developers can sort child pages by CMS-defined sort order via `getItems('/parent', { sort: { field: 'sortOrder', direction: 'asc' } })`.

**Independent Test**: Call `getItems` with sort option and verify GraphQL query contains `orderBy` clause and results are ordered.

### Implementation for User Story 1

- [x] T004 [US1] Add a `VALID_SORT_FIELDS` constant array and a `validateSortField` helper function in `packages/optimizely-cms-sdk/src/graph/operations.ts` that throws a descriptive error listing valid fields when an invalid field is provided (FR-009). The error message must include: "Invalid sort field '{field}'. Valid fields: sortOrder, displayName, published"
- [x] T005 [US1] Add a `buildOrderByClause` helper function in `packages/optimizely-cms-sdk/src/graph/operations.ts` that maps a `SortOption` to a GraphQL `orderBy` string fragment: `{ _metadata: { <field>: <ASC|DESC> } }`. Map `direction: 'asc'` to `ASC` and `'desc'` to `DESC`
- [x] T006 [US1] Modify `LINKS_BODY` in `packages/optimizely-cms-sdk/src/graph/queries.ts` to accept an optional `orderByClause` parameter. When provided, inject it into the `_Page(locale: $locale, orderBy: ...)` arguments. When absent, keep the current `_Page(locale: $locale)` unchanged (backward compatible)
- [x] T007 [US1] Modify `getItemsQuery` in `packages/optimizely-cms-sdk/src/graph/queries.ts` to accept an optional `orderByClause` string parameter and pass it to `LINKS_BODY`. Ensure `getLinksQuery` (used by `getPath`) is NOT modified — it must not accept orderBy
- [x] T008 [US1] Modify `getItems` function in `packages/optimizely-cms-sdk/src/graph/operations.ts` (line 1094): validate the sort field if `options.sort` is provided (call `validateSortField`), build the orderBy clause (call `buildOrderByClause`), pass it to `getItemsQuery`
- [x] T009 [US1] After fetching results in `getItems`, if sort was requested, apply a nulls-last post-sort: move items where the sort field in `_metadata` is null/undefined to the end of the array, preserving the server-returned relative order for both non-null and null groups (FR-008)
- [x] T010 [US1] Update `GraphClient.getItems()` JSDoc in `packages/optimizely-cms-sdk/src/graph/index.ts` (line 340) to document the new `sort` option with a usage example

### Tests for User Story 1

- [x] T011 [P] [US1] Add test in `packages/optimizely-cms-sdk/src/graph/__test__/graphReference.test.ts`: verify `getItems` with `sort: { field: 'sortOrder', direction: 'asc' }` generates a query containing `orderBy: { _metadata: { sortOrder: ASC } }` in the `_Page` arguments
- [x] T012 [P] [US1] Add test: verify `getItems` with `sort: { field: 'sortOrder', direction: 'desc' }` generates a query containing `orderBy: { _metadata: { sortOrder: DESC } }`
- [x] T013 [P] [US1] Add test: verify `getItems` WITHOUT sort option generates a query with NO `orderBy` clause (backward compatibility)
- [x] T014 [P] [US1] Add test: verify `getItems` with `sort: { field: 'foo' as any, direction: 'asc' }` throws an error containing "Invalid sort field" and listing valid fields
- [x] T015 [P] [US1] Add test: verify nulls-last behavior — mock response with items having null `sortOrder`, assert those items appear at the end of the returned array regardless of sort direction

**Checkpoint**: User Story 1 fully functional. Sorting by `sortOrder` works with ASC/DESC, invalid fields throw, nulls sort last, backward compatibility preserved.

---

## Phase 4: User Story 2 - Sort by displayName (Priority: P2)

**Goal**: Developers can sort child pages alphabetically by display name.

**Independent Test**: Call `getItems` with `sort: { field: 'displayName', direction: 'asc' }` and verify query and null handling.

### Implementation for User Story 2

*(No additional implementation needed — the foundational types and US1 implementation already handle `displayName` as a valid `SortField`. The query builder maps it to `{ _metadata: { displayName: ASC/DESC } }`.)*

### Tests for User Story 2

- [x] T016 [P] [US2] Add test: verify `getItems` with `sort: { field: 'displayName', direction: 'asc' }` generates a query containing `orderBy: { _metadata: { displayName: ASC } }`
- [x] T017 [P] [US2] Add test: verify nulls-last behavior for `displayName` — mock response with items having null `displayName`, assert those items appear at the end

**Checkpoint**: User Story 2 verified. displayName sorting works with proper null handling.

---

## Phase 5: User Story 3 - Sort by published date (Priority: P3)

**Goal**: Developers can sort child pages by published date (newest first for blogs/news).

**Independent Test**: Call `getItems` with `sort: { field: 'published', direction: 'desc' }` and verify query and result order.

### Implementation for User Story 3

- [x] T018 [US3] Add `published` to the `_metadata` field selection in `LINKS_BODY` template in `packages/optimizely-cms-sdk/src/graph/queries.ts` (after `displayName`, before `locale`). This ensures the field is available in the response for null-handling inspection
- [x] T019 [US3] Add `published?: string` to the `_metadata` type in `GetLinksResponse` in `packages/optimizely-cms-sdk/src/graph/queries.ts` (line 238)

### Tests for User Story 3

- [x] T020 [P] [US3] Add test: verify `getItems` with `sort: { field: 'published', direction: 'desc' }` generates a query containing `orderBy: { _metadata: { published: DESC } }`
- [x] T021 [P] [US3] Add test: verify the generated query includes `published` in the `_metadata` selection fields

**Checkpoint**: All 3 user stories functional. Sorting works for sortOrder, displayName, and published.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and final validation.

- [x] T022 [P] Update `docs/5-fetching.md` (line 327+) to document the `sort` option for `getItems` with usage examples for all three fields
- [x] T023 [P] Update `docs/12-client-utils.md` (line 63+) to add `sort` parameter to the `getItems` options documentation
- [x] T024 Run `pnpm build` to verify all type changes compile correctly across ESM and CJS builds
- [x] T025 Run full test suite (`pnpm vitest run`) to verify no regressions
- [x] T026 Run quickstart.md validation scenarios against a live Graph instance (if available)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — existing project
- **Foundational (Phase 2)**: No dependencies — types only, can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 (types must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (implementation done in US1)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (implementation done in US1)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — contains the core implementation
- **User Story 2 (P2)**: Depends on US1 implementation — only adds tests (no new code)
- **User Story 3 (P3)**: Depends on US1 implementation — adds `published` field + tests

### Within Each User Story

- Validation helper before query builder (T004 before T005)
- Query builder changes before getItems changes (T006-T007 before T008)
- getItems changes before null handling (T008 before T009)
- Implementation before tests (T004-T010 before T011-T015)

### Parallel Opportunities

- T001 and T002 can run in parallel (both in options.ts but different locations)
- T011-T015 (US1 tests) can all run in parallel
- T016-T017 (US2 tests) can run in parallel
- T020-T021 (US3 tests) can run in parallel
- T022-T023 (docs) can run in parallel
- US2 (Phase 4) and US3 (Phase 5) can run in parallel after US1 completes

---

## Parallel Example: User Story 1 Tests

```
# After US1 implementation (T004-T010), launch all US1 tests together:
T011: Test sortOrder ASC query generation
T012: Test sortOrder DESC query generation
T013: Test no-sort backward compatibility
T014: Test invalid field error
T015: Test nulls-last behavior
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003) — types
2. Complete Phase 3: User Story 1 (T004-T015) — full sort implementation + tests
3. **STOP and VALIDATE**: Sort by sortOrder works, backward compatible, invalid fields throw, nulls last
4. This is a shippable increment

### Incremental Delivery

1. Phase 2 → Types ready
2. Phase 3 (US1) → Sort by sortOrder works → **MVP shippable**
3. Phase 4 (US2) → displayName tests verified
4. Phase 5 (US3) → published field added + tests verified
5. Phase 6 → Docs updated, final validation

---

## Notes

- The core sort implementation lives entirely in US1 (Phase 3). US2 and US3 are lightweight — they add tests (and `published` field selection) on top of the same code path.
- All 3 sort fields use the same `buildOrderByClause` → `_Page(orderBy: { _metadata: { <field>: <DIR> } })` pattern. No per-field branching needed.
- `getPath` (ancestors) is intentionally NOT affected — it uses `getLinksQuery`, not `getItemsQuery`.
