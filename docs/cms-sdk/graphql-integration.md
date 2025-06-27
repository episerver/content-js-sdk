# GraphQL Integration

The Optimizely CMS SDK provides seamless GraphQL integration with automatic query generation, type-safe content fetching, and optimized performance. You don't need to write GraphQL queries manually - the SDK generates them based on your content types.

## Overview

The SDK's GraphQL integration includes:
- **Automatic Query Generation**: Queries built from content type definitions
- **Type Safety**: Full TypeScript support with inferred types
- **Performance Optimization**: Intelligent fragment generation and caching
- **Preview Support**: Built-in preview and edit mode handling
- **Flexible Filtering**: Path-based and parameter-based content fetching

## GraphClient Setup

### Basic Configuration

```typescript
import { GraphClient } from '@episerver/cms-sdk';

// Basic setup
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);

// With custom configuration
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_URL || 'https://cg.optimizely.com/content/v2'
});
```

### Environment Variables

```bash
# Required: Your Graph Single Key
OPTIMIZELY_GRAPH_SINGLE_KEY=your_key_here

# Optional: Custom Graph URL
OPTIMIZELY_GRAPH_URL=https://cg.optimizely.com/content/v2

# Optional: Fragment performance threshold
MAX_FRAGMENT_THRESHOLD=100
```

## Content Fetching

### Fetch by Path

The most common way to fetch content:

```typescript
// Fetch content by URL path
const content = await client.fetchContent('/articles/my-article/');

// The SDK automatically:
// 1. Determines the content type
// 2. Generates the appropriate GraphQL query
// 3. Fetches all required fields
// 4. Returns typed content
```

### Fetch with Preview Parameters

For CMS preview mode:

```typescript
import type { PreviewParams } from '@episerver/cms-sdk';

const previewParams: PreviewParams = {
  preview_token: 'token_from_cms',
  key: 'content_key',
  ctx: 'edit', // 'edit' or 'preview'
  ver: 'version_number',
  loc: 'en'
};

const content = await client.fetchPreviewContent(previewParams);
```

### Custom Queries

For advanced scenarios, you can execute custom queries:

```typescript
// Custom GraphQL query
const query = `
  query GetArticles($filter: _ContentWhereInput) {
    _Content(where: $filter) {
      items {
        _metadata {
          key
          url {
            default
          }
          types
        }
        title
        publishDate
      }
    }
  }
`;

const variables = {
  filter: {
    _metadata: {
      types: { in: ['Article'] }
    }
  }
};

const result = await client.request(query, variables);
```

## Automatic Query Generation

The SDK automatically generates optimized GraphQL queries based on your content types.

### How It Works

Given this content type:

```typescript
export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
    content: { type: 'richText' },
    author: {
      type: 'contentReference',
      allowedTypes: ['Author']
    },
    categories: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Category']
      }
    }
  }
});
```

The SDK generates this GraphQL query:

```graphql
query FetchArticle($filter: _ContentWhereInput) {
  _Content(where: $filter) {
    item {
      _metadata {
        key
        version
        types
        url {
          default
        }
      }
      title
      content
      author {
        _metadata {
          key
          types
          url {
            default
          }
        }
        name
        bio
        # ... other Author fields
      }
      categories {
        _metadata {
          key
          types
          url {
            default
          }
        }
        name
        description
        # ... other Category fields
      }
    }
  }
}
```

### Query Optimization

The SDK includes several optimizations:

1. **Fragment Reuse**: Common field patterns are extracted into reusable fragments
2. **Depth Limiting**: Prevents infinite recursion in circular references
3. **Conditional Fields**: Only fetches fields that exist in the content type
4. **Performance Monitoring**: Warns about complex queries that might impact performance

## Filtering and Querying

### Path-Based Filtering

```typescript
import { getFilterFromPath } from '@episerver/cms-sdk';

// Create filter from URL path
const filter = getFilterFromPath('/blog/my-article/');

// Use with custom queries
const result = await client.request(query, { filter });
```

### Preview Parameter Filtering

```typescript
import { getFilterFromPreviewParams } from '@episerver/cms-sdk';

const filter = getFilterFromPreviewParams(previewParams);
const result = await client.request(query, { filter });
```

### Custom Filtering

Build complex filters for advanced queries:

```typescript
// Filter by content type
const articlesFilter = {
  _metadata: {
    types: { in: ['Article'] }
  }
};

// Filter by date range
const recentArticlesFilter = {
  _metadata: {
    types: { in: ['Article'] }
  },
  publishDate: {
    gte: '2024-01-01T00:00:00Z'
  }
};

// Filter by path pattern
const blogFilter = {
  _metadata: {
    url: {
      default: { startsWith: '/blog/' }
    }
  }
};

// Complex filter with multiple conditions
const complexFilter = {
  _and: [
    {
      _metadata: {
        types: { in: ['Article'] }
      }
    },
    {
      featured: { eq: true }
    },
    {
      publishDate: {
        lte: new Date().toISOString()
      }
    }
  ]
};
```

## Working with Different Content Types

### Fetching Lists

```typescript
// Fetch multiple articles
const query = `
  query GetArticles($filter: _ContentWhereInput, $limit: Int) {
    _Content(where: $filter, limit: $limit) {
      items {
        _metadata {
          key
          url { default }
          types
        }
        title
        excerpt
        publishDate
        featuredImage {
          url { default }
          alt
        }
      }
    }
  }
`;

const articles = await client.request(query, {
  filter: {
    _metadata: {
      types: { in: ['Article'] }
    }
  },
  limit: 10
});
```

### Fetching Related Content

```typescript
// The SDK automatically fetches related content
// when you have contentReference properties
const article = await client.fetchContent('/articles/my-article/');

// article.author will be fully populated
// article.categories will be an array of populated Category objects
// article.relatedArticles will be an array of populated Article objects
```

### Handling Media Content

```typescript
// Media references are automatically resolved
const content = await client.fetchContent('/products/my-product/');

// content.featuredImage will include:
// {
//   _metadata: { key, types, url },
//   url: { default: '...' },
//   alt: '...',
//   width: 1200,
//   height: 800,
//   // ... other image properties
// }
```

## Preview Mode Integration

### Understanding Preview Context

The SDK automatically handles preview mode:

```typescript
// In preview mode, content includes additional context
const previewContent = await client.fetchPreviewContent(previewParams);

// previewContent includes:
// {
//   ...contentData,
//   __context: {
//     edit: true, // true if in edit mode
//     preview_token: 'token_string'
//   }
// }
```

### Preview Token Handling

```typescript
// Preview tokens are automatically applied to media URLs
// when using the preview utilities (see React integration docs)

import { getPreviewUtils } from '@episerver/cms-sdk/react/server';

const { src } = getPreviewUtils(opti);

// Automatically appends preview token to image URLs
const imageUrl = src(opti.featuredImage.url.default);
```

## Performance Optimization

### Fragment Management

The SDK monitors query complexity and provides warnings:

```typescript
// Set custom fragment threshold
process.env.MAX_FRAGMENT_THRESHOLD = '50';

// The SDK will warn if queries become too complex
// and suggest optimizations
```

### Caching Strategies

```typescript
// Client-side caching (for client components)
const client = new GraphClient(key, {
  // Add custom caching logic here
});

// Server-side caching (Next.js example)
export async function getStaticProps() {
  const content = await client.fetchContent(path);
  
  return {
    props: { content },
    revalidate: 3600 // Cache for 1 hour
  };
}
```

### Query Optimization Tips

1. **Use Specific Content Types**: More specific types generate more efficient queries
2. **Limit Array Depths**: Deep nested arrays can impact performance
3. **Monitor Fragment Warnings**: The SDK will warn about complex queries
4. **Use Appropriate Caching**: Implement caching strategies for your use case

## Error Handling

### Network Errors

```typescript
try {
  const content = await client.fetchContent(path);
} catch (error) {
  if (error.message.includes('No content found')) {
    // Handle 404 case
    return { notFound: true };
  }
  
  // Handle other errors
  console.error('Failed to fetch content:', error);
  throw error;
}
```

### GraphQL Errors

```typescript
// Custom error handling with request method
const result = await client.request(query, variables);

if (result.errors) {
  console.error('GraphQL errors:', result.errors);
  // Handle specific GraphQL errors
}
```

### Validation Errors

```typescript
// Content type validation happens automatically
// Invalid content will throw descriptive errors
try {
  const content = await client.fetchContent(path);
} catch (error) {
  if (error.message.includes('validation')) {
    // Handle content validation errors
    console.error('Content validation failed:', error);
  }
}
```

## Advanced Usage Examples

### Multi-Type Content Fetching

```typescript
// Fetch content that could be multiple types
const query = `
  query GetPageContent($filter: _ContentWhereInput) {
    _Content(where: $filter) {
      item {
        _metadata {
          types
          key
          url { default }
        }
        
        # Common fields
        title
        
        # Type-specific fragments
        ... on Article {
          content
          publishDate
          author {
            name
          }
        }
        
        ... on Product {
          price
          description
          images {
            url { default }
            alt
          }
        }
      }
    }
  }
`;
```

### Pagination

```typescript
async function fetchArticlesPage(page: number, pageSize: number = 10) {
  const query = `
    query GetArticlesPage($filter: _ContentWhereInput, $limit: Int, $skip: Int) {
      _Content(where: $filter, limit: $limit, skip: $skip) {
        items {
          _metadata { key, url { default } }
          title
          excerpt
          publishDate
        }
        total
      }
    }
  `;
  
  return client.request(query, {
    filter: {
      _metadata: {
        types: { in: ['Article'] }
      }
    },
    limit: pageSize,
    skip: (page - 1) * pageSize
  });
}
```

### Search and Filtering

```typescript
async function searchContent(searchTerm: string, contentTypes: string[] = []) {
  const query = `
    query SearchContent($filter: _ContentWhereInput) {
      _Content(where: $filter) {
        items {
          _metadata { key, url { default }, types }
          title
          excerpt
          _score
        }
      }
    }
  `;
  
  const filter: any = {
    _fulltext: {
      contains: searchTerm
    }
  };
  
  if (contentTypes.length > 0) {
    filter._metadata = {
      types: { in: contentTypes }
    };
  }
  
  return client.request(query, { filter });
}
```

## Integration with React

### Server Components (Next.js App Router)

```typescript
// app/[...slug]/page.tsx
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';

export default async function Page({ params }: { params: { slug: string[] } }) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  const path = `/${params.slug.join('/')}/`;
  
  try {
    const content = await client.fetchContent(path);
    return <OptimizelyComponent opti={content} />;
  } catch (error) {
    return <div>Content not found</div>;
  }
}
```

### Client Components

```typescript
'use client';
import { useState, useEffect } from 'react';
import { GraphClient } from '@episerver/cms-sdk';

export function ClientContentLoader({ path }: { path: string }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const client = new GraphClient(process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_KEY!);
    
    client.fetchContent(path)
      .then(setContent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [path]);
  
  if (loading) return <div>Loading...</div>;
  if (!content) return <div>Content not found</div>;
  
  return <OptimizelyComponent opti={content} />;
}
```

## Troubleshooting

### Common Issues

**"No content found" errors**:
- Verify the path exists in CMS
- Check that content is published
- Ensure your Graph Single Key is correct

**Query timeout or performance issues**:
- Check for circular references in content types
- Reduce MAX_FRAGMENT_THRESHOLD if needed
- Monitor query complexity warnings

**Type errors with fetched content**:
- Ensure content types are properly registered
- Check that fetched content matches expected type
- Verify content type definitions are up to date

**Preview mode not working**:
- Verify preview tokens are valid
- Check that preview parameters are complete
- Ensure preview component is properly configured

For more troubleshooting, see the [Advanced Usage guide](./advanced-usage.md#troubleshooting).

## Next Steps

- **[React Integration](./react-integration.md)** - Learn how to render fetched content
- **[Configuration](./configuration.md)** - Optimize your GraphQL setup
- **[API Reference](./api-reference.md)** - Explore the complete GraphClient API

---

*The GraphQL integration handles the complexity of content fetching so you can focus on building great user experiences. The automatic query generation means you get optimized performance without writing GraphQL by hand.*