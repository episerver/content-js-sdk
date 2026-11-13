# Feature Specification: getItems Sort Option

**Feature Branch**: `feature/003-getitems-sort-option`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Add a sort option to getItems so developers can control the order of child pages returned. The Graph API supports orderBy on content types inside _link, so sorting should be done at the GraphQL query level."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sort child pages by sort order (Priority: P1)

As a developer building a website with the Content JS SDK, I want to fetch child pages sorted by their CMS-defined sort order so that navigation menus and page listings match the content editor's intended arrangement.

**Why this priority**: Sort order is the most common sorting need — it reflects the explicit ordering set by content editors in the CMS. Without this, developers must manually sort results after every fetch.

**Independent Test**: Can be fully tested by calling `getItems('/parent', { sort: { field: 'sortOrder', direction: 'asc' } })` and verifying the returned items are ordered by their `sortOrder` metadata value.

**Acceptance Scenarios**:

1. **Given** a parent page with 5 child pages having sortOrder values 3, 1, 5, 2, 4, **When** `getItems` is called with `sort: { field: 'sortOrder', direction: 'asc' }`, **Then** items are returned in order 1, 2, 3, 4, 5
2. **Given** the same parent page, **When** `getItems` is called with `sort: { field: 'sortOrder', direction: 'desc' }`, **Then** items are returned in order 5, 4, 3, 2, 1
3. **Given** a parent page with child pages, **When** `getItems` is called without any sort option, **Then** items are returned in the same order as before this feature (no breaking change)

---

### User Story 2 - Sort child pages by display name (Priority: P2)

As a developer, I want to fetch child pages sorted alphabetically by display name so that I can build alphabetical listings without post-processing.

**Why this priority**: Alphabetical sorting is a common UI pattern for content listings, sitemaps, and search results.

**Independent Test**: Can be tested by calling `getItems` with `sort: { field: 'displayName', direction: 'asc' }` and verifying alphabetical order.

**Acceptance Scenarios**:

1. **Given** a parent page with child pages named "Zebra", "Apple", "Mango", **When** `getItems` is called with `sort: { field: 'displayName', direction: 'asc' }`, **Then** items are returned as "Apple", "Mango", "Zebra"

---

### User Story 3 - Sort child pages by published date (Priority: P3)

As a developer building a blog or news section, I want to fetch child pages sorted by published date so that I can display the most recent content first.

**Why this priority**: Published-date sorting is essential for time-based content like blogs and news, but is lower priority because it may already approximate the default Graph API order.

**Independent Test**: Can be tested by calling `getItems` with `sort: { field: 'published', direction: 'desc' }` and verifying newest-first order.

**Acceptance Scenarios**:

1. **Given** a parent page with child pages published on different dates, **When** `getItems` is called with `sort: { field: 'published', direction: 'desc' }`, **Then** items are returned with the most recently published first

---

### Edge Cases

- When a sort field has null/undefined values for some child pages, those items sort to the end of the results regardless of sort direction (nulls last)
- When an invalid or unsupported sort field is specified, the SDK throws a descriptive error listing the valid fields
- When there are no child pages (empty result set) and sort is specified, an empty array is returned (sort is a no-op)
- When multiple child pages have the same sort value, their relative order is determined by the Graph API (no additional tie-breaking guaranteed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `getItems` function MUST accept an optional `sort` parameter in its options
- **FR-002**: The `sort` parameter MUST support a `field` property specifying which metadata field to sort by
- **FR-003**: The `sort` parameter MUST support a `direction` property with values `'asc'` or `'desc'`
- **FR-004**: Supported sort fields MUST include at minimum: `sortOrder`, `displayName`, and `published`
- **FR-005**: When `sort` is provided, the SDK MUST include an `orderBy` clause in the GraphQL query sent to the Graph API
- **FR-006**: When `sort` is not provided, the behavior MUST remain identical to the current implementation (backward compatible)
- **FR-007**: The `GraphClient.getItems()` method MUST pass the sort option through to the underlying function
- **FR-008**: The SDK MUST handle the case where the sort field value is null for some items without errors — items with null values MUST appear at the end of the sorted results regardless of sort direction
- **FR-009**: The SDK MUST throw a descriptive error listing valid sort fields when an unsupported sort field is provided
- **FR-010**: Unit tests MUST cover sorting by each supported field (`sortOrder`, `displayName`, `published`) in both directions (`asc` and `desc`)

### Key Entities

- **SortOption**: Represents a sorting preference with a field name and direction
- **SortField**: An enumeration of supported metadata fields that can be sorted on (`sortOrder`, `displayName`, `published`)
- **SortDirection**: Either ascending (`asc`) or descending (`desc`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can sort child pages by any supported field with a single option parameter, requiring zero post-processing
- **SC-002**: All existing `getItems` calls continue to work without modification after the feature is added
- **SC-003**: Sorting is performed server-side via the Graph API, not client-side, ensuring consistent results regardless of page count
- **SC-004**: SDK documentation is updated with sort option usage examples for all supported fields — specifically `docs/5-fetching.md` and `docs/12-client-utils.md`

## Clarifications

### Session 2026-11-02

- Q: When a sort field has null/undefined values for some child pages, should those items appear at the beginning or end of the sorted results? → A: Nulls always sort last, regardless of sort direction.
- Q: When a developer passes an unsupported sort field, what should the SDK do? → A: Throw a descriptive error listing valid fields.

## Assumptions

- The Graph API's `orderBy` parameter on content types inside `_link` works consistently across all CMS SaaS environments (confirmed via schema introspection — `_link` supports `orderBy`, `limit`, `skip`, `cursor`)
- Currently the query only passes `locale` to `_Page` inside `_link`; the `orderBy` clause will need to be added alongside it
- The `published` field may need to be added to the GraphQL query's selected metadata fields if not already fetched
- Only single-field sorting is needed for v1; multi-field sorting (e.g., sort by sortOrder then displayName) is out of scope
- The sort option applies only to `getItems` (child pages); `getPath` (ancestors) retains its current top-to-bottom ordering
