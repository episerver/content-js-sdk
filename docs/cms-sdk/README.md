# @episerver/cms-sdk Documentation

The Optimizely CMS SDK is a powerful JavaScript library that enables developers to build modern, type-safe applications with Optimizely CMS. It provides a complete solution for content type management, GraphQL integration, and React component rendering.

## 🌟 Key Features

- **Type-Safe Content Types**: Define CMS content types with full TypeScript support
- **Automatic GraphQL Queries**: Generate optimized queries based on your content types
- **React Integration**: Server and client components for seamless CMS integration
- **Preview Mode**: Built-in support for CMS preview and edit modes
- **Performance Optimized**: Intelligent query generation and caching strategies

## 📚 Documentation Navigation

### Getting Started
- **[Getting Started](./getting-started.md)** - Installation, setup, and your first content type

### Core Concepts
- **[Content Types](./content-types.md)** - Define and structure your CMS content
- **[GraphQL Integration](./graphql-integration.md)** - Fetch content with type-safe queries
- **[React Integration](./react-integration.md)** - Render content with React components

### Configuration & Setup
- **[Configuration](./configuration.md)** - Build configuration and environment variables

### Reference & Advanced
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Advanced Usage](./advanced-usage.md)** - Performance optimization and troubleshooting

## 🚀 Quick Example

Here's a complete example showing the power of the CMS SDK:

### 1. Define Content Types
```typescript
// src/content-types/Article.ts
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
    summary: { 
      type: 'string',
      maxLength: 200,
      displayName: 'Summary' 
    },
    content: { 
      type: 'richText',
      displayName: 'Article Content' 
    },
    publishDate: { 
      type: 'dateTime',
      displayName: 'Publish Date' 
    },
    author: {
      type: 'contentReference',
      allowedTypes: ['Author'],
      displayName: 'Author'
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      displayName: 'Tags'
    }
  }
});
```

### 2. Create React Component
```typescript
// src/components/Article.tsx
import React from 'react';
import { Infer, getPreviewUtils } from '@episerver/cms-sdk';
import type { ArticleContentType } from '../content-types/Article';

type ArticleProps = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: ArticleProps) {
  const { pa, src } = getPreviewUtils(opti);
  
  return (
    <article className="article">
      <header>
        <h1 {...pa('title')}>{opti.title}</h1>
        {opti.publishDate && (
          <time dateTime={opti.publishDate}>
            {new Date(opti.publishDate).toLocaleDateString()}
          </time>
        )}
      </header>
      
      {opti.summary && (
        <p className="summary" {...pa('summary')}>
          {opti.summary}
        </p>
      )}
      
      <div 
        className="content" 
        {...pa('content')}
        dangerouslySetInnerHTML={{ __html: opti.content }} 
      />
      
      {opti.tags?.length > 0 && (
        <div className="tags">
          {opti.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
```

### 3. Fetch and Render Content
```typescript
// src/app/[...slug]/page.tsx
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';

export default async function Page({ params }: { params: { slug: string[] } }) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL
  });
  
  const path = `/${params.slug.join('/')}/`;
  const content = await client.fetchContent(path);
  
  return <OptimizelyComponent opti={content} />;
}
```

### 4. Configure Build
```javascript
// optimizely.config.mjs
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx']
});
```

## 🏗️ Architecture

The CMS SDK follows a modular architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Your React Application                      │
├─────────────────────────────────────────────────────────────┤
│  Content Types  │  Components  │  GraphQL Queries          │
├─────────────────────────────────────────────────────────────┤
│                    CMS SDK Core                             │
├─────────────────────────────────────────────────────────────┤
│  Type Registry  │  Query Builder │  React Renderer         │
├─────────────────────────────────────────────────────────────┤
│                Optimizely Content Graph                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Modules

- **Content Type System**: Type-safe content definitions with validation
- **GraphQL Client**: Optimized query generation and execution
- **React Renderer**: Server and client components with preview support
- **Type Inference**: Automatic TypeScript type generation

## 🎯 Use Cases

### Content-First Development
Perfect for teams that want to define content structure in code and deploy it alongside their application.

### Headless CMS Applications
Ideal for building modern web applications, mobile apps, and API-driven experiences.

### Preview and Edit Integration
Built-in support for CMS preview modes and inline editing capabilities.

### Multi-Channel Publishing
Use the same content types across web, mobile, and API channels.

## 🔗 Next Steps

1. **[Get Started](./getting-started.md)** - Install and set up your first project
2. **[Learn Content Types](./content-types.md)** - Master the content type system
3. **[Explore Examples](../../samples/)** - See complete working applications
4. **[Join the Community](https://github.com/episerver/content-js-sdk)** - Contribute and get help

---

*Ready to build amazing content-driven applications? Start with the **[Getting Started guide](./getting-started.md)**!*