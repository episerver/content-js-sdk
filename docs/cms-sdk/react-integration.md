# React Integration

The Optimizely CMS SDK provides comprehensive React integration with server and client components, automatic component rendering, preview mode support, and type-safe development patterns.

## Overview

The React integration includes:
- **Server Components**: Optimized for Next.js App Router and server-side rendering
- **Client Components**: Interactive components with preview capabilities
- **Component Registry**: Automatic component resolution based on content types
- **Preview Utils**: Built-in support for CMS edit mode and preview tokens
- **Type Safety**: Full TypeScript support with automatic type inference

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your React App                           │
├─────────────────────────────────────────────────────────────┤
│  Page Component  │  Layout Component                        │
├─────────────────────────────────────────────────────────────┤
│              OptimizelyComponent                            │
├─────────────────────────────────────────────────────────────┤
│            Component Registry                               │
├─────────────────────────────────────────────────────────────┤
│  Article  │  Product  │  Hero  │  Gallery  │  ...          │
└─────────────────────────────────────────────────────────────┘
```

## Server Components

Server components provide optimal performance for content rendering.

### Setting Up Component Registry

```typescript
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

// Import your content components
import Article from '../components/Article';
import Product from '../components/Product';
import Hero from '../components/Hero';
import CallToAction from '../components/CallToAction';

// Initialize the component registry
initReactComponentRegistry({
  resolver: (contentType: string) => {
    const components = {
      'Article': Article,
      'Product': Product,
      'Hero': Hero,
      'CallToAction': CallToAction,
      // Add all your content type components here
    };
    
    return components[contentType] || null;
  }
});
```

### Using OptimizelyComponent

```typescript
// app/[...slug]/page.tsx
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import '../lib/optimizely'; // Initialize component registry

export default async function Page({ params }: { params: { slug: string[] } }) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  const path = `/${params.slug.join('/')}/`;
  
  try {
    const content = await client.fetchContent(path);
    
    // OptimizelyComponent automatically resolves and renders
    // the correct component based on content type
    return <OptimizelyComponent opti={content} />;
  } catch (error) {
    return (
      <div className="error">
        <h1>Content Not Found</h1>
        <p>The requested content could not be found.</p>
      </div>
    );
  }
}
```

### Creating Content Components

Content components receive typed content data:

```typescript
// src/components/Article.tsx
import React from 'react';
import { Infer, getPreviewUtils } from '@episerver/cms-sdk';
import type { ArticleContentType } from '../content-types/Article';

type ArticleProps = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: ArticleProps) {
  // Get preview utilities for edit mode support
  const { pa, src } = getPreviewUtils(opti);
  
  return (
    <article className="article">
      <header className="article-header">
        {/* Preview attributes enable in-place editing */}
        <h1 {...pa('title')} className="article-title">
          {opti.title}
        </h1>
        
        {opti.publishDate && (
          <time dateTime={opti.publishDate} className="article-date">
            {new Date(opti.publishDate).toLocaleDateString()}
          </time>
        )}
        
        {opti.excerpt && (
          <p {...pa('excerpt')} className="article-excerpt">
            {opti.excerpt}
          </p>
        )}
      </header>
      
      {/* Featured image with preview token support */}
      {opti.featuredImage?.url && (
        <div className="article-image">
          <img
            src={src(opti.featuredImage.url.default)}
            alt={opti.featuredImage.alt || opti.title}
            width={opti.featuredImage.width}
            height={opti.featuredImage.height}
          />
        </div>
      )}
      
      {/* Rich text content */}
      <div 
        {...pa('content')}
        className="article-content"
        dangerouslySetInnerHTML={{ __html: opti.content }} 
      />
      
      {/* Author information */}
      {opti.author && (
        <div {...pa('author')} className="article-author">
          <h3>About the Author</h3>
          <p>{opti.author.name}</p>
          {opti.author.bio && (
            <div dangerouslySetInnerHTML={{ __html: opti.author.bio }} />
          )}
        </div>
      )}
      
      {/* Categories */}
      {opti.categories && opti.categories.length > 0 && (
        <div className="article-categories">
          <h3>Categories</h3>
          <ul>
            {opti.categories.map((category, index) => (
              <li key={category._metadata.key}>
                <a href={category._metadata.url.default}>
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Tags */}
      {opti.tags && opti.tags.length > 0 && (
        <div className="article-tags">
          <h3>Tags</h3>
          <div className="tags">
            {opti.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
```

## Preview Utilities

The `getPreviewUtils` function provides essential tools for CMS integration:

### Property Attributes (`pa`)

Used for in-place editing in the CMS:

```typescript
const { pa } = getPreviewUtils(opti);

// For simple properties
<h1 {...pa('title')}>{opti.title}</h1>

// For rich text properties
<div {...pa('content')} dangerouslySetInnerHTML={{ __html: opti.content }} />

// For complex properties (references)
<div {...pa('author')}>
  {/* Author content */}
</div>

// For array items
{opti.articles?.map((article, index) => (
  <div key={article._metadata.key} {...pa({ key: article._metadata.key })}>
    {/* Article content */}
  </div>
))}
```

### Source URLs (`src`)

Automatically applies preview tokens to media URLs:

```typescript
const { src } = getPreviewUtils(opti);

// For images
<img src={src(opti.image.url.default)} alt={opti.image.alt} />

// For videos
<video src={src(opti.video.url.default)} controls />

// For documents
<a href={src(opti.document.url.default)}>Download PDF</a>
```

## Experience Components

For handling page experiences and compositions:

### OptimizelyExperience

Renders arrays of content with layout support:

```typescript
import { OptimizelyExperience } from '@episerver/cms-sdk/react/server';

export default function ExperiencePage({ opti }: { opti: any }) {
  return (
    <main>
      {/* Render experience nodes */}
      <OptimizelyExperience 
        nodes={opti.sections}
        ComponentWrapper={({ node, children }) => (
          <section className={`section-${node.component.__typename.toLowerCase()}`}>
            {children}
          </section>
        )}
      />
    </main>
  );
}
```

### OptimizelyGridSection

For grid-based layouts:

```typescript
import { OptimizelyGridSection } from '@episerver/cms-sdk/react/server';

export default function GridPage({ opti }: { opti: any }) {
  return (
    <OptimizelyGridSection
      nodes={opti.gridContent}
      row={({ node, children, index }) => (
        <div className={`row row-${index}`}>
          {children}
        </div>
      )}
      column={({ node, children, index }) => (
        <div className={`col col-${index}`}>
          {children}
        </div>
      )}
    />
  );
}
```

## Client Components

For interactive content that requires client-side functionality:

### Setup

```typescript
'use client';
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function ClientSideContent() {
  return (
    <div>
      {/* Your interactive content */}
      
      {/* Preview component for CMS integration */}
      <PreviewComponent />
    </div>
  );
}
```

### Preview Component Integration

Add to your app layout for preview mode support:

```typescript
// app/layout.tsx
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Enables preview mode functionality */}
        <PreviewComponent />
      </body>
    </html>
  );
}
```

## Advanced Component Patterns

### Dynamic Component Resolution

```typescript
// Advanced component resolver with fallbacks
initReactComponentRegistry({
  resolver: (contentType: string) => {
    // Try exact match first
    const exactMatch = componentMap[contentType];
    if (exactMatch) return exactMatch;
    
    // Try base type fallbacks
    const baseTypeMatches = {
      '_page': DefaultPage,
      '_component': DefaultComponent,
      '_experience': DefaultExperience
    };
    
    // Get base type from content registry
    const contentTypeObj = getContentType(contentType);
    if (contentTypeObj) {
      return baseTypeMatches[contentTypeObj.baseType] || DefaultComponent;
    }
    
    // Ultimate fallback
    return DefaultComponent;
  }
});
```

### Conditional Rendering

```typescript
export default function Article({ opti }: ArticleProps) {
  const { pa } = getPreviewUtils(opti);
  
  return (
    <article>
      {/* Conditional content based on properties */}
      {opti.featured && (
        <div className="featured-badge">
          Featured Article
        </div>
      )}
      
      {/* Conditional rendering with fallbacks */}
      {opti.author ? (
        <div {...pa('author')}>
          <AuthorComponent author={opti.author} />
        </div>
      ) : (
        <div className="anonymous-author">
          By Anonymous
        </div>
      )}
      
      {/* Array handling with empty states */}
      {opti.relatedArticles && opti.relatedArticles.length > 0 ? (
        <section className="related-articles">
          <h3>Related Articles</h3>
          {opti.relatedArticles.map((article) => (
            <ArticleCard 
              key={article._metadata.key} 
              article={article} 
            />
          ))}
        </section>
      ) : (
        <div className="no-related">
          No related articles available.
        </div>
      )}
    </article>
  );
}
```

### Nested Component Rendering

```typescript
export default function LandingPage({ opti }: LandingPageProps) {
  const { pa } = getPreviewUtils(opti);
  
  return (
    <main>
      {/* Hero section */}
      {opti.heroSection && (
        <section {...pa('heroSection')}>
          <OptimizelyComponent opti={opti.heroSection} />
        </section>
      )}
      
      {/* Dynamic sections */}
      {opti.sections?.map((section, index) => (
        <section 
          key={section._metadata?.key || index}
          {...pa({ key: section._metadata?.key })}
          className={`section section-${index}`}
        >
          <OptimizelyComponent opti={section} />
        </section>
      ))}
      
      {/* Call-to-action */}
      {opti.callToAction && (
        <section {...pa('callToAction')} className="cta-section">
          <OptimizelyComponent opti={opti.callToAction} />
        </section>
      )}
    </main>
  );
}
```

## Error Boundaries

Implement error boundaries for robust content rendering:

```typescript
// src/components/ContentErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ContentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Content rendering error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="content-error">
      <h2>Content Error</h2>
      <p>There was an error rendering this content.</p>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
    </div>
  );
}

// Usage
<ContentErrorBoundary fallback={CustomErrorComponent}>
  <OptimizelyComponent opti={content} />
</ContentErrorBoundary>
```

## Performance Optimization

### Component Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyGallery = lazy(() => import('./HeavyGallery'));
const ComplexChart = lazy(() => import('./ComplexChart'));

initReactComponentRegistry({
  resolver: (contentType: string) => {
    const components = {
      'Gallery': (props: any) => (
        <Suspense fallback={<div>Loading gallery...</div>}>
          <HeavyGallery {...props} />
        </Suspense>
      ),
      'Chart': (props: any) => (
        <Suspense fallback={<div>Loading chart...</div>}>
          <ComplexChart {...props} />
        </Suspense>
      ),
      // ... other components
    };
    
    return components[contentType] || null;
  }
});
```

### Memoization

```typescript
import { memo } from 'react';

// Memoize content components to prevent unnecessary re-renders
const Article = memo(function Article({ opti }: ArticleProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.opti._metadata.key === nextProps.opti._metadata.key &&
         prevProps.opti._metadata.version === nextProps.opti._metadata.version;
});

export default Article;
```

## Testing

### Component Testing

```typescript
// src/components/__tests__/Article.test.tsx
import { render, screen } from '@testing-library/react';
import Article from '../Article';
import { ArticleContentType } from '../../content-types/Article';
import type { Infer } from '@episerver/cms-sdk';

const mockArticle: Infer<typeof ArticleContentType> = {
  _metadata: {
    key: 'test-article',
    url: { default: '/test-article' },
    types: ['Article']
  },
  title: 'Test Article',
  content: '<p>Test content</p>',
  publishDate: '2024-01-01T00:00:00Z',
  featured: true,
  author: {
    _metadata: {
      key: 'test-author',
      url: { default: '/authors/test' },
      types: ['Author']
    },
    name: 'Test Author',
    bio: '<p>Test bio</p>'
  },
  categories: [],
  tags: ['test', 'article']
};

describe('Article Component', () => {
  it('renders article content correctly', () => {
    render(<Article opti={mockArticle} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Article');
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Featured Article')).toBeInTheDocument();
  });
  
  it('handles missing optional content', () => {
    const minimalArticle = {
      ...mockArticle,
      author: undefined,
      featuredImage: undefined
    };
    
    render(<Article opti={minimalArticle} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Article');
    expect(screen.queryByText('About the Author')).not.toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// src/__tests__/content-integration.test.tsx
import { render, screen } from '@testing-library/react';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import '../lib/optimizely'; // Initialize registry

const mockContent = {
  __typename: 'Article',
  _metadata: {
    key: 'test-content',
    url: { default: '/test' },
    types: ['Article']
  },
  title: 'Integration Test Article'
};

describe('Content Integration', () => {
  it('resolves and renders correct component', () => {
    render(<OptimizelyComponent opti={mockContent} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Integration Test Article');
  });
  
  it('handles unknown content types gracefully', () => {
    const unknownContent = {
      ...mockContent,
      __typename: 'UnknownType'
    };
    
    render(<OptimizelyComponent opti={unknownContent} />);
    
    expect(screen.getByText('No component found for content type UnknownType')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

**Component not rendering**:
- Verify component is registered in the registry
- Check content type key matches exactly
- Ensure component is exported correctly

**Preview mode not working**:
- Verify PreviewComponent is included in layout
- Check preview attributes are applied correctly
- Ensure preview tokens are valid

**Type errors**:
- Verify content type definitions match actual content
- Check that Infer type is used correctly
- Ensure components are typed properly

**Performance issues**:
- Use React.memo for heavy components
- Implement lazy loading for complex components
- Monitor component re-renders

For more troubleshooting, see the [Advanced Usage guide](./advanced-usage.md#troubleshooting).

## Next Steps

- **[Configuration](./configuration.md)** - Set up build configuration
- **[API Reference](./api-reference.md)** - Explore the complete React API
- **[Advanced Usage](./advanced-usage.md)** - Learn advanced patterns and optimization

---

*React integration makes it easy to build content-driven applications with full type safety and CMS preview support. The component registry system ensures your content automatically renders with the right components.*