# Quickstart Validation: getItems Sort Option

## Prerequisites

- Node.js >=22.23.4
- pnpm installed
- Optimizely CMS SaaS instance with Graph API access
- A parent page with multiple child pages having different `sortOrder`, `displayName`, and `published` values

## Build

```bash
cd packages/optimizely-cms-sdk
pnpm install
pnpm build
```

## Run Tests

```bash
pnpm vitest run src/graph/__test__/graphReference.test.ts
```

## Validation Scenarios

### 1. Sort by sortOrder (P1)

```typescript
import { GraphClient } from '@optimizely/cms-sdk';

const client = new GraphClient('your-single-key');

// ASC
const itemsAsc = await client.getItems('/parent', {
  sort: { field: 'sortOrder', direction: 'asc' },
});
// Expected: items ordered by sortOrder ascending

// DESC
const itemsDesc = await client.getItems('/parent', {
  sort: { field: 'sortOrder', direction: 'desc' },
});
// Expected: items ordered by sortOrder descending
```

**Verify**: Each item's `_metadata.sortOrder` is in the expected order.

### 2. Sort by displayName (P2)

```typescript
const items = await client.getItems('/parent', {
  sort: { field: 'displayName', direction: 'asc' },
});
// Expected: items ordered alphabetically by displayName
```

**Verify**: Each item's `_metadata.displayName` is in alphabetical order.

### 3. Sort by published (P3)

```typescript
const items = await client.getItems('/parent', {
  sort: { field: 'published', direction: 'desc' },
});
// Expected: items ordered by published date, newest first
```

**Verify**: Each item's `_metadata.published` is in descending chronological order.

### 4. No sort option (backward compatibility)

```typescript
const items = await client.getItems('/parent');
// Expected: same order as before — no breaking change
```

**Verify**: Generated GraphQL query has no `orderBy` clause.

### 5. Invalid sort field (error case)

```typescript
try {
  await client.getItems('/parent', {
    sort: { field: 'foo' as any, direction: 'asc' },
  });
} catch (e) {
  // Expected: error message listing valid fields
}
```

**Verify**: Error message includes "sortOrder", "displayName", "published".

### 6. Null values sort last

```typescript
const items = await client.getItems('/parent', {
  sort: { field: 'sortOrder', direction: 'asc' },
});
// Expected: items with null sortOrder appear at the end
```

**Verify**: All items with `_metadata.sortOrder === null` are after all items with numeric sortOrder values.

## Expected Outcomes

- All 6 validation scenarios pass
- Existing tests in `graphReference.test.ts` continue to pass (no regressions)
- Generated GraphQL query includes `orderBy` only when `sort` option is provided
- `published` field is present in metadata selection for all `_link` queries
