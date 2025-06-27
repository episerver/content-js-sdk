# Advanced Usage

This guide covers advanced patterns, performance optimization, troubleshooting, and best practices for the Optimizely CMS SDK.

## Performance Optimization

### Query Optimization

#### Fragment Management

The SDK automatically generates GraphQL fragments to optimize queries. Monitor fragment complexity:

```typescript
// Set fragment threshold to catch complex queries early
process.env.MAX_FRAGMENT_THRESHOLD = '75';

// The SDK will warn when queries become too complex
// Example warning: "Fragment complexity (85) exceeds threshold (75)"
```

#### Query Depth Control

Control query depth to prevent performance issues:

```typescript
// Content type with circular references
export const CategoryContentType = contentType({
  key: 'Category',
  properties: {
    name: { type: 'string' },
    parentCategory: {
      type: 'contentReference',
      allowedTypes: ['Category'] // Circular reference
    },
    childCategories: {
      type: 'array',
      items: {
        type: 'contentReference',
        allowedTypes: ['Category'] // Circular reference
      }
    }
  }
});

// The SDK automatically prevents infinite recursion
// by limiting fragment depth and warning about circular references
```

#### Selective Property Loading

Use targeted content types for specific use cases:

```typescript
// Full article content type
export const ArticleContentType = contentType({
  key: 'Article',
  properties: {
    title: { type: 'string' },
    content: { type: 'richText' },
    author: { type: 'contentReference', allowedTypes: ['Author'] },
    // ... many more properties
  }
});

// Lightweight version for listings
export const ArticleListItemContentType = contentType({
  key: 'ArticleListItem',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    publishDate: { type: 'dateTime' },
    featuredImage: { type: 'contentReference', allowedTypes: ['_image'] }
  }
});
```

### Caching Strategies

#### Server-Side Caching (Next.js)

```typescript
// Static generation with revalidation
export async function generateStaticParams() {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  
  // Fetch all article paths at build time
  const query = `
    query GetAllArticlePaths {
      _Content(where: { _metadata: { types: { in: ["Article"] } } }) {
        items {
          _metadata {
            url { default }
          }
        }
      }
    }
  `;
  
  const result = await client.request(query);
  
  return result._Content.items.map((item: any) => ({
    slug: item._metadata.url.default.split('/').filter(Boolean)
  }));
}

// Page with revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function ArticlePage({ params }: { params: { slug: string[] } }) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  const content = await client.fetchContent(`/${params.slug.join('/')}/`);
  
  return <OptimizelyComponent opti={content} />;
}
```

#### Client-Side Caching

```typescript
// React Query integration
import { useQuery } from '@tanstack/react-query';
import { GraphClient } from '@episerver/cms-sdk';

function useOptimizelyContent(path: string) {
  return useQuery({
    queryKey: ['optimizely-content', path],
    queryFn: async () => {
      const client = new GraphClient(process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_KEY!);
      return client.fetchContent(path);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// SWR integration
import useSWR from 'swr';

function useOptimizelyContentSWR(path: string) {
  return useSWR(
    ['optimizely-content', path],
    async ([, path]) => {
      const client = new GraphClient(process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_KEY!);
      return client.fetchContent(path);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );
}
```

#### Custom Caching Layer

```typescript
class CachedGraphClient extends GraphClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async fetchContent(path: string): Promise<any> {
    const cacheKey = `content:${path}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const content = await super.fetchContent(path);
    
    this.cache.set(cacheKey, {
      data: content,
      timestamp: Date.now()
    });
    
    return content;
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  evictCache(path: string) {
    this.cache.delete(`content:${path}`);
  }
}

export const cachedClient = new CachedGraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
```

### Component Optimization

#### Component Memoization

```typescript
import { memo } from 'react';

// Memoize content components
const Article = memo(function Article({ opti }: ArticleProps) {
  const { pa, src } = getPreviewUtils(opti);
  
  return (
    <article>
      <h1 {...pa('title')}>{opti.title}</h1>
      <div {...pa('content')} dangerouslySetInnerHTML={{ __html: opti.content }} />
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if content actually changed
  return (
    prevProps.opti._metadata.key === nextProps.opti._metadata.key &&
    prevProps.opti._metadata.version === nextProps.opti._metadata.version
  );
});
```

#### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const VideoPlayer = lazy(() => import('./VideoPlayer'));
const ImageGallery = lazy(() => import('./ImageGallery'));
const InteractiveChart = lazy(() => import('./InteractiveChart'));

initReactComponentRegistry({
  resolver: (contentType: string) => {
    const components = {
      // Standard components load immediately
      'Article': Article,
      'Product': Product,
      
      // Heavy components load on demand
      'VideoContent': (props: any) => (
        <Suspense fallback={<div className="loading-placeholder">Loading video...</div>}>
          <VideoPlayer {...props} />
        </Suspense>
      ),
      
      'Gallery': (props: any) => (
        <Suspense fallback={<div className="loading-placeholder">Loading gallery...</div>}>
          <ImageGallery {...props} />
        </Suspense>
      ),
      
      'Chart': (props: any) => (
        <Suspense fallback={<div className="loading-placeholder">Loading chart...</div>}>
          <InteractiveChart {...props} />
        </Suspense>
      ),
    };
    
    return components[contentType] || null;
  }
});
```

## Advanced Content Patterns

### Multi-Type Content Handling

```typescript
// Union type for pages that can have multiple content types
type PageContent = 
  | Infer<typeof ArticleContentType>
  | Infer<typeof ProductContentType>
  | Infer<typeof EventContentType>;

function UniversalPage({ content }: { content: PageContent }) {
  // Type-safe content handling
  switch (content.__typename) {
    case 'Article':
      return <Article opti={content} />;
    case 'Product':
      return <Product opti={content} />;
    case 'Event':
      return <Event opti={content} />;
    default:
      return <OptimizelyComponent opti={content} />;
  }
}
```

### Dynamic Content Loading

```typescript
async function loadContentByType(contentType: string, filters: any = {}) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  
  const query = `
    query GetContentByType($filter: _ContentWhereInput) {
      _Content(where: $filter) {
        items {
          _metadata {
            key
            types
            url { default }
          }
          
          # Dynamic fields based on content type
          ${generateFieldsForContentType(contentType)}
        }
      }
    }
  `;
  
  const filter = {
    _metadata: {
      types: { in: [contentType] }
    },
    ...filters
  };
  
  return client.request(query, { filter });
}

function generateFieldsForContentType(contentType: string): string {
  const contentTypeDefinition = getContentType(contentType);
  
  if (!contentTypeDefinition) {
    return 'title'; // Fallback
  }
  
  // Generate GraphQL fields based on content type properties
  return Object.keys(contentTypeDefinition.properties || {})
    .map(key => {
      const property = contentTypeDefinition.properties![key];
      return generateGraphQLField(key, property);
    })
    .join('\n');
}
```

### Search and Filtering

```typescript
class ContentSearchService {
  private client: GraphClient;
  
  constructor(client: GraphClient) {
    this.client = client;
  }
  
  async searchContent(options: {
    query?: string;
    contentTypes?: string[];
    dateRange?: { start: string; end: string };
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const filters: any[] = [];
    
    // Full-text search
    if (options.query) {
      filters.push({
        _fulltext: { contains: options.query }
      });
    }
    
    // Content type filter
    if (options.contentTypes?.length) {
      filters.push({
        _metadata: {
          types: { in: options.contentTypes }
        }
      });
    }
    
    // Date range filter
    if (options.dateRange) {
      filters.push({
        publishDate: {
          gte: options.dateRange.start,
          lte: options.dateRange.end
        }
      });
    }
    
    // Tag filter
    if (options.tags?.length) {
      filters.push({
        tags: { in: options.tags }
      });
    }
    
    const query = `
      query SearchContent($filter: _ContentWhereInput, $limit: Int, $skip: Int) {
        _Content(where: $filter, limit: $limit, skip: $skip) {
          items {
            _metadata {
              key
              types
              url { default }
            }
            title
            excerpt
            publishDate
            tags
            _score
          }
          total
        }
      }
    `;
    
    const filter = filters.length > 1 ? { _and: filters } : filters[0] || {};
    
    return this.client.request(query, {
      filter,
      limit: options.limit || 20,
      skip: options.offset || 0
    });
  }
  
  async getRelatedContent(contentKey: string, contentType: string, limit = 5) {
    const query = `
      query GetRelatedContent($filter: _ContentWhereInput, $limit: Int) {
        _Content(where: $filter, limit: $limit) {
          items {
            _metadata {
              key
              types
              url { default }
            }
            title
            excerpt
            publishDate
          }
        }
      }
    `;
    
    const filter = {
      _and: [
        {
          _metadata: {
            types: { in: [contentType] }
          }
        },
        {
          _metadata: {
            key: { neq: contentKey }
          }
        }
      ]
    };
    
    return this.client.request(query, { filter, limit });
  }
}

// Usage
const searchService = new ContentSearchService(client);

const results = await searchService.searchContent({
  query: 'typescript',
  contentTypes: ['Article', 'Tutorial'],
  dateRange: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-12-31T23:59:59Z'
  },
  tags: ['programming', 'web-development'],
  limit: 10
});
```

## Error Handling and Resilience

### Comprehensive Error Handling

```typescript
import { GraphClient } from '@episerver/cms-sdk';

class ResilientGraphClient extends GraphClient {
  private retryCount = 3;
  private retryDelay = 1000;
  
  async fetchContent(path: string): Promise<any> {
    return this.withRetry(() => super.fetchContent(path));
  }
  
  async fetchPreviewContent(params: PreviewParams): Promise<any> {
    return this.withRetry(() => super.fetchPreviewContent(params));
  }
  
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryCount) {
          throw this.createDetailedError(lastError);
        }
        
        if (this.shouldRetry(error)) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        throw this.createDetailedError(lastError);
      }
    }
    
    throw lastError!;
  }
  
  private shouldRetry(error: any): boolean {
    // Retry on network errors, but not on 404s or content errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT_ERROR' ||
      (error.status >= 500 && error.status < 600)
    );
  }
  
  private createDetailedError(error: Error): Error {
    if (error.message.includes('No content found')) {
      return new ContentNotFoundError(error.message);
    }
    
    if (error.message.includes('validation')) {
      return new ContentValidationError(error.message);
    }
    
    if (error.message.includes('unauthorized')) {
      return new AuthenticationError('Invalid or expired credentials');
    }
    
    return error;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Custom error classes
class ContentNotFoundError extends Error {
  name = 'ContentNotFoundError';
}

class ContentValidationError extends Error {
  name = 'ContentValidationError';
}

class AuthenticationError extends Error {
  name = 'AuthenticationError';
}
```

### Error Boundaries with Fallbacks

```typescript
import React from 'react';

interface ContentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ContentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ContentErrorBoundary extends React.Component<
  ContentErrorBoundaryProps,
  ContentErrorBoundaryState
> {
  constructor(props: ContentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ContentErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString()
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    
    // Log to external service
    console.error('Content Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });
  }
  
  retry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: ''
    });
  };
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultContentErrorFallback;
      return <Fallback error={this.state.error!} retry={this.retry} />;
    }
    
    return this.props.children;
  }
}

function DefaultContentErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="content-error">
      <h2>Content Error</h2>
      <p>There was an error loading this content.</p>
      
      {error instanceof ContentNotFoundError && (
        <p>The requested content could not be found.</p>
      )}
      
      {error instanceof AuthenticationError && (
        <p>Authentication failed. Please check your credentials.</p>
      )}
      
      <button onClick={retry} className="retry-button">
        Try Again
      </button>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>Error Details</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  );
}

// Usage
<ContentErrorBoundary
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => {
    // Send to monitoring service
    analytics.track('Content Error', {
      error: error.message,
      component: errorInfo.componentStack
    });
  }}
>
  <OptimizelyComponent opti={content} />
</ContentErrorBoundary>
```

## Testing Strategies

### Unit Testing Content Components

```typescript
// __tests__/Article.test.tsx
import { render, screen } from '@testing-library/react';
import Article from '../Article';
import { createMockContent } from '../__mocks__/content';

describe('Article Component', () => {
  it('renders article content correctly', () => {
    const mockArticle = createMockContent('Article', {
      title: 'Test Article',
      content: '<p>Test content</p>',
      publishDate: '2024-01-01T00:00:00Z'
    });
    
    render(<Article opti={mockArticle} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Article');
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('handles missing optional content gracefully', () => {
    const minimalArticle = createMockContent('Article', {
      title: 'Minimal Article'
    });
    
    render(<Article opti={minimalArticle} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Article');
    expect(screen.queryByTestId('article-author')).not.toBeInTheDocument();
  });
  
  it('applies preview attributes in edit mode', () => {
    const articleInEditMode = createMockContent('Article', {
      title: 'Editable Article',
      __context: { edit: true, preview_token: 'test-token' }
    });
    
    render(<Article opti={articleInEditMode} />);
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveAttribute('data-epi-property-name', 'title');
  });
});
```

### Integration Testing

```typescript
// __tests__/content-integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import '../lib/optimizely'; // Initialize registry

// Mock the GraphClient
jest.mock('@episerver/cms-sdk', () => ({
  ...jest.requireActual('@episerver/cms-sdk'),
  GraphClient: jest.fn()
}));

const MockedGraphClient = GraphClient as jest.MockedClass<typeof GraphClient>;

describe('Content Integration', () => {
  beforeEach(() => {
    MockedGraphClient.mockClear();
  });
  
  it('fetches and renders content correctly', async () => {
    const mockContent = {
      __typename: 'Article',
      _metadata: {
        key: 'test-article',
        url: { default: '/test-article' },
        types: ['Article']
      },
      title: 'Test Article',
      content: '<p>Test content</p>'
    };
    
    const mockClient = {
      fetchContent: jest.fn().mockResolvedValue(mockContent)
    };
    
    MockedGraphClient.mockImplementation(() => mockClient as any);
    
    const client = new GraphClient('test-key');
    const content = await client.fetchContent('/test-article/');
    
    render(<OptimizelyComponent opti={content} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument();
    });
  });
  
  it('handles content fetch errors gracefully', async () => {
    const mockClient = {
      fetchContent: jest.fn().mockRejectedValue(new Error('Content not found'))
    };
    
    MockedGraphClient.mockImplementation(() => mockClient as any);
    
    const client = new GraphClient('test-key');
    
    await expect(client.fetchContent('/nonexistent/')).rejects.toThrow('Content not found');
  });
});
```

### Mock Utilities

```typescript
// __mocks__/content.ts
import type { Infer } from '@episerver/cms-sdk';

export function createMockContent<T>(
  contentType: string,
  overrides: Partial<T> = {}
): T & { __typename: string; _metadata: any } {
  const baseContent = {
    __typename: contentType,
    _metadata: {
      key: `mock-${contentType.toLowerCase()}-${Date.now()}`,
      url: { default: `/mock-${contentType.toLowerCase()}/` },
      types: [contentType]
    }
  };
  
  return { ...baseContent, ...overrides } as T & typeof baseContent;
}

export function createMockArticle(overrides = {}) {
  return createMockContent('Article', {
    title: 'Mock Article',
    content: '<p>Mock content</p>',
    publishDate: '2024-01-01T00:00:00Z',
    featured: false,
    tags: ['mock', 'test'],
    ...overrides
  });
}

export function createMockAuthor(overrides = {}) {
  return createMockContent('Author', {
    name: 'Mock Author',
    bio: '<p>Mock author bio</p>',
    email: 'mock@example.com',
    ...overrides
  });
}
```

### End-to-End Testing

```typescript
// e2e/content-rendering.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Content Rendering', () => {
  test('renders article page correctly', async ({ page }) => {
    await page.goto('/articles/test-article');
    
    // Check main content
    await expect(page.locator('h1')).toContainText('Test Article');
    await expect(page.locator('article')).toBeVisible();
    
    // Check metadata
    await expect(page.locator('time')).toBeVisible();
    
    // Check author section
    await expect(page.locator('[data-testid="article-author"]')).toBeVisible();
  });
  
  test('handles 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/articles/nonexistent-article');
    expect(response?.status()).toBe(404);
    
    await expect(page.locator('h1')).toContainText('Content not found');
  });
  
  test('works in preview mode', async ({ page }) => {
    // Simulate preview mode with query parameters
    await page.goto('/articles/test-article?preview_token=test&ctx=edit');
    
    // Check for edit attributes
    const title = page.locator('h1');
    await expect(title).toHaveAttribute('data-epi-property-name', 'title');
  });
});
```

## Monitoring and Analytics

### Performance Monitoring

```typescript
class MonitoredGraphClient extends GraphClient {
  async fetchContent(path: string): Promise<any> {
    const start = performance.now();
    const startTime = Date.now();
    
    try {
      const content = await super.fetchContent(path);
      const duration = performance.now() - start;
      
      // Log successful requests
      this.logMetric('content_fetch_success', {
        path,
        duration,
        contentType: content.__typename,
        timestamp: startTime
      });
      
      return content;
    } catch (error) {
      const duration = performance.now() - start;
      
      // Log failed requests
      this.logMetric('content_fetch_error', {
        path,
        duration,
        error: error.message,
        timestamp: startTime
      });
      
      throw error;
    }
  }
  
  private logMetric(eventName: string, data: any) {
    // Send to your analytics/monitoring service
    if (typeof window !== 'undefined') {
      // Client-side analytics
      window.gtag?.('event', eventName, data);
    } else {
      // Server-side monitoring
      console.log(`[Optimizely Metric] ${eventName}:`, data);
    }
  }
}
```

### Error Tracking

```typescript
class TrackedGraphClient extends GraphClient {
  async request(query: string, variables: any, previewToken?: string): Promise<any> {
    try {
      return await super.request(query, variables, previewToken);
    } catch (error) {
      // Track GraphQL errors
      this.trackError(error, {
        query: query.substring(0, 200) + '...', // Truncate for privacy
        variables: JSON.stringify(variables),
        hasPreviewToken: !!previewToken
      });
      
      throw error;
    }
  }
  
  private trackError(error: any, context: any) {
    // Send to error tracking service (Sentry, Bugsnag, etc.)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { service: 'optimizely-cms-sdk' },
        extra: context
      });
    }
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Content Not Loading

**Symptoms**: Content appears as "Loading..." or empty

**Solutions**:
1. **Check Graph Single Key**:
   ```bash
   # Verify your key is set correctly
   echo $OPTIMIZELY_GRAPH_SINGLE_KEY
   ```

2. **Verify Content Path**:
   ```typescript
   // Test with exact CMS URL
   const content = await client.fetchContent('/exact-path-from-cms/');
   ```

3. **Check Content Publishing Status**:
   - Ensure content is published in CMS
   - Check content language matches request

#### Component Not Rendering

**Symptoms**: "No component found for content type" message

**Solutions**:
1. **Verify Component Registration**:
   ```typescript
   // Check component is registered with exact content type key
   initReactComponentRegistry({
     resolver: (contentType) => {
       console.log('Resolving:', contentType); // Debug output
       return componentMap[contentType] || null;
     }
   });
   ```

2. **Check Content Type Key**:
   ```typescript
   // Ensure content type key matches exactly
   export const ArticleContentType = contentType({
     key: 'Article', // Must match exactly
     // ...
   });
   ```

3. **Import Component Correctly**:
   ```typescript
   // Ensure default export
   export default function Article({ opti }) {
     return <div>...</div>;
   }
   ```

#### Type Errors

**Symptoms**: TypeScript compilation errors

**Solutions**:
1. **Update Type Definitions**:
   ```typescript
   // Regenerate types after content type changes
   type ArticleData = Infer<typeof ArticleContentType>;
   ```

2. **Check Property Types**:
   ```typescript
   // Ensure property types match actual content
   {
     publishDate: { type: 'dateTime' }, // Returns string
     featured: { type: 'boolean' }      // Returns boolean
   }
   ```

#### Performance Issues

**Symptoms**: Slow page loads, GraphQL timeouts

**Solutions**:
1. **Reduce Fragment Complexity**:
   ```bash
   # Lower threshold to catch issues early
   MAX_FRAGMENT_THRESHOLD=50
   ```

2. **Optimize Content Types**:
   ```typescript
   // Avoid deep nesting and circular references
   export const OptimizedContentType = contentType({
     properties: {
       // Prefer specific allowedTypes over broad references
       author: {
         type: 'contentReference',
         allowedTypes: ['Author'] // Specific
       }
     }
   });
   ```

3. **Implement Caching**:
   ```typescript
   // Add appropriate caching for your use case
   export const revalidate = 3600; // Next.js
   ```

#### Preview Mode Issues

**Symptoms**: Preview not working, edit attributes missing

**Solutions**:
1. **Add Preview Component**:
   ```typescript
   // Ensure PreviewComponent is in your layout
   import { PreviewComponent } from '@episerver/cms-sdk/react/client';
   
   export default function Layout({ children }) {
     return (
       <html>
         <body>
           {children}
           <PreviewComponent /> {/* Required for preview */}
         </body>
       </html>
     );
   }
   ```

2. **Use Preview Utilities**:
   ```typescript
   // Apply preview attributes correctly
   const { pa, src } = getPreviewUtils(opti);
   
   return (
     <div>
       <h1 {...pa('title')}>{opti.title}</h1>
       <img src={src(opti.image.url.default)} />
     </div>
   );
   ```

### Debug Mode

Enable comprehensive debugging:

```typescript
// Enable debug mode
process.env.OPTIMIZELY_DEBUG = 'true';

// Custom debug logger
function debug(message: string, data?: any) {
  if (process.env.OPTIMIZELY_DEBUG === 'true') {
    console.log(`[Optimizely Debug] ${message}`, data);
  }
}

// Use in components
export default function Article({ opti }) {
  debug('Rendering Article', {
    contentType: opti.__typename,
    key: opti._metadata.key,
    hasContent: !!opti.content,
    isEditMode: opti.__context?.edit
  });
  
  return <article>...</article>;
}
```

### Network Debugging

```typescript
// Network request interceptor
class DebuggingGraphClient extends GraphClient {
  async request(query: string, variables: any, previewToken?: string): Promise<any> {
    console.log('🚀 GraphQL Request:', {
      query: query.substring(0, 200) + '...',
      variables,
      hasPreviewToken: !!previewToken,
      timestamp: new Date().toISOString()
    });
    
    const start = performance.now();
    
    try {
      const result = await super.request(query, variables, previewToken);
      const duration = performance.now() - start;
      
      console.log('✅ GraphQL Response:', {
        duration: `${duration.toFixed(2)}ms`,
        hasData: !!result,
        dataKeys: result ? Object.keys(result) : []
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      console.error('❌ GraphQL Error:', {
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
}
```

## Best Practices Summary

1. **Performance**: Use caching, optimize content types, monitor fragment complexity
2. **Error Handling**: Implement comprehensive error boundaries and retry logic
3. **Testing**: Write unit tests for components, integration tests for content flow
4. **Monitoring**: Track performance metrics and errors in production
5. **Debugging**: Use debug mode and logging for development troubleshooting
6. **Type Safety**: Leverage TypeScript and SDK type inference fully
7. **Caching**: Implement appropriate caching strategies for your deployment
8. **Components**: Use memoization and lazy loading for optimal performance

---

*Advanced usage patterns help you build production-ready applications with optimal performance, robust error handling, and maintainable code. Start with the basics and gradually adopt these advanced patterns as your application grows.*