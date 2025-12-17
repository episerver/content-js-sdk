# Modelling

In this page you will learn how to model content types for your CMS

## Step 1. Model content types

- Create a directory `src/components`. Inside that directory you will place your content types definitions.
- Create a file called `Article.tsx` inside the `src/components` directory
- Create a file `optimizely.config.mjs` in the root of your project

Your project structure will look like this:

```
.
├── src/
│   ├── app/
│   └── components/
│       └── Article.tsx
├── public
├── .env
├── optimizely.config.mjs
└── ...
```

Fill `Article.tsx` with the following content:

```ts
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
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

Fill `optimizely.config.mjs` with the following content

```js
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

### Optional: Define Property Groups

Property groups help organize your content type properties in the CMS editor. You can define custom property groups in your config file:

```js
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
  propertyGroups: [
    {
      key: 'seo',
      displayName: 'SEO',
      sortOrder: 1,
    },
    {
      key: 'meta',
      displayName: 'Metadata',
      sortOrder: 2,
    },
  ],
});
```

Each property group has:

- `key` (required): A unique identifier for the group
- `displayName` (optional): The name shown in the CMS editor. If not provided, it's auto-generated from the key
- `sortOrder` (optional): Controls the display order. If not provided, it's auto-assigned based on array position

You can then reference these groups in your content type properties using the `group` field.

### Container Types with mayContainTypes

`mayContainTypes` defines which content types can be created as children within a container. This property applies to `_page`, `_experience`, and `_folder` base types, enabling you to build structured content hierarchies and maintain organizational consistency.

```ts
const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  mayContainTypes: [
    ArticleContentType,
    '_page', // Allow all page types
    '_self', // Allow same type (BlogPage)
  ],
  properties: {
    // ... properties
  },
});

const ComponentFolderContentType = contentType({
  key: 'ComponentFolder',
  baseType: '_folder',
  mayContainTypes: ['_component', '_self'], // Only allow components and self
});
```

**`mayContainTypes`** defines the allowed child content types:

- Specific types: `[ArticleContentType]`
- Base types: `['_page', '_component']`
- Self-reference: `['_self']`
- Wildcard: `['*']` to allow all types

## Property Configuration

Each property in your content type can be configured with several options:

### Property Types

The `type` field defines the data type and can be one of:

- `'string'`, `'richText'`, `'boolean'`, `'integer'`, `'float'`
- `'dateTime'`, `'url'`, `'link'`, `'binary'`, `'json'`
- `'content'`, `'contentReference'`, `'array'`, `'component'`

#### URL Property

For storing simple web addresses as strings:

```ts
properties: {
  websiteUrl: {
    type: 'url',
    displayName: 'Website URL',
    description: 'External website link',
  },
}
```

#### Link Property

For storing links with additional metadata (text, title, target). Use this for rich link objects with all `<a>` tag attributes:

```ts
properties: {
  ctaLink: {
    type: 'link',
    displayName: 'Call to Action Link',
    description: 'Link with title and target options',
  },
}
```

**Key difference:** Use `url` for simple URL storage, use `link` when you need text, title, and target attributes along with the URL.

#### DateTime Property

For storing dates and times. Supports optional `minimum` and `maximum` constraints:

```ts
properties: {
  publishDate: {
    type: 'dateTime',
    displayName: 'Publish Date',
    required: true,
  },
  eventStartTime: {
    type: 'dateTime',
    displayName: 'Event Start',
    minimum: '2025-12-01T00:00:00Z', // Optional: Earliest allowed date
    maximum: '2025-12-31T23:59:59Z', // Optional: Latest allowed date
  },
}
```

Both `minimum` and `maximum` accept ISO date-time strings.

#### Array Property

For storing lists of values. The `items` field defines what type each array element should be:

```ts
properties: {
  tags: {
    type: 'array',
    items: {
      type: 'string',
    },
    displayName: 'Tags',
    minItems: 1,
    maxItems: 10,
  },
  features: {
    type: 'array',
    items: {
      type: 'richText',
    },
    displayName: 'Feature List',
  },
  relatedArticles: {
    type: 'array',
    items: {
      type: 'content',
      allowedTypes: [ArticleContentType],
    },
    displayName: 'Related Articles',
  },
}
```

Array properties support:

- `minItems` - Minimum number of items
- `maxItems` - Maximum number of items
- All item types except `array` (no nested arrays)

#### Component Property

For embedding a specific component type directly (also known as "Block" in the CMS UI):

```ts
const HeroComponentType = contentType({
  key: 'Hero',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

const LandingPageType = contentType({
  key: 'LandingPage',
  baseType: '_page',
  properties: {
    hero: {
      type: 'component',
      contentType: HeroComponentType,
      displayName: 'Hero Section',
    },
  },
});
```

The `component` type requires a `contentType` field specifying which component type to use.

### Indexing Types

The `indexingType` field controls how the property is indexed for search:

- **`'searchable'`** (default) - Fully indexed for searching
- **`'queryable'`** - Can be filtered/sorted but not full-text searched
- **`'disabled'`** - Not indexed at all

```ts
properties: {
  title: {
    type: 'string',
    indexingType: 'searchable',  // Full-text search
  },
  publishDate: {
    type: 'dateTime',
    indexingType: 'queryable',   // Can filter by date
  },
  internalNotes: {
    type: 'string',
    indexingType: 'disabled',    // Not searchable
  },
}
```

### Content Relationships

For `content` and `contentReference` properties, use `allowedTypes` and `restrictedTypes` to control which content types can be referenced:

```ts
import { contentType } from '@optimizely/cms-sdk';

const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  properties: {
    // ... other properties
  },
});

const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  properties: {
    featuredArticle: {
      type: 'content',
      allowedTypes: [ArticleContentType], // Only allow Article content type
      displayName: 'Featured Article',
    },
    relatedContent: {
      type: 'content',
      restrictedTypes: ['_folder'], // Allow all except folders
      displayName: 'Related Content',
    },
  },
});
```

**`allowedTypes`** - Whitelist of content types that can be selected. Can include:

- Specific content types: `[ArticleContentType, VideoContentType]`
- Base types: `['_page', '_component']`
- Self-reference: `['_self']` to allow the same content type

**`restrictedTypes`** - Blacklist of content types that cannot be selected. Uses the same format as `allowedTypes`.

## Step 2. Sync content types to the CMS

After defining your content types, sync them to the CMS by running the following command:

```sh
npx @optimizely/cms-cli@latest config push optimizely.config.mjs
```

## Next steps

Now you are ready to [create content in the CMS to fetch it later](./4-create-content.md)
