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
  allowedTypes: ['_image']  // Base types like '_image' can be strings
}

// For custom content types, use type object references:
relatedArticle: {
  type: 'contentReference',
  allowedTypes: [ArticleContentType]  // Reference to type object, NOT string
}
```

**IMPORTANT**: When referencing custom content types in `allowedTypes` or `restrictedTypes`, use the type object (e.g., `ArticleContentType`), NOT a string (e.g., `'ArticleContentType'`). Base types like `'_image'`, `'_page'`, etc. can remain as strings.

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

### Dropdown Properties (Select One)

**CRITICAL**: Dropdown/select properties require both `format: 'selectOne'` AND an `enum` array defining the available options.

For single-selection dropdowns:

```typescript
color: {
  type: 'string',
  format: 'selectOne',
  enum: [
    {
      value: 'Red',
      displayName: 'Red'
    },
    {
      value: 'Green',
      displayName: 'Green'
    },
    {
      value: 'Blue',
      displayName: 'Blue'
    }
  ],
  displayName: 'Color'
}
```

**Common mistake to avoid:**

```typescript
// ❌ WRONG: Missing format field
color: {
  type: 'string',
  displayName: 'Color'
}

// ❌ WRONG: Missing enum array
color: {
  type: 'string',
  format: 'selectOne',
  displayName: 'Color'
}

// ✅ CORRECT: Both format and enum
color: {
  type: 'string',
  format: 'selectOne',
  enum: [
    { value: 'Red', displayName: 'Red' },
    { value: 'Green', displayName: 'Green' }
  ],
  displayName: 'Color'
}
```

### Select List Properties (Select Many)

**CRITICAL**: Multi-selection lists require `type: 'array'`, `format: 'selectMany'`, AND `items.enum` defining the available options.

For multi-selection lists:

```typescript
sizes: {
  type: 'array',
  format: 'selectMany',
  displayName: 'Available Sizes',
  items: {
    type: 'string',
    enum: [
      {
        value: 'Small',
        displayName: 'Small'
      },
      {
        value: 'Medium',
        displayName: 'Medium'
      },
      {
        value: 'Large',
        displayName: 'Large'
      }
    ]
  }
}
```

**Common mistake to avoid:**

```typescript
// ❌ WRONG: Missing format field
sizes: {
  type: 'array',
  items: { type: 'string' },
  displayName: 'Sizes'
}

// ❌ WRONG: enum on wrong level (should be in items)
sizes: {
  type: 'array',
  format: 'selectMany',
  enum: [...],  // Wrong location
  items: { type: 'string' },
  displayName: 'Sizes'
}

// ✅ CORRECT: format on property, enum in items
sizes: {
  type: 'array',
  format: 'selectMany',
  items: {
    type: 'string',
    enum: [
      { value: 'Small', displayName: 'Small' },
      { value: 'Medium', displayName: 'Medium' },
      { value: 'Large', displayName: 'Large' }
    ]
  },
  displayName: 'Sizes'
}
```

**Key differences between selectOne and selectMany:**

| Feature | selectOne (Dropdown) | selectMany (Select List) |
|---------|---------------------|--------------------------|
| Type | `'string'` | `'array'` |
| Format | `format: 'selectOne'` | `format: 'selectMany'` |
| Enum location | `enum: [...]` (on property) | `items: { enum: [...] }` (in items) |
| Return value | Single string | Array of strings |

## Property Formats

The `format` field provides additional semantic information about how a property should be handled in the CMS UI. Different property types support different formats.

### URL Type Formats

URL properties (`type: 'url'`) support formats that indicate the expected URL target:

| Format | Use When | Example |
|--------|----------|---------|
| `'DocumentUrl'` | URL points to a document (PDF, Word, etc.) | Link to downloadable file |
| `'ImageUrl'` | URL points to an image | Link to external image |
| No format | Generic URL field | Any URL type |

```typescript
// URL to a document
documentLink: {
  type: 'url',
  format: 'DocumentUrl',
  displayName: 'Document Link'
}

// URL to an image
externalImage: {
  type: 'url',
  format: 'ImageUrl',
  displayName: 'External Image URL'
}

// Generic URL (no format needed)
websiteUrl: {
  type: 'url',
  displayName: 'Website URL'
}
```

### String Type Formats

String properties (`type: 'string'`) support formats that control the UI widget and validation:

| Format | Use When | UI Control | Example |
|--------|----------|------------|---------|
| `'shortString'` | Short single-line text | Single-line textbox | Titles, names, labels |
| `'guid'` | Globally unique identifier | Text input with GUID validation | Tracking IDs, external references |
| `'selectOne'` | Single choice from predefined options | Dropdown list | Color picker, category selection |
| No format | Default string behavior | Multi-line textarea | General text content |

```typescript
// Short string (single-line)
title: {
  type: 'string',
  format: 'shortString',
  displayName: 'Title'
}

// GUID
trackingId: {
  type: 'string',
  format: 'guid',
  displayName: 'Tracking ID'
}

// Dropdown (requires enum)
priority: {
  type: 'string',
  format: 'selectOne',
  enum: [
    { value: 'Low', displayName: 'Low' },
    { value: 'Medium', displayName: 'Medium' },
    { value: 'High', displayName: 'High' }
  ],
  displayName: 'Priority'
}

// Long text (no format)
description: {
  type: 'string',
  displayName: 'Description'
}
```

### Array Type Formats

Array properties (`type: 'array'`) support the `selectMany` format for multi-selection:

| Format | Use When | UI Control | Example |
|--------|----------|------------|---------|
| `'selectMany'` | Multiple choices from predefined options | Multi-select list | Tag selection, feature toggles |
| No format | Free-form array | Array input | List of strings |

```typescript
// Multi-select list (requires items.enum)
features: {
  type: 'array',
  format: 'selectMany',
  items: {
    type: 'string',
    enum: [
      { value: 'WiFi', displayName: 'WiFi' },
      { value: 'Parking', displayName: 'Parking' },
      { value: 'Pool', displayName: 'Pool' }
    ]
  },
  displayName: 'Available Features'
}

// Free-form string array (no format)
tags: {
  type: 'array',
  items: { type: 'string' },
  displayName: 'Tags'
}
```

### Format Recognition from User Input

**CRITICAL**: When users describe properties using certain keywords, apply the appropriate format:

| User Says | Property Type | Format | Additional Fields |
|-----------|---------------|--------|-------------------|
| "URL to document", "document link" | `'url'` | `'DocumentUrl'` | None |
| "URL to image", "image link" | `'url'` | `'ImageUrl'` | None |
| "short string", "single-line text", "title" | `'string'` | `'shortString'` | None |
| "long string", "multi-line text", "description" | `'string'` | None | None |
| "GUID", "unique identifier" | `'string'` | `'guid'` | None |
| "dropdown", "select one" | `'string'` | `'selectOne'` | `enum: [...]` required |
| "select list", "multi-select" | `'array'` | `'selectMany'` | `items: { enum: [...] }` required |

**Example mappings:**

```typescript
// User: "add a URL to document property"
documentUrl: {
  type: 'url',
  format: 'DocumentUrl',
  displayName: 'Document URL'
}

// User: "add a short string property for the title"
title: {
  type: 'string',
  format: 'shortString',
  displayName: 'Title'
}

// User: "add a GUID property for tracking"
trackingGuid: {
  type: 'string',
  format: 'guid',
  displayName: 'Tracking GUID'
}

// User: "add a long string property for description"
description: {
  type: 'string',
  // No format - defaults to multi-line
  displayName: 'Description'
}
```
