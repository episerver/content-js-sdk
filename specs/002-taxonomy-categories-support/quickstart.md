# Quickstart Validation: CMS Taxonomy Categories Support

**Date**: 2026-09-24 | **Spec**: [spec.md](spec.md) | **Contracts**: [contracts/api-contracts.md](contracts/api-contracts.md)

## Prerequisites

- Node.js 18+, pnpm 10.7+
- Access to an Optimizely Graph instance with taxonomy enabled
- At least one content item with categories assigned in CMS
- At least one content item with no categories assigned

## Build & Test

```bash
# Install dependencies
pnpm install

# Run all tests (includes type checking)
cd packages/optimizely-cms-sdk
pnpm test

# Run only taxonomy-related tests
pnpm vitest run --reporter verbose src/graph/__test__/taxonomyMode.test.ts
pnpm vitest run --reporter verbose src/graph/__test__/createQueryTaxonomy.test.ts
```

## Validation Scenarios

### Scenario 1: TaxonomyMode automatic detection (Story 1, FR-001, FR-010)

**Goal**: Verify the SDK detects taxonomy support from the Graph schema and includes `categories` in the `ItemMetadata` fragment.

**Steps**:
1. Create a `GraphClient` with default options (no explicit `taxonomy` setting)
2. Call `client.getContent(reference)` for a content item with categories assigned
3. Inspect the generated metadata query — it should include `taxonomyType: __type(name: "_TaxonomyTerm") { __typename }`
4. Inspect the generated content query — the `ItemMetadata` fragment should include `categories`
5. Verify `result._metadata.categories` is `string[]` containing the assigned category URIs

**Expected**: `_metadata.categories` is populated with an array of URI strings.

### Scenario 2: TaxonomyMode forced off (FR-001, FR-010)

**Goal**: Verify `taxonomy: 'off'` suppresses the `categories` field.

**Steps**:
1. Create a `GraphClient` with `fragment: { taxonomy: 'off' }`
2. Call `client.getContent(reference)`
3. Inspect the content query — `ItemMetadata` fragment should NOT include `categories`
4. Verify `result._metadata.categories` is `undefined`

**Expected**: No `categories` in the query or response.

### Scenario 3: Content with no categories (FR-003)

**Goal**: Verify empty categories return an empty array, not an error.

**Steps**:
1. Fetch a content item that has no categories assigned in CMS
2. Verify `result._metadata.categories` is `[]` (empty array)
3. Verify no runtime error or schema validation failure

**Expected**: `_metadata.categories` is `[]`.

### Scenario 4: Hierarchy resolution opt-in (Story 2, FR-004, FR-005)

**Goal**: Verify `resolveCategories: true` populates `_metadata.resolvedCategories`.

**Steps**:
1. Call `client.getContent(reference, { resolveCategories: true })` for a content item with categories at multiple hierarchy levels
2. Verify `result._metadata.resolvedCategories` is an array of `ResolvedCategory` objects
3. Verify each object has `uri`, `name`, and `path`
4. Verify `path` is ordered root-to-leaf with the term itself as the last element
5. Verify `path[path.length - 1].uri === uri` for each resolved category

**Expected**: Full breadcrumb hierarchy for each category.

### Scenario 5: Hierarchy resolution disabled (FR-004)

**Goal**: Verify default behavior does not resolve hierarchy.

**Steps**:
1. Call `client.getContent(reference)` without `resolveCategories`
2. Verify `result._metadata.categories` contains raw URI strings
3. Verify `result._metadata.resolvedCategories` is `undefined`
4. Verify no extra network request for taxonomy terms

**Expected**: Only raw URIs, no hierarchy data.

### Scenario 6: TypeScript type checking (Story 3, FR-002, FR-008)

**Goal**: Verify TypeScript types are correct without casts.

**Steps**:
1. In a TypeScript file, fetch content and access `result._metadata.categories`
2. Verify IDE autocompletion suggests `categories`
3. Verify the type is `string[] | undefined`
4. With `resolveCategories: true`, access `result._metadata.resolvedCategories`
5. Verify the type is `ResolvedCategory[] | undefined`
6. Access `result._metadata.resolvedCategories?.[0].path[0].name`
7. Verify no `as` cast is needed anywhere

**Expected**: Full type safety and autocompletion.

### Scenario 7: Backward compatibility (FR-007)

**Goal**: Verify existing consumers are not broken.

**Steps**:
1. Run the full existing test suite: `pnpm test`
2. Verify all existing tests pass without modification
3. Verify that existing code accessing `_metadata.changeset` or `_metadata.displayOption` still works

**Expected**: Zero test failures, zero breaking changes.

### Scenario 8: Cache key correctness (FR-012)

**Goal**: Verify `taxonomyEnabled` is included in the cache key.

**Steps**:
1. Generate a query with `taxonomy: 'on'` and capture the cache key
2. Generate a query with `taxonomy: 'off'` for the same content type and capture the cache key
3. Verify the two cache keys differ

**Expected**: Different cache keys for different taxonomy settings.

### Scenario 9: Graceful degradation — no taxonomy in schema (FR-010, Edge Case)

**Goal**: Verify the SDK handles instances without taxonomy support.

**Steps**:
1. Mock the Graph schema probe to return `taxonomyType: null`
2. With default `taxonomy: 'automatic'`, fetch content
3. Verify `_metadata.categories` is `undefined` (field not selected)
4. Verify no query error occurs

**Expected**: Silent omission, `undefined` categories.

### Scenario 10: resolveCategories with taxonomy unavailable (FR-004, Edge Case)

**Goal**: Verify `resolveCategories: true` is silently ignored when taxonomy is not detected.

**Steps**:
1. Mock schema probe to return no taxonomy
2. Call `client.getContent(reference, { resolveCategories: true })`
3. Verify `_metadata.categories` is `undefined`
4. Verify `_metadata.resolvedCategories` is `undefined`
5. Verify no error thrown

**Expected**: Silently ignored, both fields `undefined`.
