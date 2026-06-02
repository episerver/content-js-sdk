# Property Types Reference

This reference provides comprehensive details on all available property types for Optimizely CMS content type modeling.

## Available Property Types

The following property types are supported when defining content type properties:

- **`'string'`** - Simple text field
- **`'richText'`** - Formatted content using Slate.js format (for rich text editing with formatting, links, etc.)
- **`'boolean'`** - True/false checkbox field
- **`'integer'`** - Whole numbers only
- **`'float'`** - Decimal numbers
- **`'dateTime'`** - Date and time picker (supports `minimum` and `maximum` constraints)
- **`'url'`** - Simple URL string field
- **`'link'`** - Link with metadata (includes text, title, target properties)
- **`'binary'`** - Binary data field
- **`'json'`** - JSON data field (for structured data)
- **`'content'`** - Reference to other content items
- **`'contentReference'`** - Content reference with constraints (use with `allowedTypes` to restrict which content types can be referenced)
- **`'array'`** - Lists of items (use with `items` field to define what the array contains, supports `minItems` and `maxItems` constraints)
- **`'component'`** - Embedded component (requires `contentType` field to specify which component type)

## Type-Specific Constraints

### DateTime Type

When using `'dateTime'` type, you can specify date range constraints:

```typescript
publishDate: {
  type: 'dateTime',
  minimum: '2024-01-01T00:00:00Z',  // Earliest allowed date
  maximum: '2025-12-31T23:59:59Z'   // Latest allowed date
}
```

### Array Type

Arrays require an `items` field to define what the array contains:

```typescript
tags: {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,      // Optional: minimum number of items
  maxItems: 10      // Optional: maximum number of items
}
```

**Important**: Arrays cannot contain other arrays (nested arrays are not supported).

### Content Reference Type

Use `contentReference` with `allowedTypes` to restrict which content types can be referenced:

```typescript
featuredImage: {
  type: 'contentReference',
  allowedTypes: ['_image']  // Only allow image content
}
```

### Component Type

Embedded components require a `contentType` field:

```typescript
ctaButton: {
  type: 'component',
  contentType: ButtonComponentType  // Reference to component type
}
```

## Common Property Patterns

### Required Fields

Mark properties as required using the `required` field:

```typescript
title: {
  type: 'string',
  required: true
}
```

### Display Names and Groups

Organize properties with display names and groups:

```typescript
metaTitle: {
  type: 'string',
  displayName: 'Meta Title',
  group: 'seo',
  maxLength: 60
}
```

### String Constraints

Limit string length with `minLength` and `maxLength`:

```typescript
title: {
  type: 'string',
  minLength: 5,
  maxLength: 100
}
```
