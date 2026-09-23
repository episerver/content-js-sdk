# Feature Specification: CMS Taxonomy Categories Support

**Feature Branch**: `002-taxonomy-categories-support`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Support CMS Taxonomy categories in @optimizely/cms-sdk — always include _itemMetadata { categories } in generated queries, support category hierarchy resolution (resolve parent/taxonomy hierarchy without a separate _TaxonomyTerm query). The GET_CONTENT_METADATA_QUERY schema-validation failure is split to a separate bug."

## Clarifications

### Session 2026-09-23

- Q: What shape should the resolved category hierarchy take on the SDK response type? → A: Flat breadcrumb array — each category returns an ordered array of ancestors from root to leaf (e.g., `[{ uri, name }, ...]`), with the category itself having `uri`, `name`, and `path` properties.
- Q: Should category hierarchy resolution be always-on or opt-in via a query option? → A: Opt-in via a query option (e.g., `resolveCategories: true`). Raw `categories` URIs are always included; hierarchy resolution is enabled explicitly when needed.
- Q: How should the SDK handle CMS instances whose Graph schema does not include taxonomy fields? → A: Graceful omission — the SDK detects whether the Graph schema supports `_itemMetadata.categories` and silently omits the field if not supported, returning `undefined` for categories on the response.
- Q: Should resolved category hierarchy labels be localized to match the content item's locale? → A: Yes — category labels are returned in the same locale as the content item being fetched.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fetch Content with Categories (Priority: P1)

As a developer building a front end with `@optimizely/cms-sdk`, I want content fetched through the SDK to automatically include the taxonomy categories assigned to it in Optimizely SaaS CMS, so that I can render, filter, and route on categories without manually patching the generated GraphQL query.

**Why this priority**: This is the core capability — without it, SDK consumers have no access to category data at all. Every other story depends on categories being present in the query response.

**Independent Test**: Fetch any content item via `createSingleContentQuery` or `createMultipleContentQuery` and verify that the response includes `_itemMetadata.categories` as a typed array of category term URIs, with no manual query patching required.

**Acceptance Scenarios**:

1. **Given** a content item with one or more categories assigned in CMS, **When** the developer fetches that item via the SDK's standard single-content method, **Then** the response includes `_itemMetadata.categories` as a typed array of category term URI strings.
2. **Given** a content item with one or more categories assigned in CMS, **When** the developer fetches multiple items via the SDK's standard multiple-content method, **Then** each item in the response includes `_itemMetadata.categories` as a typed array of category term URI strings.
3. **Given** a content item with no categories assigned, **When** the developer fetches that item via any standard SDK method, **Then** `_itemMetadata.categories` is present as an empty array (or `null`/absent) and does not cause an error.
4. **Given** an existing SDK consumer who has not changed their code, **When** they upgrade to the new SDK version, **Then** their existing content queries continue to work without breaking changes — the additional `categories` field is additive only.

---

### User Story 2 - Category Hierarchy Resolution (Priority: P2)

As a developer, I want to opt in to resolving the parent/taxonomy hierarchy for each category term URI returned in `_itemMetadata.categories`, so that I can display breadcrumb paths, build category trees, or filter by parent categories without issuing a separate `_TaxonomyTerm` GraphQL query.

**Why this priority**: Raw category term URIs alone have limited display value. Developers need the hierarchy (parent terms, labels) to build meaningful category navigation, breadcrumbs, and filtered views. Resolving this within the SDK eliminates a common boilerplate query.

**Independent Test**: Fetch a content item with `resolveCategories: true` (or equivalent opt-in option) that has categories assigned at multiple levels of a taxonomy tree and verify that the SDK response includes resolved hierarchy information as a flat breadcrumb array for each category.

**Acceptance Scenarios**:

1. **Given** a content item assigned to a category nested 2+ levels deep, **When** the developer fetches that item with hierarchy resolution enabled, **Then** each category in the response includes a `path` array of ancestor objects ordered root-to-leaf (e.g., `[{ uri: "...", name: "Region" }, { uri: "...", name: "Europe" }, { uri: "...", name: "Nordic" }]`).
2. **Given** a content item assigned to multiple categories across different taxonomy trees, **When** the developer fetches that item with hierarchy resolution enabled, **Then** each category has its own independent `path` breadcrumb array.
3. **Given** a content item assigned to a root-level category (no parent), **When** the developer fetches that item with hierarchy resolution enabled, **Then** the `path` array contains only the root term itself.
4. **Given** a content item fetched WITHOUT hierarchy resolution enabled, **When** the developer accesses `_itemMetadata.categories`, **Then** only raw category term URIs are returned (no hierarchy data, no extra network cost).
5. **Given** hierarchy resolution is enabled, **When** the developer inspects network requests, **Then** no separate `_TaxonomyTerm` query has been issued — the hierarchy data is obtained within the existing content query or via an efficient batch mechanism handled internally by the SDK.
6. **Given** a multilingual CMS instance, **When** the developer fetches content in a specific locale with hierarchy resolution enabled, **Then** category labels in the `path` array are returned in the same locale as the content item.

---

### User Story 3 - Typed Category Data on SDK Content Types (Priority: P3)

As a developer using TypeScript, I want `_itemMetadata.categories` and its resolved hierarchy data to be properly typed in the SDK's content type definitions, so that I get autocompletion and type safety when accessing category information.

**Why this priority**: Type safety is important for developer experience but is a lower priority than the core data being available. It builds on Stories 1 and 2.

**Independent Test**: In a TypeScript project consuming the SDK, access `_itemMetadata.categories` on a fetched content item and verify that the IDE provides autocompletion and the compiler enforces the correct types without requiring any cast.

**Acceptance Scenarios**:

1. **Given** a TypeScript project using the SDK, **When** the developer accesses `_itemMetadata.categories` on a fetched content item, **Then** TypeScript autocompletion suggests `categories` and its type is an array of strings (not `any`).
2. **Given** the resolved hierarchy data from Story 2, **When** the developer accesses hierarchy properties on a category (e.g., `category.name`, `category.path[0].name`), **Then** TypeScript types are correct and no `as` cast is needed.
3. **Given** hierarchy resolution is not enabled, **When** the developer accesses `_itemMetadata.categories`, **Then** the type is `string[] | undefined` (raw URIs only).

---

### Edge Cases

- What happens when the CMS instance has no taxonomy trees configured at all? The SDK should handle this gracefully — `_itemMetadata.categories` returns an empty array or is absent, with no error.
- What happens when the CMS instance's Graph schema does not include taxonomy fields at all (e.g., taxonomy feature not enabled)? The SDK detects this and gracefully omits the `_itemMetadata { categories }` selection — categories is `undefined` on the response, no query error occurs.
- What happens when a category term URI in the response points to a taxonomy term that has been deleted or moved? The SDK should return what the Graph API provides without crashing. If hierarchy resolution fails for a specific term, that term's hierarchy should be `null` or partial rather than causing the entire fetch to fail.
- What happens with very deep taxonomy hierarchies (10+ levels)? The SDK should handle arbitrary depth without recursion limits or performance degradation in reasonable taxonomy structures.
- What happens when content has a large number of categories assigned (e.g., 50+)? The SDK should not introduce N+1 query problems — hierarchy resolution should be batched or embedded in the content query.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SDK MUST include `_itemMetadata { categories }` in the selection set of every GraphQL query generated by `createSingleContentQuery` and `createMultipleContentQuery` — always-on, not gated behind an option.
- **FR-002**: The `categories` field MUST be typed as an optional array of category term URI strings on the SDK's content type definitions (e.g., `string[] | undefined`) when hierarchy resolution is not enabled.
- **FR-003**: Content with no categories assigned MUST return an empty array or `undefined`/`null` for `_itemMetadata.categories` — it MUST NOT cause a runtime error or schema validation failure.
- **FR-004**: The SDK MUST provide an opt-in query option (e.g., `resolveCategories: true`) that resolves the parent/taxonomy hierarchy for each category term URI without requiring the developer to issue a separate `_TaxonomyTerm` query. When not enabled, only raw category URIs are returned.
- **FR-005**: When hierarchy resolution is enabled, each category MUST be returned as a flat breadcrumb structure containing `uri`, `name`, and `path` (an ordered array of ancestor objects from root to leaf, each with `uri` and `name`).
- **FR-006**: Hierarchy resolution MUST NOT introduce N+1 query problems — it MUST use batching or embed the hierarchy data within the content query where the Graph API supports it.
- **FR-007**: Existing SDK consumers MUST NOT experience breaking changes — the addition of `_itemMetadata { categories }` and hierarchy data is purely additive to the current query selections and response types.
- **FR-008**: The SDK MUST expose the resolved category hierarchy data on the returned content type in a structured, typed format accessible without casting.
- **FR-009**: Tests MUST cover query generation (verifying `_itemMetadata { categories }` is present in emitted queries) and response processing (verifying typed category data in results).
- **FR-010**: The SDK MUST detect whether the Graph schema supports `_itemMetadata.categories` and gracefully omit the field from the query if not supported — no query error should occur on CMS instances without taxonomy.
- **FR-011**: When hierarchy resolution is enabled, resolved category labels MUST be returned in the same locale as the content item being fetched.

### Key Entities

- **Category Term URI**: A string identifier assigned to content in CMS that references a taxonomy term. Returned as part of `_itemMetadata.categories`.
- **Resolved Category**: When hierarchy resolution is enabled, a category is represented as an object with `uri` (the term URI), `name` (localized display label), and `path` (flat breadcrumb array of ancestor objects from root to the term itself, each with `uri` and `name`).
- **Taxonomy Hierarchy**: The parent-child chain from a category term up to the taxonomy root, represented as a flat ordered array (breadcrumb). Labels are localized to the content item's locale.
- **Content Item Metadata**: The `_itemMetadata` system field on content items, extended with `categories` in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of content fetched through the SDK's standard methods includes category data when categories are assigned in CMS — no manual query patching needed.
- **SC-002**: Developers can access category hierarchy (parent chain, labels) directly from the SDK response without writing any additional GraphQL queries.
- **SC-003**: Existing SDK consumers upgrading to the new version experience zero breaking changes — all current queries and response handling continue to work unchanged.
- **SC-004**: TypeScript consumers get full autocompletion and type checking for category and hierarchy data without requiring type casts.
- **SC-005**: Category hierarchy resolution adds no more than one additional network round-trip compared to a content fetch without categories (ideally zero — embedded in the same query).

## Assumptions

- The Optimizely Graph API already exposes `_itemMetadata { categories }` on the `_IContent` interface or individual content types — the SDK just needs to select it.
- The Graph API provides a mechanism to resolve taxonomy hierarchy (parent terms, labels) either inline within the content query or via a batch-friendly query — not requiring per-term individual queries.
- Taxonomy/category support (part 1 of Taxonomy in Optimizely Graph) is already shipped on the CMS side and available in the Graph schema — but some instances may not have it enabled, so the SDK must handle graceful omission.
- The `GET_CONTENT_METADATA_QUERY` schema-validation failure is a separate bug that will be tracked and fixed independently — it is explicitly out of scope for this feature.
- Category term URIs are stable string identifiers that do not change once assigned (though the term itself may be renamed or moved in the taxonomy tree).
- The current SDK query caching mechanism (`withQueryCaching`) will accommodate the new always-on fields without requiring cache invalidation changes, since the selection set change is unconditional.
- Taxonomy terms are localizable in CMS, and the Graph API returns localized labels when queried with a locale parameter.
