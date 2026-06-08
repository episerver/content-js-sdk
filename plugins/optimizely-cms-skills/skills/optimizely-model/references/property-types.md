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

### Numeric Types (Integer and Float)

Both `'integer'` and `'float'` types support `minimum` and `maximum` constraints to define valid value ranges:

```typescript
// Integer with range constraints
quantity: {
  type: 'integer',
  displayName: 'Quantity',
  minimum: 1,      // Smallest allowed value
  maximum: 100     // Largest allowed value
}

// Float with range constraints
price: {
  type: 'float',
  displayName: 'Price',
  minimum: 0.01,   // Smallest allowed value
  maximum: 999.99  // Largest allowed value
}
```

**When user specifies numeric constraints:**
- "minimum", "min value", "at least" → use `minimum` field
- "maximum", "max value", "up to", "no more than" → use `maximum` field

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

Arrays require an `items` field to define what the array contains. You can specify constraints on:
1. **The array itself** using `minItems` and `maxItems`
2. **Each item in the array** by adding constraints inside the `items` object

```typescript
// Array-level constraints only
tags: {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,      // Minimum number of items in array
  maxItems: 10      // Maximum number of items in array
}

// Item-level constraints (applied to each string in the array)
validatedTags: {
  type: 'array',
  displayName: 'Validated Tags',
  items: {
    type: 'string',
    minLength: 1,      // Each string must be at least 1 char
    maxLength: 20,     // Each string must be max 20 chars
    pattern: '^[A-Z]'  // Each string must start with uppercase letter
  },
  minItems: 1,
  maxItems: 5
}

// Array of integers with range constraints on each item
quantities: {
  type: 'array',
  displayName: 'Quantities',
  items: {
    type: 'integer',
    minimum: 1,    // Each integer must be >= 1
    maximum: 100   // Each integer must be <= 100
  }
}

// Array of floats with range constraints on each item
prices: {
  type: 'array',
  displayName: 'Price List',
  items: {
    type: 'float',
    minimum: 0.01,   // Each price must be >= 0.01
    maximum: 999.99  // Each price must be <= 999.99
  }
}

// Array of dateTimes with range constraints on each item
eventDates: {
  type: 'array',
  displayName: 'Event Dates',
  items: {
    type: 'dateTime',
    minimum: '2024-01-01T00:00:00Z',  // Each date must be >= this
    maximum: '2024-12-31T23:59:59Z'   // Each date must be <= this
  }
}

// Array of content references with type restrictions on each item
relatedArticles: {
  type: 'array',
  displayName: 'Related Articles',
  items: {
    type: 'content',
    allowedTypes: [ArticleContentType],  // Each item must be an Article
    restrictedTypes: [DraftContentType]  // Each item cannot be a Draft
  }
}

// Array of content references with allowedTypes
images: {
  type: 'array',
  displayName: 'Image Gallery',
  items: {
    type: 'contentReference',
    allowedTypes: ['_image']  // Each item must be an image
  }
}

// Array of components with specific component type for each item
sections: {
  type: 'array',
  displayName: 'Page Sections',
  items: {
    type: 'component',
    contentType: SectionComponentType  // Each item must be this component type
  }
}
```

**CRITICAL**: When users specify constraints for array items (e.g., "each item must start with X", "minimum value per item"), those constraints go **inside the `items` object**, not at the array property level.

**Important**: Arrays cannot contain other arrays (nested arrays are not supported).

### Content Reference Type

Content references allow editors to select existing content items. You can control what can be referenced using three different approaches:

#### 1. Using `allowedTypes` (Whitelist)

Restricts the reference to specific content types:

```typescript
featuredImage: {
  type: 'contentReference',
  displayName: 'Featured Image',
  allowedTypes: ['_image']  // Base types use strings
}

relatedArticle: {
  type: 'contentReference',
  displayName: 'Related Article',
  allowedTypes: [ArticleContentType, BlogPostContentType]  // Custom types use object references
}
```

#### 2. Using `restrictedTypes` (Blacklist)

Prevents certain content types from being referenced (allows everything except these):

```typescript
anyContentExceptDrafts: {
  type: 'contentReference',
  displayName: 'Any Content (No Drafts)',
  restrictedTypes: [DraftContentType]  // Custom types use object references
}
```

#### 3. Using `contentType` (Single Type)

Restricts to exactly one specific content type:

```typescript
heroSection: {
  type: 'contentReference',
  displayName: 'Hero Section',
  contentType: HeroContentType  // Object reference to specific type
}
```

#### Combining Constraints

You can use both `allowedTypes` and `restrictedTypes` together:

```typescript
selectableContent: {
  type: 'contentReference',
  displayName: 'Content Selector',
  allowedTypes: [ArticleContentType, BlogPostContentType],  // Only these types
  restrictedTypes: [DraftContentType]  // But not drafts
}
```

**CRITICAL - Mutual Exclusivity Warning**: 

⚠️ **You CANNOT use `contentType` together with `allowedTypes` or `restrictedTypes`.** These are mutually exclusive:

- ✅ **Valid**: `allowedTypes` only
- ✅ **Valid**: `restrictedTypes` only  
- ✅ **Valid**: `allowedTypes` + `restrictedTypes` together
- ✅ **Valid**: `contentType` only
- ❌ **INVALID**: `contentType` + `allowedTypes`
- ❌ **INVALID**: `contentType` + `restrictedTypes`
- ❌ **INVALID**: `contentType` + `allowedTypes` + `restrictedTypes`

If a user specifies both `contentType` and allowed/restricted types, **use only `contentType`** and warn them:

```typescript
// User says: "reference type is HeroContentType, allowedType is ArticleContentType"
// ❌ WRONG - will fail when pushing to CMS:
heroRef: {
  type: 'contentReference',
  contentType: HeroContentType,
  allowedTypes: [ArticleContentType]  // Conflict!
}

// ✅ CORRECT - use contentType only and warn user:
heroRef: {
  type: 'contentReference',
  contentType: HeroContentType  // Specific type only
}
```

#### Object References vs Strings

**CRITICAL**: 

- **Base types** (`_page`, `_component`, `_experience`, `_media`, `_image`, `_video`, `_folder`) → use as **strings** with quotes
- **Custom content types** (e.g., `ArticleContentType`, `HeroContentType`) → use as **object references** without quotes

```typescript
// ✅ CORRECT
mixedReferences: {
  type: 'contentReference',
  allowedTypes: [
    '_image',              // Base type as string
    '_video',              // Base type as string  
    ArticleContentType,    // Custom type as object reference
    BlogPostContentType    // Custom type as object reference
  ]
}

// ❌ WRONG - custom types as strings
wrongReferences: {
  type: 'contentReference',
  allowedTypes: ['ArticleContentType', 'BlogPostContentType']  // Won't work!
}
```

When using custom type object references, **import them** at the top of the file:

```typescript
import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';  // Import referenced type
import { BlogPostContentType } from './BlogPost';

export const TestingPageContentType = contentType({
  key: 'TestingPage',
  baseType: '_page',
  properties: {
    relatedContent: {
      type: 'contentReference',
      allowedTypes: [ArticleContentType, BlogPostContentType]  // Use imported refs
    }
  }
});
```

#### When User Specifies Content References

**Phrase recognition:**

| User Says | Field to Use | Value Format |
|-----------|--------------|--------------|
| "allowedType is X", "allowed type X", "can reference X" | `allowedTypes` | `[XContentType]` (object) or `['_base']` (string) |
| "restrictedType is X", "restricted type X", "cannot reference X" | `restrictedTypes` | `[XContentType]` (object) |
| "reference type is X", "content type X", "must be X" | `contentType` | `XContentType` (object, singular) |
| "allowedTypes _image and _video" | `allowedTypes` | `['_image', '_video']` |

**CRITICAL - Determining String vs Object Reference**:

When the user specifies a type name, determine if it's a base type or custom type:

**Base types** (use as strings):
- `_page`, `_component`, `_experience`, `_media`, `_image`, `_video`, `_folder`
- These are built-in CMS base types
- Example: `allowedTypes: ['_image', '_video']`

**Custom types** (use as object references):
- ANY other type name that doesn't start with underscore
- Examples: `ArticleContentType`, `HeroContentType`, `AllowedContentType`, `RestrictContentType`
- Must import at top of file
- Example: `allowedTypes: [ArticleContentType]`

```typescript
// User: "allowedType is _image"
allowedTypes: ['_image']  // String because it starts with underscore

// User: "allowedType is ArticleContentType"  
allowedTypes: [ArticleContentType]  // Object reference because no underscore
// Also add: import { ArticleContentType } from './Article';

// User: "allowedType is AllowedContentType"
allowedTypes: [AllowedContentType]  // Object reference (custom type)
// Also add: import { AllowedContentType } from './AllowedContentType';

// User: "allowedTypes are _image and ArticleContentType"
allowedTypes: ['_image', ArticleContentType]  // Mixed: string + object
// Also add: import { ArticleContentType } from './Article';
```

**Examples:**

```typescript
// User: "add p_ref with allowedType is Article and restrictedType is Draft"
p_ref: {
  type: 'contentReference',
  allowedTypes: [ArticleContentType],
  restrictedTypes: [DraftContentType]
}

// User: "add p_ref with reference type is Hero"  
p_ref: {
  type: 'contentReference',
  contentType: HeroContentType
}

// User: "add p_ref with allowedType is Article and reference type is Hero"
// ⚠️ Conflict! Use contentType only and warn:
p_ref: {
  type: 'contentReference',
  contentType: HeroContentType  // contentType takes precedence
}
// Output warning: "Cannot use contentType together with allowedTypes. Using contentType only."
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

### Property Metadata Fields

All property types support these common metadata fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `displayName` | string | Label shown in CMS editor UI | `'Article Title'` |
| `description` | string | Help text shown to editors | `'The main heading for this article'` |
| `group` | string | Tab/group in editor where property appears | `'content'`, `'seo'`, `'settings'` |
| `sortOrder` | number | Display order within group (lower = first) | `1`, `5`, `10` |
| `isRequired` | boolean | Whether property must have a value | `true`, `false` |
| `isLocalized` | boolean | Whether property has different values per language/culture | `true`, `false` |
| `indexingType` | string | How property is indexed for search | `'searchable'`, `'queryable'` |

**Complete example with all metadata:**

```typescript
title: {
  type: 'string',
  displayName: 'Article Title',
  description: 'The main heading displayed at the top of the article',
  isLocalized: true,
  group: 'content',
  sortOrder: 1,
  indexingType: 'searchable',
  isRequired: true,
  maxLength: 100
}
```

### Recognizing Metadata from User Input

**CRITICAL**: Map user phrases to the correct field names:

| User Says | Property Field | Value |
|-----------|----------------|-------|
| "display name", "label", "title" | `displayName` | The specified text |
| "description", "help text", "tooltip" | `description` | The specified text |
| "localized", "culture specific", "per language", "translated" | `isLocalized` | `true` |
| "sort order", "sort index", "display order", "order" | `sortOrder` | The specified number |
| "group", "tab", "section" | `group` | The specified group name |
| "searchable", "indexed for search" | `indexingType` | `'searchable'` |
| "queryable", "filterable" | `indexingType` | `'queryable'` |
| "required", "mandatory", "must have value" | `isRequired` | `true` |

**Example mappings:**

```typescript
// User: "add a title property with display name 'Page Title', description 'Main page heading', localized, sort index 1"
title: {
  type: 'string',
  displayName: 'Page Title',
  description: 'Main page heading',
  isLocalized: true,
  sortOrder: 1
}

// User: "add a category dropdown in the SEO group, sort order 5, searchable"
category: {
  type: 'string',
  format: 'selectOne',
  group: 'seo',
  sortOrder: 5,
  indexingType: 'searchable',
  enum: [...]
}
```

### Required Fields

Mark properties as required using the `isRequired` field:

```typescript
title: {
  type: 'string',
  isRequired: true
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
