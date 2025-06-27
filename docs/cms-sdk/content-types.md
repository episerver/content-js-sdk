# Content Types

Content types are the foundation of the Optimizely CMS SDK. They define the structure, validation, and behavior of your content while providing full TypeScript support and automatic GraphQL query generation.

## Overview

A content type is a schema that defines:
- **Structure**: What properties the content has
- **Validation**: Required fields, length limits, allowed values
- **Behavior**: How content can be used (composition behaviors)
- **Types**: Full TypeScript support with automatic inference

## Basic Content Type Definition

```typescript
import { contentType } from '@episerver/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      required: true,
      displayName: 'Article Title'
    },
    content: {
      type: 'richText',
      displayName: 'Content'
    }
  }
});
```

## Base Types

Base types determine the fundamental behavior of your content:

### Page Types
```typescript
export const PageContentType = contentType({
  key: 'LandingPage',
  baseType: '_page', // Standard web page
  // ...
});
```

### Component Types (Blocks)
```typescript
export const HeroContentType = contentType({
  key: 'Hero',
  baseType: '_component', // Reusable component/block
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  // ...
});
```

### Experience Types
```typescript
export const CampaignContentType = contentType({
  key: 'Campaign',
  baseType: '_experience', // Experience composition
  // ...
});
```

### Media Types
```typescript
// Media types are built-in: '_image', '_video', '_media'
// Use them in contentReference properties:
{
  featuredImage: {
    type: 'contentReference',
    allowedTypes: ['_image']
  }
}
```

### Other Base Types
- `_folder` - Content organization
- `_element` - Page elements

## Property Types

### String Properties

Basic text input with validation options:

```typescript
{
  title: {
    type: 'string',
    required: true,
    displayName: 'Title',
    description: 'The main title of the content',
    minLength: 5,
    maxLength: 100,
    group: 'Content'
  },
  
  // String with predefined options
  category: {
    type: 'string',
    displayName: 'Category',
    enum: [
      { value: 'news', displayName: 'News' },
      { value: 'blog', displayName: 'Blog Post' },
      { value: 'announcement', displayName: 'Announcement' }
    ]
  }
}
```

### Boolean Properties

True/false flags:

```typescript
{
  featured: {
    type: 'boolean',
    displayName: 'Featured Content',
    description: 'Mark this content as featured'
  },
  
  published: {
    type: 'boolean',
    displayName: 'Published',
    required: true
  }
}
```

### Number Properties

Numeric values with validation:

```typescript
{
  price: {
    type: 'float',
    displayName: 'Price',
    minimum: 0,
    maximum: 10000,
    description: 'Product price in USD'
  },
  
  quantity: {
    type: 'integer',
    displayName: 'Quantity',
    minimum: 1,
    enum: [
      { value: 1, displayName: 'Single' },
      { value: 12, displayName: 'Dozen' },
      { value: 24, displayName: 'Case' }
    ]
  }
}
```

### Date and Time Properties

Date and timestamp handling:

```typescript
{
  publishDate: {
    type: 'dateTime',
    displayName: 'Publish Date',
    required: true,
    description: 'When this content should be published'
  },
  
  eventDate: {
    type: 'dateTime',
    displayName: 'Event Date'
  }
}
```

### Rich Text Properties

HTML content with rich editing:

```typescript
{
  content: {
    type: 'richText',
    displayName: 'Main Content',
    required: true,
    description: 'The main body content'
  },
  
  summary: {
    type: 'richText',
    displayName: 'Summary',
    description: 'Brief summary or excerpt'
  }
}
```

### URL Properties

URL handling with validation:

```typescript
{
  website: {
    type: 'url',
    displayName: 'Website URL',
    description: 'External website link'
  },
  
  redirectUrl: {
    type: 'url',
    displayName: 'Redirect URL',
    required: true
  }
}
```

### Content Reference Properties

References to other content:

```typescript
{
  // Single content reference
  author: {
    type: 'contentReference',
    displayName: 'Author',
    allowedTypes: ['Author', 'Person'],
    description: 'The content author'
  },
  
  // Multiple content references
  relatedArticles: {
    type: 'array',
    items: {
      type: 'contentReference',
      allowedTypes: ['Article', 'BlogPost']
    },
    displayName: 'Related Articles'
  },
  
  // Media references
  gallery: {
    type: 'array',
    items: {
      type: 'contentReference',
      allowedTypes: ['_image']
    },
    displayName: 'Image Gallery'
  },
  
  // Restricted types (everything except these)
  backgroundContent: {
    type: 'contentReference',
    restrictedTypes: ['_folder'],
    displayName: 'Background Content'
  }
}
```

### Content Properties

Embedded content (inline composition):

```typescript
{
  embeddeContent: {
    type: 'content',
    displayName: 'Embedded Content',
    allowedTypes: ['Article', 'Product'],
    description: 'Content embedded within this page'
  }
}
```

### Component Properties

Strongly-typed component references:

```typescript
import { HeroContentType } from './Hero';
import { CallToActionContentType } from './CallToAction';

{
  heroSection: {
    type: 'component',
    contentType: HeroContentType,
    displayName: 'Hero Section'
  },
  
  callToAction: {
    type: 'component',
    contentType: CallToActionContentType,
    displayName: 'Call to Action'
  }
}
```

### Array Properties

Collections of values or content:

```typescript
{
  // Array of strings
  tags: {
    type: 'array',
    items: { type: 'string' },
    displayName: 'Tags'
  },
  
  // Array of numbers
  ratings: {
    type: 'array',
    items: {
      type: 'integer',
      minimum: 1,
      maximum: 5
    },
    displayName: 'Ratings'
  },
  
  // Array of components
  pageElements: {
    type: 'array',
    items: {
      type: 'component',
      contentType: PageElementContentType
    },
    displayName: 'Page Elements'
  },
  
  // Array of content references
  featuredContent: {
    type: 'array',
    items: {
      type: 'contentReference',
      allowedTypes: ['Article', 'Product', 'Event']
    },
    displayName: 'Featured Content'
  }
}
```

### Binary Properties

File uploads and binary data:

```typescript
{
  document: {
    type: 'binary',
    displayName: 'Document',
    description: 'PDF or document file'
  },
  
  dataFile: {
    type: 'binary',
    displayName: 'Data File'
  }
}
```

### JSON Properties

Structured data storage:

```typescript
{
  metadata: {
    type: 'json',
    displayName: 'Metadata',
    description: 'Additional structured data'
  },
  
  configuration: {
    type: 'json',
    displayName: 'Configuration'
  }
}
```

### Link Properties

Special link handling:

```typescript
{
  actionLink: {
    type: 'link',
    displayName: 'Action Link',
    description: 'Link for call-to-action button'
  }
}
```

## Property Configuration Options

All properties support these common options:

```typescript
{
  propertyName: {
    type: 'string', // Required: property type
    
    // Display options
    displayName: 'Display Name', // Label in CMS UI
    description: 'Helpful description', // Help text
    group: 'Content', // Group properties in UI
    
    // Validation
    required: true, // Make field required
    
    // Localization
    localized: true, // Enable translation
    
    // Organization
    sortOrder: 100, // Control field order
    
    // Search indexing
    indexingType: {}, // Customize search indexing
    
    // Formatting
    format: 'email' // Hint for input formatting
  }
}
```

## Composition Behaviors

For component content types, specify how they can be used:

```typescript
export const FlexibleComponentContentType = contentType({
  key: 'FlexibleComponent',
  baseType: '_component',
  compositionBehaviors: [
    'sectionEnabled', // Can be used in page sections
    'elementEnabled'  // Can be used as page elements
  ],
  properties: {
    // ...
  }
});
```

Available composition behaviors:
- `sectionEnabled`: Component can be used in page sections
- `elementEnabled`: Component can be used as page elements

## Advanced Content Type Examples

### E-commerce Product

```typescript
export const ProductContentType = contentType({
  key: 'Product',
  displayName: 'Product',
  baseType: '_page',
  properties: {
    // Basic information
    name: {
      type: 'string',
      required: true,
      displayName: 'Product Name',
      maxLength: 100,
      group: 'Basic'
    },
    
    sku: {
      type: 'string',
      required: true,
      displayName: 'SKU',
      description: 'Stock Keeping Unit',
      group: 'Basic'
    },
    
    description: {
      type: 'richText',
      displayName: 'Description',
      group: 'Basic'
    },
    
    // Pricing
    price: {
      type: 'float',
      required: true,
      displayName: 'Price',
      minimum: 0,
      group: 'Pricing'
    },
    
    salePrice: {
      type: 'float',
      displayName: 'Sale Price',
      minimum: 0,
      group: 'Pricing'
    },
    
    // Inventory
    inStock: {
      type: 'boolean',
      displayName: 'In Stock',
      group: 'Inventory'
    },
    
    stockQuantity: {
      type: 'integer',
      displayName: 'Stock Quantity',
      minimum: 0,
      group: 'Inventory'
    },
    
    // Media
    images: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['_image']
      },
      displayName: 'Product Images',
      group: 'Media'
    },
    
    // Categorization
    category: {
      type: 'contentReference',
      allowedTypes: ['Category'],
      displayName: 'Primary Category',
      group: 'Categorization'
    },
    
    tags: {
      type: 'array',
      items: { type: 'string' },
      displayName: 'Tags',
      group: 'Categorization'
    },
    
    // Specifications
    specifications: {
      type: 'json',
      displayName: 'Specifications',
      description: 'Product specifications as key-value pairs',
      group: 'Details'
    },
    
    // Related content
    relatedProducts: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Product']
      },
      displayName: 'Related Products',
      group: 'Relations'
    }
  }
});
```

### Blog Post with Author

```typescript
export const BlogPostContentType = contentType({
  key: 'BlogPost',
  displayName: 'Blog Post',
  baseType: '_page',
  properties: {
    // Content
    title: {
      type: 'string',
      required: true,
      displayName: 'Title',
      maxLength: 120,
      group: 'Content'
    },
    
    excerpt: {
      type: 'string',
      displayName: 'Excerpt',
      maxLength: 300,
      description: 'Brief summary for listings',
      group: 'Content'
    },
    
    content: {
      type: 'richText',
      required: true,
      displayName: 'Content',
      group: 'Content'
    },
    
    // Publishing
    publishDate: {
      type: 'dateTime',
      required: true,
      displayName: 'Publish Date',
      group: 'Publishing'
    },
    
    featured: {
      type: 'boolean',
      displayName: 'Featured Post',
      group: 'Publishing'
    },
    
    status: {
      type: 'string',
      required: true,
      displayName: 'Status',
      enum: [
        { value: 'draft', displayName: 'Draft' },
        { value: 'published', displayName: 'Published' },
        { value: 'archived', displayName: 'Archived' }
      ],
      group: 'Publishing'
    },
    
    // Author information
    author: {
      type: 'contentReference',
      allowedTypes: ['Author'],
      displayName: 'Author',
      group: 'Author'
    },
    
    // Media
    featuredImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Featured Image',
      group: 'Media'
    },
    
    // SEO
    metaTitle: {
      type: 'string',
      displayName: 'Meta Title',
      maxLength: 60,
      group: 'SEO'
    },
    
    metaDescription: {
      type: 'string',
      displayName: 'Meta Description',
      maxLength: 160,
      group: 'SEO'
    },
    
    // Categorization
    categories: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Category']
      },
      displayName: 'Categories',
      group: 'Categorization'
    },
    
    tags: {
      type: 'array',
      items: { type: 'string' },
      displayName: 'Tags',
      group: 'Categorization'
    }
  }
});
```

### Flexible Page Component

```typescript
export const FlexibleSectionContentType = contentType({
  key: 'FlexibleSection',
  displayName: 'Flexible Section',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Section Heading',
      group: 'Content'
    },
    
    content: {
      type: 'richText',
      displayName: 'Content',
      group: 'Content'
    },
    
    layout: {
      type: 'string',
      required: true,
      displayName: 'Layout',
      enum: [
        { value: 'full-width', displayName: 'Full Width' },
        { value: 'contained', displayName: 'Contained' },
        { value: 'split', displayName: 'Split Layout' }
      ],
      group: 'Layout'
    },
    
    backgroundColor: {
      type: 'string',
      displayName: 'Background Color',
      enum: [
        { value: 'white', displayName: 'White' },
        { value: 'gray', displayName: 'Gray' },
        { value: 'blue', displayName: 'Blue' },
        { value: 'dark', displayName: 'Dark' }
      ],
      group: 'Styling'
    },
    
    components: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Hero', 'CallToAction', 'ImageGallery']
      },
      displayName: 'Section Components',
      group: 'Components'
    }
  }
});
```

## Type Inference

The SDK provides automatic TypeScript type inference:

```typescript
import { Infer } from '@episerver/cms-sdk';
import type { BlogPostContentType } from './BlogPost';

// Automatically inferred type
type BlogPostData = Infer<typeof BlogPostContentType>;

// Usage in React components
function BlogPost({ opti }: { opti: BlogPostData }) {
  // opti.title is string
  // opti.publishDate is string (ISO date)
  // opti.featured is boolean
  // opti.categories is Array<{ title: string, url: string, ... }>
  // etc.
}
```

## Content Type Registry

Register your content types for automatic discovery:

```typescript
// src/content-types/index.ts
import { initContentTypeRegistry } from '@episerver/cms-sdk';
import { BlogPostContentType } from './BlogPost';
import { ProductContentType } from './Product';
import { AuthorContentType } from './Author';

// Initialize the registry
initContentTypeRegistry([
  BlogPostContentType,
  ProductContentType,
  AuthorContentType
]);
```

## Validation and Error Handling

The SDK provides runtime validation:

```typescript
import { isContentType } from '@episerver/cms-sdk';

// Type checking
if (isContentType(someObject)) {
  // someObject is a valid content type
}

// Property validation is handled automatically
// when content is fetched from the CMS
```

## Best Practices

### 1. Organize Content Types

```typescript
// Group related content types
src/
  content-types/
    blog/
      BlogPost.ts
      Author.ts
      Category.ts
    product/
      Product.ts
      Category.ts
      Review.ts
    components/
      Hero.ts
      CallToAction.ts
      Gallery.ts
```

### 2. Use Consistent Naming

```typescript
// Use descriptive, consistent keys
export const ArticleContentType = contentType({
  key: 'Article', // PascalCase, matches filename
  displayName: 'Article', // Human-readable
  // ...
});
```

### 3. Group Properties Logically

```typescript
{
  title: { type: 'string', group: 'Content' },
  excerpt: { type: 'string', group: 'Content' },
  publishDate: { type: 'dateTime', group: 'Publishing' },
  author: { type: 'contentReference', group: 'Metadata' }
}
```

### 4. Provide Helpful Descriptions

```typescript
{
  maxAttendees: {
    type: 'integer',
    displayName: 'Maximum Attendees',
    description: 'Leave empty for unlimited attendance',
    minimum: 1
  }
}
```

### 5. Use Type Constraints

```typescript
{
  // Be specific about allowed types
  speaker: {
    type: 'contentReference',
    allowedTypes: ['Person', 'Speaker'], // Only these types
    displayName: 'Event Speaker'
  },
  
  // Or use restrictions for broad exclusions
  relatedContent: {
    type: 'contentReference',
    restrictedTypes: ['_folder'], // Everything except folders
    displayName: 'Related Content'
  }
}
```

## Next Steps

- **[GraphQL Integration](./graphql-integration.md)** - Learn how to query your content types
- **[React Integration](./react-integration.md)** - Build components for your content types
- **[API Reference](./api-reference.md)** - Explore the complete API

---

*Content types are the foundation of your CMS application. Take time to design them well - they'll save you time and provide better developer experience throughout your project.*