---
name: optimizely-model
description: This skill should be used when the user asks to "create a content type", "model a BlogPage", "define a display template", "create a contract", "set up SEO fields", "convert JSON schema to TypeScript", "make an Article type", "add a Hero component", "model a Card display template", or mentions content type modeling, display templates, or contracts for Optimizely CMS.
---

# Optimizely Content Modeling

This skill helps you create content type definitions, display templates, and contracts for Optimizely CMS projects.

## When to Use This Skill

Use this skill when the user wants to:
- Create a new content type (page, component/block, experience, folder, media)
- Create a new display template for visual variations
- Create a new contract (reusable property set that content types can extend)
- Model content based on existing CMS definitions (content types, display templates, or contracts retrieved via `config pull`)

## Before You Start: Locate the Components Directory

The first step is to find where content type files should be created. Do this by reading `optimizely.config.mjs`:

1. Search for `optimizely.config.mjs` in the project root
2. Look for the `components` field in the config - this tells you where to create files
3. If the config file doesn't exist, stop and tell the user:
   > "I need an `optimizely.config.mjs` file to determine where to create content types. You can either:
   > - Use the `optimizely-setup` skill to set up the full Optimizely SDK configuration
   > - Create the config file manually with a `components` field pointing to your components directory"

**Example config structure:**
```javascript
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**.tsx'],
});
```

## Creating Content Types

Content types are created using the `contentType()` function from `@optimizely/cms-sdk`.

### File Structure

Create a file named after the content type (e.g., `Article.tsx`, `BlogPage.tsx`) in the components directory:

```typescript
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Article Heading',
      group: 'content',
      indexingType: 'searchable',
    },
    body: {
      type: 'richText',
      displayName: 'Article Body',
      group: 'content',
    },
  },
});
```

### Base Types

Choose the appropriate `baseType`: `'_page'`, `'_component'`, `'_experience'`, `'_folder'`, `'_image'`, `'_media'`, or `'_video'`. See `references/base-types.md` for detailed information.

### Property Types

Common property types include `'string'`, `'richText'`, `'boolean'`, `'integer'`, `'float'`, `'dateTime'`, `'url'`, `'content'`, `'contentReference'`, `'array'`, and `'component'`. 

**Numeric types** (`'integer'` and `'float'`) support `minimum` and `maximum` constraints:
```typescript
price: {
  type: 'float',
  minimum: 0.01,
  maximum: 999.99
}
```

See `references/property-types.md` for the complete list with examples.

### Property Metadata Fields

**CRITICAL**: All properties support these metadata fields - use them when specified by the user:

| Field | Description | Example |
|-------|-------------|---------|
| `displayName` | Label in CMS UI | `'Article Title'` |
| `description` | Help text for editors | `'The main heading for this article'` |
| `group` | Tab/section in editor | `'content'`, `'seo'` |
| `sortOrder` | Display order in group | `1`, `5`, `10` |
| `isRequired` | Must have a value | `true`, `false` |
| `isLocalized` | Different value per language | `true`, `false` |
| `indexingType` | Search indexing behavior | `'searchable'`, `'queryable'` |

**When user says** → **Use this field**:
- "display name", "label" → `displayName`
- "description", "help text" → `description`
- "localized", "culture specific", "per language" → `isLocalized: true`
- "sort order", "sort index", "order" → `sortOrder`
- "group", "tab" → `group`
- "searchable" → `indexingType: 'searchable'`
- "required", "mandatory" → `isRequired: true`

**Example with metadata:**
```typescript
title: {
  type: 'string',
  displayName: 'Article Title',
  description: 'The main heading displayed at the top',
  isLocalized: true,
  group: 'content',
  sortOrder: 1,
  indexingType: 'searchable',
  isRequired: true,
  maxLength: 100
}
```

### Recognizing Property Intent from User Requests

**CRITICAL**: When users describe properties, recognize the intended UI control and use the correct pattern:

| User Says | Property Type | Required Fields |
|-----------|---------------|-----------------|
| "dropdown", "select one", "choice", "pick one from..." | String with selectOne | `type: 'string'`, `format: 'selectOne'`, `enum: [...]` |
| "select list", "multi-select", "select many", "checkboxes", "pick multiple from..." | Array with selectMany | `type: 'array'`, `format: 'selectMany'`, `items: { type: 'string', enum: [...] }` |
| "URL to document", "document link", "URL to doc" | URL with DocumentUrl | `type: 'url'`, `format: 'DocumentUrl'` |
| "URL to image", "image link", "image URL" | URL with ImageUrl | `type: 'url'`, `format: 'ImageUrl'` |
| "short string", "single-line text", "title", "name" | String with shortString | `type: 'string'`, `format: 'shortString'` |
| "long string", "multi-line text", "description" | String (no format) | `type: 'string'` |
| "GUID", "unique identifier", "UUID" | String with guid | `type: 'string'`, `format: 'guid'` |
| "rich text", "formatted text", "WYSIWYG" | RichText | `type: 'richText'` |
| "image", "picture", "photo" | ContentReference | `type: 'contentReference'`, `allowedTypes: ['_image']` |
| "list of tags", "array of strings" | Array | `type: 'array'`, `items: { type: 'string' }` |

**Example**: If user says "add a dropdown with Red, Green, Blue options", create:
```typescript
colorChoice: {
  type: 'string',
  format: 'selectOne',
  enum: [
    { value: 'Red', displayName: 'Red' },
    { value: 'Green', displayName: 'Green' },
    { value: 'Blue', displayName: 'Blue' }
  ],
  displayName: 'Color Choice'
}
```

### Important Patterns

**Content References**: Control what can be referenced using `allowedTypes`, `restrictedTypes`, or `contentType`:

```typescript
// Using allowedTypes (whitelist)
featuredImage: {
  type: 'contentReference',
  allowedTypes: ['_image', '_video'],  // Base types as strings
  displayName: 'Featured Media'
}

relatedArticle: {
  type: 'contentReference',
  allowedTypes: [ArticleContentType],  // Custom types as object references (NOT strings)
  restrictedTypes: [DraftContentType], // Can combine with restrictedTypes
  displayName: 'Related Article'
}

// Using contentType (single specific type)
heroSection: {
  type: 'contentReference',
  contentType: HeroContentType,  // Object reference
  displayName: 'Hero Section'
}
```

**CRITICAL - Object References vs Strings**:
- **Base types** (start with underscore: `_page`, `_component`, `_image`, etc.) → use as **strings**: `['_image']`
- **Custom types** (no underscore: ArticleContentType, AllowedContentType, etc.) → use as **object references**: `[ArticleContentType]`
- When using custom type objects, **import them** at the top of the file

**How to determine:**
```typescript
// Starts with underscore → string
allowedTypes: ['_image']

// No underscore → object reference + import
allowedTypes: [ArticleContentType]
import { ArticleContentType } from './Article';

// Mixed
allowedTypes: ['_image', ArticleContentType]
import { ArticleContentType } from './Article';
```

**CRITICAL - Mutual Exclusivity**:
⚠️ **Cannot use `contentType` together with `allowedTypes`/`restrictedTypes`** - they are mutually exclusive. If user specifies both, use only `contentType` and warn the user.

**When user says**:
- "allowedType is X" → Check if X starts with underscore:
  - If X starts with `_` (e.g., `_image`) → `allowedTypes: ['_image']` (string)
  - If X does NOT start with `_` (e.g., `ArticleContentType`) → `allowedTypes: [ArticleContentType]` (object) + import
- "restrictedType is X" → `restrictedTypes: [XContentType]` (object, never string) + import
- "reference type is X" → `contentType: XContentType` (object, singular, not array) + import

**Examples of type name recognition**:
```
User says: "allowedType is AllowedContentType"
→ AllowedContentType (no underscore) = custom type
→ allowedTypes: [AllowedContentType]  // Object reference
→ import { AllowedContentType } from './AllowedContentType';

User says: "allowedType is _image"
→ _image (starts with underscore) = base type
→ allowedTypes: ['_image']  // String

User says: "restrictedType is RestrictContentType"
→ RestrictContentType (no underscore) = custom type
→ restrictedTypes: [RestrictContentType]  // Object reference
→ import { RestrictContentType } from './RestrictContentType';
```

**Arrays**: Specify what type of items the array contains. **CRITICAL**: Constraints on individual items go **inside the `items` object**:

```typescript
// Simple array
tags: {
  type: 'array',
  items: { type: 'string' },
  displayName: 'Tags',
  minItems: 1,    // Array-level: min number of items
  maxItems: 10,   // Array-level: max number of items
}

// Array with constraints on each item
validatedTags: {
  type: 'array',
  items: {
    type: 'string',
    minLength: 1,      // Item-level: each string min length
    maxLength: 20,     // Item-level: each string max length
    pattern: '^test'   // Item-level: each string must start with "test"
  },
  minItems: 1,
  maxItems: 10
}

// Array of numbers with range per item
prices: {
  type: 'array',
  items: {
    type: 'float',
    minimum: 0.01,   // Item-level: each price >= 0.01
    maximum: 999.99  // Item-level: each price <= 999.99
  }
}

// Array of content references with type restrictions per item
relatedArticles: {
  type: 'array',
  items: {
    type: 'content',
    allowedTypes: [ArticleContentType]  // Item-level: each must be Article
  }
}
```

**When user says "each item must...", "per item", "every item should..."** → add constraints inside `items` object.

**Dropdown Properties (Select One)**: 

**CRITICAL**: For dropdown/select-one properties, you MUST include both `format: 'selectOne'` AND an `enum` array.

```typescript
color: {
  type: 'string',
  format: 'selectOne',
  enum: [
    { value: 'Red', displayName: 'Red' },
    { value: 'Green', displayName: 'Green' },
    { value: 'Blue', displayName: 'Blue' }
  ],
  displayName: 'Color'
}
```

**Common mistake**: Omitting `format` or `enum` will result in a plain text field instead of a dropdown.

**Select List Properties (Select Many)**:

**CRITICAL**: For multi-select lists, you MUST use `type: 'array'`, include `format: 'selectMany'`, AND define `items.enum`.

```typescript
sizes: {
  type: 'array',
  format: 'selectMany',
  displayName: 'Sizes',
  items: {
    type: 'string',
    enum: [
      { value: 'Small', displayName: 'Small' },
      { value: 'Medium', displayName: 'Medium' },
      { value: 'Large', displayName: 'Large' }
    ]
  }
}
```

**Common mistake**: Putting `enum` at the property level instead of inside `items`, or omitting `format`.

**Components**: Embed a specific component type (use the type object reference, NOT a string):
```typescript
hero: {
  type: 'component',
  contentType: HeroComponentType, // Reference to the component type object
  displayName: 'Hero Section',
}
```

**IMPORTANT**: The `contentType` field must reference the actual type object (e.g., `HeroComponentType`), not a string like `'HeroComponentType'`.

**Container Types**: Use `mayContainTypes` for pages, experiences, and folders:
```typescript
export const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  mayContainTypes: [ArticleContentType, '_self'], // Can contain Articles and other BlogPages
  properties: { /* ... */ },
});
```

### Creating from Existing CMS Definitions

If the user wants to model based on existing content types, display templates, or contracts from CMS:

1. First, pull the definitions as JSON:
   ```bash
   npx @optimizely/cms-cli@latest config pull --json
   ```
2. Parse the JSON output to understand the structure
3. Convert it to the appropriate TypeScript format:
   - Content types → `contentType()` format
   - Display templates → `displayTemplate()` format
   - Contracts → `contract()` format

### Creating Multiple Content Types (Batch Creation)

When creating multiple content types at once (e.g., generating from CMS site data or creating a set of related types):

1. Create all content type files in the components directory
2. **IMPORTANT**: After creating all files, check if `initContentTypeRegistry` exists in the project (search for it in `layout.tsx` or `app/layout.tsx`)
3. If the registry exists, add all new content types and contracts to it:
   ```typescript
   import { ArticleContentType } from '@/components/Article';
   import { BlogPageContentType } from '@/components/BlogPage';
   import { HeroComponentType } from '@/components/Hero';
   import { SEOContract } from '@/components/SEOContract';
   import { initContentTypeRegistry } from '@optimizely/cms-sdk';
   
   initContentTypeRegistry([
     SEOContract, // Contracts first
     ArticleContentType,
     BlogPageContentType,
     HeroComponentType,
   ]);
   ```
4. If creating a script to generate content types, ensure the script also updates the registry
5. Remind the user to sync with `config push` after all types are created and registered

### Component-Specific Configuration

For component types, you can specify composition behaviors:

```typescript
export const HeroComponentType = contentType({
  key: 'Hero',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: { /* ... */ },
});
```

## Creating Display Templates

Display templates provide visual variations for content types and sections. You can create them from scratch or pull existing ones from CMS using `config pull --json`.

### File Structure

Create display templates in the same components directory:

```typescript
import { displayTemplate } from '@optimizely/cms-sdk';

export const CardDisplayTemplate = displayTemplate({
  key: 'CardTemplate',
  displayName: 'Card Display',
  isDefault: false,
  contentType: 'Article', // Or use a content type object
  settings: {
    showImage: {
      displayName: 'Show Image',
      editor: 'checkbox',
      sortOrder: 1,
      choices: {
        true: { displayName: 'Yes', sortOrder: 1 },
        false: { displayName: 'No', sortOrder: 2 },
      },
    },
  },
  tag: 'ArticleCard', // Optional: React component name
});
```

### Display Template Variants

A display template must specify one of:
- `contentType: 'TypeKey'` - For a specific content type
- `baseType: '_page' | '_component' | ...` - For all types with that base
- `nodeType: 'row' | 'column'` - For section nodes

### Settings Configuration

Settings allow editors to customize the display:
- `editor: 'select' | 'checkbox'`
- `choices` - Object mapping choice keys to display names and sort order

## Creating Contracts

Contracts are reusable property definitions that multiple content types can extend. They help avoid duplicating common properties across content types. You can create them from scratch or pull existing ones from CMS using `config pull --json`.

### File Structure

Create a file for the contract (e.g., `SEOContract.tsx`) in the components directory:

```typescript
import { contract } from '@optimizely/cms-sdk';

export const SEOContract = contract({
  key: 'seo',
  displayName: 'SEO Properties',
  properties: {
    metaTitle: {
      type: 'string',
      displayName: 'Meta Title',
      maxLength: 60,
    },
    metaDescription: {
      type: 'string',
      displayName: 'Meta Description',
      maxLength: 160,
    },
    ogImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Open Graph Image',
    },
  },
});
```

### Using Contracts in Content Types

Content types can extend contracts to inherit their properties:

```typescript
import { contentType } from '@optimizely/cms-sdk';
import { SEOContract } from './SEOContract';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  extends: SEOContract, // Inherits metaTitle, metaDescription, ogImage
  properties: {
    heading: { type: 'string' },
    body: { type: 'richText' },
  },
});
```

### Common Contract Use Cases

- **SEO properties**: Meta titles, descriptions, social media tags
- **Authoring metadata**: Created by, last modified, review date
- **Publishing workflow**: Draft status, approval flags, scheduled publish date
- **Analytics**: Tracking codes, campaign parameters
- **Accessibility**: Alt text requirements, ARIA labels

### Multiple Contracts

Content types can extend multiple contracts (pass an array):

```typescript
export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  extends: [SEOContract, AuthorContract, PublishingContract],
  properties: {
    // Article-specific properties
  },
});
```

## Registering Content Types and Contracts

After creating content type or contract files, check if `initContentTypeRegistry` is used in the project:

1. Search for files importing `initContentTypeRegistry` (typically in `layout.tsx` or `app/layout.tsx`)
2. If found, add the new content types and contracts to the array:

```typescript
import { ArticleContentType } from '@/components/Article';
import { BlogPageContentType } from '@/components/BlogPage'; // New type
import { SEOContract } from '@/components/SEOContract'; // New contract
import { initContentTypeRegistry } from '@optimizely/cms-sdk';

initContentTypeRegistry([
  SEOContract, // Add new contracts
  ArticleContentType,
  BlogPageContentType, // Add new types
]);
```

3. If not found, inform the user they may need to set up the registry in their application bootstrap code

## Registering Display Templates

After creating display template files, check if `initDisplayTemplateRegistry` is used in the project:

1. Search for files importing `initDisplayTemplateRegistry` (typically in `layout.tsx` or `app/layout.tsx`)
2. If found, add the new display templates to the array:

```typescript
import { CardDisplayTemplate } from '@/components/CardDisplayTemplate'; // New template
import { ListDisplayTemplate } from '@/components/ListDisplayTemplate'; // New template
import { initDisplayTemplateRegistry } from '@optimizely/cms-sdk';

initDisplayTemplateRegistry([
  CardDisplayTemplate,
  ListDisplayTemplate, // Add new templates
]);
```

3. If not found, inform the user they may need to set up the registry in their application bootstrap code

### React Components for Display Templates

Display templates define the structure and settings in CMS, but they need corresponding React components for rendering.

After creating display template definitions, **always** suggest to the user:

> **Next Step**: Create the React rendering component for this display template using the `optimizely-model-react` skill.

The React component should:
- Match the display template's `tag` field (if specified) or use the display template key
- Implement the visual variation defined by the template
- Use the template's settings to customize rendering

## After Creating Files

After successfully creating content type, display template, or contract files, **always** do the following:

### 1. Remind About Syncing to CMS

Immediately remind the user that they need to sync to CMS. Provide the exact command they should run:

> **Next Step**: Sync your changes to the CMS by running:
> ```bash
> npx @optimizely/cms-cli@latest config push optimizely.config.mjs
> ```

### 2. Offer to Run the Command

Ask the user if they want you to run the sync command now:

> Would you like me to run the sync command for you now?

If they say yes, run the command and report the results. If they say no or later, acknowledge and move on.

### 3. Suggest React Components (if applicable)

If the user created content types and the project uses React, suggest:

> For React rendering components, use the `optimizely-model-react` skill to generate the component.

## File Naming Conventions

Use PascalCase for file names matching the key:
- Content type key `Article` → file `Article.tsx`
- Content type key `BlogPage` → file `BlogPage.tsx`
- Display template key `CardTemplate` → file `CardTemplate.tsx`
- Contract key `seo` → file `SEOContract.tsx`

Export with appropriate suffixes:
- `export const ArticleContentType = contentType({ ... })`
- `export const CardDisplayTemplate = displayTemplate({ ... })`
- `export const SEOContract = contract({ ... })`

## Common Pitfalls to Avoid

Avoid nested arrays, invalid base types, missing component type fields, forgetting to register types, and adding baseType to contracts. See `references/common-pitfalls.md` for detailed explanations and solutions.

## Summary Workflow

1. Check `optimizely.config.mjs` for components directory
2. Create the content type, contract, or display template file in that directory
3. Use appropriate `contentType()`, `contract()`, or `displayTemplate()` structure
4. Add to registry if it exists:
   - `initContentTypeRegistry` (contracts before content types)
   - `initDisplayTemplateRegistry` (for display templates)
5. **Always remind** user to run `config push` and **offer to run it** for them
6. Suggest `optimizely-model-react` for React components if applicable

## Additional Resources

### Reference Files

For detailed information, consult:

- **`references/property-types.md`** - Comprehensive property type reference with all types, constraints, and usage examples
- **`references/base-types.md`** - Detailed base type explanations and usage patterns for pages, components, experiences, and media
- **`references/common-pitfalls.md`** - Common pitfalls and solutions when modeling content types, display templates, and contracts
