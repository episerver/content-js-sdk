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

Common property types include `'string'`, `'richText'`, `'boolean'`, `'integer'`, `'float'`, `'dateTime'`, `'url'`, `'content'`, `'contentReference'`, `'array'`, and `'component'`. See `references/property-types.md` for the complete list with examples.

### Important Patterns

**Content References**: Optionally use `allowedTypes` or `restrictedTypes` to control which content types can be referenced:
```typescript
featuredArticle: {
  type: 'content',
  allowedTypes: [ArticleContentType], // or ['Article'] as string - limits to only Articles
  displayName: 'Featured Article',
}
```

**Arrays**: Specify what type of items the array contains:
```typescript
tags: {
  type: 'array',
  items: { type: 'string' },
  displayName: 'Tags',
  minItems: 1,
  maxItems: 10,
}
```

**Components**: Embed a specific component type:
```typescript
hero: {
  type: 'component',
  contentType: HeroComponentType,
  displayName: 'Hero Section',
}
```

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
