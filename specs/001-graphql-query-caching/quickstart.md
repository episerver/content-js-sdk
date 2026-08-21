# Quickstart Validation Guide: Enable Query Caching by Removing Complex Input Arguments

**Date**: 2026-08-20 | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js 22+
- pnpm 10.7+
- Access to an Optimizely Graph instance with stored query support
- SDK environment configured (`OPTIMIZELY_GRAPH_GATEWAY`, `OPTIMIZELY_GRAPH_SINGLE_KEY`)

## Setup

```bash
# Install dependencies
pnpm install

# Build the SDK
cd packages/optimizely-cms-sdk
pnpm build
```

## Validation Scenarios

### V1: Query Variable Types (FR-001, FR-006)

**Goal**: Verify all generated queries use scalar variables only — no `_ContentWhereInput` or `VariationInput`.

```bash
# Run existing query generation tests (should fail until implementation is complete)
cd packages/optimizely-cms-sdk
pnpm vitest run src/graph/__test__/createQuery.test.ts
```

**Expected outcome**: All generated query strings in inline snapshots use scalar variable declarations (`$key: String`, `$path: String`, `$locale: [Locales]`) instead of `$where: _ContentWhereInput` or `$variation: VariationInput`.

**Manual check**: Search for `_ContentWhereInput` and `VariationInput` in generated query output — should find zero occurrences.

### V2: Deterministic Query Strings (FR-002)

**Goal**: Verify identical requests produce identical query strings.

```bash
pnpm vitest run src/graph/__test__/createQuery.test.ts --grep "deterministic"
```

**Expected outcome**: Calling the same query generator twice with the same parameters produces byte-identical query strings. Filter fields are ordered alphabetically.

### V3: Stored Query URL Parameter (FR-004)

**Goal**: Verify `stored=true` is appended to the GraphQL endpoint URL by default.

```bash
pnpm vitest run src/graph/__test__/getClient.test.ts --grep "stored"
```

**Expected outcome**:
- Default requests include `?cache=true&stored=true` in the endpoint URL
- Requests with `{ stored: false }` option omit `stored=true`
- Preview requests include `?cache=false&stored=true`

### V4: Backward Compatibility (FR-005, SC-003)

**Goal**: Verify all existing content retrieval scenarios return correct results.

```bash
# Run full test suite
cd packages/optimizely-cms-sdk
pnpm vitest run
```

**Expected outcome**: All existing tests pass. No consumer-facing behavior changes.

### V5: Operation Name Fix (FR-013)

**Goal**: Verify `GET_ITEMS_QUERY` uses operation name `GetItems` instead of `GetPath`.

**Manual check**: In `graph/index.ts`, verify `GET_ITEMS_QUERY` contains `query GetItems(` not `query GetPath(`.

### V6: Dead Code Removal (FR-014)

**Goal**: Verify `variationFilter()` is removed from `filters.ts`.

```bash
# Should return no results
pnpm vitest run src/graph/__test__/pathFilter.test.ts
```

**Manual check**: `variationFilter` should not exist in `graph/filters.ts`.

### V7: Performance Validation (SC-004)

**Goal**: Verify at least 50% latency reduction for repeated queries.

**Steps**:
1. Configure the SDK to point at a live Graph instance
2. Issue the same content query 10 times in sequence
3. Record server-side processing time from response headers for each request
4. Compare average latency of requests 2–10 between old (complex input) and new (stored/scalar) approaches

**Expected outcome**: Average latency of requests 2–10 is at least 50% lower with the new approach.

### V8: Preview Flow (FR-012)

**Goal**: Verify preview requests use `stored=true` but `cache=false`.

```bash
pnpm vitest run src/graph/__test__/getClient.test.ts --grep "preview"
```

**Expected outcome**: Preview query requests have URL parameters `?cache=false&stored=true` and use Bearer token authentication.

## Regression Checklist

- [ ] `pnpm vitest run` — all tests pass
- [ ] `pnpm vitest --typecheck` — no type errors
- [ ] `pnpm build` — builds successfully (both CJS and ESM)
- [ ] No `_ContentWhereInput` in any generated query string
- [ ] No `VariationInput` in any generated query string
- [ ] `GET_ITEMS_QUERY` operation name is `GetItems`
- [ ] `variationFilter()` removed from `filters.ts`
- [ ] `stored=true` present in default request URLs
- [ ] `stored` option available in `GraphQueryOptions`
- [ ] Preview requests: `cache=false`, `stored=true`
- [ ] Samples (`samples/nextjs-template`) build and run correctly
