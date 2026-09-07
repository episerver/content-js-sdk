# Implementation Plan: Enable Query Caching by Removing Complex Input Arguments

**Branch**: `001-graphql-query-caching` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-graphql-query-caching/spec.md`

## Summary

Replace all complex GraphQL input objects (`_ContentWhereInput`, `VariationInput`) with inlined filter structures and simple scalar variables across all 5 `_Content`-based query types. Add `stored=true` URL parameter support to enable server-side query plan reuse. This makes queries deterministic and cacheable, targeting at least 50% latency reduction for repeated queries.

## Technical Context

**Language/Version**: TypeScript 5.8, targeting Node 22 (ESM + CJS dual build)

**Primary Dependencies**: `@opentelemetry/api` (runtime), `vitest` (testing), `react`/`next` (optional peer)

**Storage**: In-memory `Map<string, string>` via `withQueryCaching()` in `util/cache.ts`

**Testing**: Vitest with `toMatchInlineSnapshot()` for query string assertions

**Target Platform**: Node.js and browser (dual ESM/CJS output)

**Project Type**: Library (`@optimizely/cms-sdk` npm package in pnpm monorepo)

**Performance Goals**: At least 50% reduction in server-side query processing latency for repeated queries

**Constraints**: Fully backward-compatible public API — no breaking changes to SDK consumer code

**Scale/Scope**: 5 query types across ~6 source files, ~10 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is a template placeholder (not project-specific). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/001-graphql-query-caching/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── query-contracts.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
packages/optimizely-cms-sdk/src/
  graph/
    index.ts            # GraphClient class, static queries (GET_CONTENT_METADATA_QUERY, GET_PATH_QUERY, GET_ITEMS_QUERY)
    createQuery.ts      # generateSingleContentQuery, generateMultipleContentQuery
    filters.ts          # pathFilter(), previewFilter(), localeFilter(), referenceFilter(), variationFilter() (dead code)
    constants.ts        # Graph URL, path, defaults
    error.ts            # Error classes
    __test__/           # 10 test files
  util/
    cache.ts            # withQueryCaching() higher-order caching wrapper
    queryUtils.ts       # Fragment generation utilities
    baseTypeUtil.ts     # Base type fragment helpers
  index.ts              # Public API exports
```

**Structure Decision**: This is an existing library with established structure. All changes are modifications to existing files within `packages/optimizely-cms-sdk/src/graph/` and `packages/optimizely-cms-sdk/src/util/`. No new directories or structural changes needed.

## Complexity Tracking

No constitution violations to justify.
