# Contract: getItems Sort API

## Public API Surface

### Types (exported from `@optimizely/cms-sdk`)

```typescript
type SortField = 'sortOrder' | 'displayName' | 'published';
type SortDirection = 'asc' | 'desc';

type SortOption = {
  field: SortField;
  direction: SortDirection;
};

type GraphGetLinksOptions = GraphQueryOptions & {
  locales?: string[];
  sort?: SortOption;  // NEW
};
```

### Method Signature (unchanged shape, new option)

```typescript
class GraphClient {
  async getItems(
    reference: string | GraphReference,
    options?: GraphGetLinksOptions,
  ): Promise<Array<{ _metadata?: { ... } }> | null>;
}
```

### Standalone Function

```typescript
async function getItems(
  context: GraphClientContext,
  reference: string | GraphReference,
  options?: GraphGetLinksOptions,
): Promise<Array<{ _metadata?: { ... } }> | null>;
```

## Behavior Contract

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| No sort option | `getItems('/blog')` | Items in Graph API default order (unchanged) |
| Sort by sortOrder ASC | `getItems('/blog', { sort: { field: 'sortOrder', direction: 'asc' } })` | Items ordered by sortOrder ascending |
| Sort by displayName DESC | `getItems('/blog', { sort: { field: 'displayName', direction: 'desc' } })` | Items ordered by displayName descending |
| Sort by published DESC | `getItems('/blog', { sort: { field: 'published', direction: 'desc' } })` | Items ordered by published date descending |
| Invalid sort field | `getItems('/blog', { sort: { field: 'foo', direction: 'asc' } })` | Throws error: "Invalid sort field 'foo'. Valid fields: sortOrder, displayName, published" |
| Null values in sort field | Sort with items having null sortOrder | Null items appear at end regardless of direction |
| Empty children | Parent with no children + sort | Returns empty array |
| Null parent | Non-existent parent + sort | Returns null |

## GraphQL Query Contract

When `sort` is provided, the generated query includes `orderBy` on `_Page`:

```graphql
query GetItems($key: String!, $locale: [Locales]) {
  _Content(where: { _metadata: { key: { eq: $key } } }, locale: $locale) {
    item {
      _id
      _metadata { ...on InstanceMetadata { path } }
      _link(type: ITEMS) {
        _Page(locale: $locale, orderBy: { _metadata: { sortOrder: ASC } }) {
          items {
            _metadata {
              key sortOrder displayName published locale types
              url { base hierarchical default }
            }
          }
        }
      }
    }
  }
}
```

When `sort` is not provided, the query remains unchanged (no `orderBy` clause).
