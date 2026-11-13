# Implementation Plan: getItems Sort Option

**Branch**: `003-getitems-sort-option` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-getitems-sort-option/spec.md`

## Summary

Add an optional `sort` parameter to the `getItems` function so developers can control the order of child pages returned. Sorting is performed server-side by adding an `orderBy` clause to the `_Page` sub-query inside `_link(type: ITEMS)` in the GraphQL query. The Graph API supports `orderBy` on content types inside `_link` (confirmed via schema introspection).

## Technical Context

**Language/Version**: TypeScript, Node.js >=22.23.4

**Primary Dependencies**: `@optimizely/cms-sdk` v3.1.0-beta.0 (this package)

**Storage**: N/A (queries Optimizely Content Graph API)

**Testing**: Vitest 5.x

**Target Platform**: Node.js / Browser (ESM + CJS dual build)

**Project Type**: Library (npm package)

**Performance Goals**: N/A — sorting is delegated to the Graph API server

**Constraints**: Must be backward compatible (no breaking changes to existing `getItems` calls)

**Scale/Scope**: Single function enhancement within the `graph` module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution defined (template only). No gates to evaluate. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/003-getitems-sort-option/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/optimizely-cms-sdk/src/graph/
├── options.ts           # GraphGetLinksOptions type + new SortOption type
├── queries.ts           # LINKS_BODY template + getItemsQuery — add orderBy clause
├── operations.ts        # getItems function — pass sort to query builder
├── index.ts             # GraphClient.getItems method — pass-through
└── __test__/
    └── graphReference.test.ts  # Existing getItems tests — add sort tests
```

**Structure Decision**: All changes are within the existing `packages/optimizely-cms-sdk/src/graph/` module. No new directories or files needed (except possibly a dedicated test file for sort).

## Complexity Tracking

No constitution violations. No complexity justifications needed.
