# Modelling

In this page you will learn how to model content types for your CMS

## Step 1. Model content types

Create a file called `Article.tsx` in the `src/components` directory to define your content type:

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

The `ArticleContentType` demonstrates a basic page (`_page`) content type content type structure with two fundamental property types:

- **string**: Used for simple text fields like titles, names, or short descriptions
- **richText**: Used for formatted content that supports rich text editing capabilities, such as article bodies or detailed descriptions

These basic property types are the building blocks for your content model. The following sections show more property types and patterns you can use to create complex content types.

## Property Configuration

Each property in your content type can be configured with several options:

### Property Types

The `type` field defines the data type and can be one of:

- **`'string'`** - Simple text fields
- **`'richText'`** - Formatted content with rich text editing (slate js format)
- **`'boolean'`** - True/false values
- **`'integer'`** - Whole numbers
- **`'float'`** - Decimal numbers
- **`'dateTime'`** - Date and time values
- **`'url'`** - Simple web addresses
- **`'link'`** - Links with metadata (text, title, target)
- **`'binary'`** - Binary data files
- **`'json'`** - Structured JSON data
- **`'content'`** - References to other content items
- **`'contentReference'`** - References to content with additional constraints
- **`'array'`** - Lists of values
- **`'component'`** - Embedded component types

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

> [!IMPORTANT]
> When using `type: 'content'` or `type: 'contentReference'` within array items, always specify `allowedTypes` or `restrictedTypes`. Without these constraints, the SDK will generate nested GraphQL fragments for all possible content types, causing severe performance issues and very slow queries.
>
> [!TIP]
> You can use contracts in `allowedTypes` to allow all content types that extend a specific contract. See the [Content Relationships](#content-relationships) section for examples.

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
- Contracts: `[SEOContract]` to allow all content types that extend that contract

**`restrictedTypes`** - Blacklist of content types that cannot be selected. Uses the same format as `allowedTypes`.

> [!IMPORTANT]
> Always specify either `allowedTypes` or `restrictedTypes` for `content` and `contentReference` properties. Without these constraints, the SDK will generate nested GraphQL fragments for all possible content types, causing severe performance issues and very slow queries.

## Container Types with mayContainTypes

`mayContainTypes` defines which content types can be created as children within a container. This property applies to `_page`, `_experience`, and `_folder` base types, enabling you to build structured content hierarchies and maintain organizational consistency.

```ts
const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  mayContainTypes: [
    ArticleContentType,
    '_self', // Allow same type (BlogPage)
  ],
  properties: {
    // ... properties
  },
});

const ComponentFolderContentType = contentType({
  key: 'ComponentFolder',
  baseType: '_folder',
  mayContainTypes: ['_self'], // Only allow components and self
});
```

**`mayContainTypes`** defines the allowed child content types:

- Specific types: `[ArticleContentType]` or `['ArticleContentType']` (`key` of an contentType)
- Self-reference: `['_self']`
- Wildcard: `['*']` to allow all types

## Contracts

Contracts enable you to define reusable sets of properties that can be shared across multiple content types. This promotes consistency, reduces duplication, and makes it easier to maintain common property sets across your content model.

### Creating a Contract

Use the `contract` function to define a reusable set of properties:

```ts
import { contract, contentType } from '@optimizely/cms-sdk';

export const SEOContract = contract({
  key: 'SEO',
  displayName: 'SEO Properties',
  properties: {
    metaTitle: {
      type: 'string',
      displayName: 'Meta Title',
      description: 'SEO title for search engines',
      maxLength: 60,
      group: 'seo',
    },
    metaDescription: {
      type: 'string',
      displayName: 'Meta Description',
      description: 'SEO description for search engines',
      maxLength: 160,
      group: 'seo',
    },
    ogImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Open Graph Image',
      description: 'Image for social media sharing',
      group: 'seo',
    },
  },
});
```

### Using Contracts with Content Types

Content types can extend one or multiple contracts using the `extends` property:

```ts
// Extend a single contract
const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  extends: SEOContract, // Inherits metaTitle, metaDescription, ogImage
  properties: {
    heading: {
      type: 'string',
      displayName: 'Article Heading',
    },
    body: {
      type: 'richText',
      displayName: 'Article Body',
    },
  },
});
```

### Extending Multiple Contracts

A content type can extend multiple contracts by passing an array:

```ts
const TrackingContract = contract({
  key: 'Tracking',
  displayName: 'Analytics Tracking',
  properties: {
    analyticsId: {
      type: 'string',
      displayName: 'Analytics ID',
      group: 'tracking',
    },
    trackingEnabled: {
      type: 'boolean',
      displayName: 'Enable Tracking',
      group: 'tracking',
    },
  },
});

const ProductPageContentType = contentType({
  key: 'ProductPage',
  baseType: '_page',
  extends: [SEOContract, TrackingContract], // Multiple contracts
  properties: {
    productName: {
      type: 'string',
      displayName: 'Product Name',
    },
    price: {
      type: 'float',
      displayName: 'Price',
    },
  },
});
```

### Property Merging Behavior

When a content type extends contracts:

1. All contract properties are merged into the content type
2. If multiple contracts define the same property key, the **rightmost contract** wins
3. Properties defined directly on the content type override any inherited properties with the same key

```ts
const Contract1 = contract({
  key: 'Contract1',
  displayName: 'Contract 1',
  properties: {
    title: { type: 'string', displayName: 'Title from Contract 1' },
    description: { type: 'string', displayName: 'Description' },
  },
});

const Contract2 = contract({
  key: 'Contract2',
  displayName: 'Contract 2',
  properties: {
    // Overrides Contract1
    title: { type: 'string', displayName: 'Title from Contract 2' }, 
  },
});

const MyContentType = contentType({
  key: 'MyType',
  baseType: '_page',
  extends: [Contract1, Contract2],
  properties: {
    // Overrides both contracts
    title: { type: 'string', displayName: 'My Custom Title' },
  },
});

// Result: MyContentType has:
// - title: "My Custom Title" (from content type)
// - description: "Description" (from Contract1)
```


#### Using Contracts in Content Relationships

Contracts can be used in `allowedTypes` and `restrictedTypes` to allow or restrict all content types that extend a specific contract:

```ts
const PublishableContract = contract({
  key: 'Publishable',
  displayName: 'Publishable Content',
  properties: {
    publishDate: { type: 'dateTime' },
    author: { type: 'string' },
  },
});

const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  extends: PublishableContract,
  properties: { body: { type: 'richText' } },
});

const NewsContentType = contentType({
  key: 'News',
  baseType: '_page',
  extends: PublishableContract,
  properties: { headline: { type: 'string' } },
});

const FeedPageContentType = contentType({
  key: 'FeedPage',
  baseType: '_page',
  properties: {
    featuredItems: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [PublishableContract], // Allows Article AND News (both extend PublishableContract)
      },
      displayName: 'Featured Items',
    },
  },
});
```

This is particularly useful when you want to allow multiple content types that share common characteristics without listing each type individually.

## Step 2. Sync content types to the CMS

After defining your content types and contracts, sync them to the CMS by running the following command:

```sh
npx @optimizely/cms-cli@latest config push optimizely.config.mjs
```

## Next steps

Now you are ready to [create content in the CMS to fetch it later](./4-create-content.md)
