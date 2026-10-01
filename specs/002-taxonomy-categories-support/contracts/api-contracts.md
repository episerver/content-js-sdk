# API Contracts: CMS Taxonomy Categories Support

**Date**: 2026-09-24 | **Spec**: [spec.md](../spec.md) | **Data Model**: [data-model.md](../data-model.md)

## Public API Additions

### Exported Types

#### `TaxonomyMode` (from `@optimizely/cms-sdk`)

```typescript
export type TaxonomyMode = 'automatic' | 'on' | 'off';
```

#### `ResolvedCategory` (from `@optimizely/cms-sdk`)

```typescript
export type ResolvedCategory = {
  uri: string;
  name: string | null;
  path: Array<{ uri: string; name: string | null }>;
};
```

### Modified Options

#### `GraphFragmentOptions` — added `taxonomy` field

```typescript
export type GraphFragmentOptions = {
  // ... existing fields ...
  taxonomy?: TaxonomyMode;  // default: 'automatic'
};
```

#### `GraphGetItemOptions` — added `resolveCategories` field

```typescript
export type GraphGetItemOptions = GraphQueryOptions & {
  previewToken?: string;
  resolveCategories?: boolean;  // default: false
};
```

#### `GraphGetContentOptions` — added `resolveCategories` field

```typescript
export type GraphGetContentOptions = GraphQueryOptions & {
  variation?: GraphVariationInput;
  resolveCategories?: boolean;  // default: false
};
```

#### `GraphGetPreviewOptions` — new type

```typescript
export type GraphGetPreviewOptions = GraphQueryOptions & {
  resolveCategories?: boolean;  // default: false
};
```

Replaces bare `GraphQueryOptions` on `getPreviewContent` signature.

### Modified Type Inference

#### `InferredItemMetadata` — added `categories`

```typescript
type InferredItemMetadata = {
  changeset: string | null;
  displayOption: string | null;
  categories: string[] | undefined;  // NEW
};
```

Flattened into `_metadata` via `Partial<InferredItemMetadata>`, making `categories` optional on the response type.

### Client Configuration

#### `GraphOptions.fragment.taxonomy`

```typescript
const client = new GraphClient('api-key', {
  fragment: {
    taxonomy: 'automatic',  // default — probes schema
  },
});
```

### Operation Signatures

#### `getContent` — unchanged signature, new option field

```typescript
client.getContent(reference, {
  resolveCategories: true,  // opt-in
});
```

#### `getContentByPath` — unchanged signature, new option field

```typescript
client.getContentByPath(path, {
  resolveCategories: true,
});
```

#### `getPreviewContent` — options type changes from `GraphQueryOptions` to `GraphGetPreviewOptions`

```typescript
client.getPreviewContent(params, {
  resolveCategories: true,
});
```

## GraphQL Contract Changes

### Metadata Query — added taxonomy probe

```graphql
query GetContentMetadata($key: String!, $version: String, $metadataLocale: Locales) {
  _Content(where: { _metadata: { key: { eq: $key }, version: { eq: $version }, locale: { eq: $metadataLocale } } }) {
    item {
      _metadata {
        types
        variation
      }
    }
  }
  damAssetType: __type(name: "cmp_Asset") {
    __typename
  }
  taxonomyType: __type(name: "_TaxonomyTerm") {
    __typename
  }
}
```

### ItemMetadata Fragment — conditional `categories`

When `taxonomyEnabled: true`:
```graphql
fragment ItemMetadata on ItemMetadata { changeset displayOption categories }
```

When `taxonomyEnabled: false`:
```graphql
fragment ItemMetadata on ItemMetadata { changeset displayOption }
```

### Taxonomy Term Resolution Query (batched)

When `resolveCategories: true`, issued after the content query:
```graphql
query ResolveTaxonomyTerms($uris: [String!]!) {
  _TaxonomyTerm(where: { uri: { in: $uris } }) {
    items {
      uri
      name
      path {
        uri
        name
      }
    }
  }
}
```

**Note**: The exact query shape depends on the `_TaxonomyTerm` schema. The query above is illustrative. The locale parameter and parent/path fields must be verified against a taxonomy-enabled instance.

## Backward Compatibility

| Change | Breaking? | Notes |
|--------|-----------|-------|
| `categories` added to `ItemMetadata` fragment | No | Additive field in GraphQL selection |
| `TaxonomyMode` type exported | No | New export |
| `ResolvedCategory` type exported | No | New export |
| `taxonomy` field on `GraphFragmentOptions` | No | Optional with default `'automatic'` |
| `resolveCategories` on operation options | No | Optional, defaults to `false` |
| `GraphGetPreviewOptions` replacing `GraphQueryOptions` | No | Extends `GraphQueryOptions` — existing callers passing `GraphQueryOptions` still conform |
| `categories` on `InferredItemMetadata` | No | Optional (`string[] | undefined`) via `Partial<>` |
| `taxonomyEnabled` in cache key | No | Existing cache entries are invalidated (different key shape) — this is expected on SDK version upgrade |
| `taxonomyType` probe in metadata query | No | Additive field in existing query |
