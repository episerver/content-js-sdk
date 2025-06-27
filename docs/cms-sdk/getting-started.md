# Getting Started with @episerver/cms-sdk

This guide will walk you through setting up the Optimizely CMS SDK and creating your first content-driven application.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (latest LTS version recommended)
- **An Optimizely CMS instance** with API access
- **GitHub Package Registry access** (see [Authentication Setup](#github-package-registry-authentication))
- **A React application** (Next.js, Vite, or Create React App)

## Installation

### 1. GitHub Package Registry Authentication

The SDK is published to GitHub Package Registry. You'll need to authenticate first:

1. **Create a Personal Access Token**:
   - Go to [GitHub Settings > Developer settings > Personal access tokens (classic)](https://github.com/settings/tokens)
   - Generate a new token with `read:packages` scope
   - **Authorize for Optimizely organization**: Click "Configure SSO" and authorize for Episerver/Optimizely

2. **Configure NPM**:
   Create or update `~/.npmrc` with:
   ```
   @episerver:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
   ```

### 2. Install the SDK

```bash
# Install the SDK
npm install @episerver/cms-sdk

# For React applications, ensure React is installed
npm install react@^19.0.0

# For TypeScript support (recommended)
npm install -D typescript @types/react
```

### 3. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Required: Your Optimizely Graph Single Key
OPTIMIZELY_GRAPH_SINGLE_KEY=your_graph_key_here

# Optional: Custom Graph URL (defaults to https://cg.optimizely.com/content/v2)
OPTIMIZELY_GRAPH_URL=https://cg.optimizely.com/content/v2

# Optional: Fragment threshold for performance (defaults to 100)
MAX_FRAGMENT_THRESHOLD=100
```

> **Where to find your Graph Single Key**: In your Optimizely CMS admin panel, go to Settings > API Keys > Content Graph API Keys.

## Your First Content Type

Let's create a simple blog post content type to demonstrate the SDK's capabilities.

### 1. Define the Content Type

Create `src/content-types/BlogPost.ts`:

```typescript
import { contentType } from '@episerver/cms-sdk';

export const BlogPostContentType = contentType({
  key: 'BlogPost',
  displayName: 'Blog Post',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      required: true,
      displayName: 'Post Title',
      maxLength: 100
    },
    excerpt: {
      type: 'string',
      displayName: 'Excerpt',
      description: 'A brief summary of the blog post',
      maxLength: 200
    },
    content: {
      type: 'richText',
      displayName: 'Content',
      required: true
    },
    publishDate: {
      type: 'dateTime',
      displayName: 'Publish Date',
      required: true
    },
    featured: {
      type: 'boolean',
      displayName: 'Featured Post',
      description: 'Mark this post as featured'
    },
    categories: {
      type: 'array',
      items: { type: 'string' },
      displayName: 'Categories'
    },
    featuredImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Featured Image'
    }
  }
});
```

### 2. Create a React Component

Create `src/components/BlogPost.tsx`:

```typescript
import React from 'react';
import { Infer, getPreviewUtils } from '@episerver/cms-sdk';
import type { BlogPostContentType } from '../content-types/BlogPost';

type BlogPostProps = {
  opti: Infer<typeof BlogPostContentType>;
};

export default function BlogPost({ opti }: BlogPostProps) {
  // Get preview utilities for edit mode
  const { pa, src } = getPreviewUtils(opti);
  
  return (
    <article className="blog-post">
      {/* Featured badge */}
      {opti.featured && (
        <div className="featured-badge">Featured</div>
      )}
      
      {/* Featured image */}
      {opti.featuredImage?.url && (
        <img
          src={src(opti.featuredImage.url.default)}
          alt={opti.title}
          className="featured-image"
        />
      )}
      
      {/* Header */}
      <header>
        <h1 {...pa('title')}>{opti.title}</h1>
        
        {opti.publishDate && (
          <time dateTime={opti.publishDate} className="publish-date">
            {new Date(opti.publishDate).toLocaleDateString()}
          </time>
        )}
        
        {opti.excerpt && (
          <p className="excerpt" {...pa('excerpt')}>
            {opti.excerpt}
          </p>
        )}
      </header>
      
      {/* Content */}
      <div 
        className="content" 
        {...pa('content')}
        dangerouslySetInnerHTML={{ __html: opti.content }} 
      />
      
      {/* Categories */}
      {opti.categories && opti.categories.length > 0 && (
        <footer className="categories">
          <h3>Categories:</h3>
          <ul>
            {opti.categories.map((category, index) => (
              <li key={index}>{category}</li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
```

### 3. Set Up Component Registry

Create `src/lib/optimizely.ts`:

```typescript
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';
import BlogPost from '../components/BlogPost';

// Initialize the component registry
initReactComponentRegistry({
  resolver: (contentType: string) => {
    const components = {
      'BlogPost': BlogPost,
      // Add more components as you create them
    };
    
    return components[contentType] || null;
  }
});
```

### 4. Create a Build Configuration

Create `optimizely.config.mjs` in your project root:

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    './src/components/**/*.ts'
  ]
});
```

### 5. Fetch and Display Content

For **Next.js App Router** (`src/app/[...slug]/page.tsx`):

```typescript
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import '../lib/optimizely'; // Initialize component registry

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  
  // Initialize GraphQL client
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL
  });
  
  try {
    // Construct the path
    const path = `/${slug.join('/')}/`;
    
    // Fetch content from Optimizely
    const content = await client.fetchContent(path);
    
    // Render with OptimizelyComponent
    return <OptimizelyComponent opti={content} />;
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return (
      <div>
        <h1>Content not found</h1>
        <p>The requested content could not be found.</p>
      </div>
    );
  }
}

// Optional: Generate static params for known pages
export async function generateStaticParams() {
  // You can fetch a list of all available pages here
  return [
    { slug: ['blog', 'my-first-post'] },
    { slug: ['blog', 'another-post'] }
  ];
}
```

For **Next.js Pages Router** (`pages/[...slug].tsx`):

```typescript
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
import { GetServerSideProps } from 'next';
import '../lib/optimizely';

type Props = {
  content: any;
  error?: string;
};

export default function DynamicPage({ content, error }: Props) {
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return <OptimizelyComponent opti={content} />;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  
  try {
    const slug = Array.isArray(params?.slug) ? params.slug : [params?.slug].filter(Boolean);
    const path = `/${slug.join('/')}/`;
    const content = await client.fetchContent(path);
    
    return { props: { content } };
  } catch (error) {
    return { 
      props: { 
        error: 'Content not found',
        content: null 
      } 
    };
  }
};
```

## Testing Your Setup

### 1. Add Some CSS

Create `src/styles/blog.css`:

```css
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.featured-badge {
  background: #ff6b35;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 1rem;
  font-weight: bold;
}

.featured-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.blog-post header {
  margin-bottom: 2rem;
}

.blog-post h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.publish-date {
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
  display: block;
}

.excerpt {
  font-size: 1.2rem;
  color: #555;
  font-style: italic;
  line-height: 1.6;
}

.content {
  line-height: 1.8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.categories ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 1rem;
}

.categories li {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.9rem;
}
```

### 2. Create Content in CMS

1. **Deploy your content type**: Use the [CMS CLI](../cms-cli/getting-started.md) to push your content type to the CMS
2. **Create content**: Use the CMS admin interface to create a blog post
3. **Test locally**: Run your application and navigate to the content URL

### 3. Run Your Application

```bash
# For Next.js
npm run dev

# For Vite
npm run dev

# For Create React App
npm start
```

## Preview Mode Support

The SDK includes built-in support for CMS preview mode. Add the preview component to your layout:

```typescript
// src/app/layout.tsx (Next.js App Router)
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <PreviewComponent />
      </body>
    </html>
  );
}
```

## Next Steps

Congratulations! You've successfully set up the Optimizely CMS SDK. Here's what you can explore next:

1. **[Learn about Content Types](./content-types.md)** - Explore all property types and advanced features
2. **[Master GraphQL Integration](./graphql-integration.md)** - Learn about querying and filtering
3. **[Explore React Integration](./react-integration.md)** - Discover advanced component patterns
4. **[Configure Your Build](./configuration.md)** - Optimize your setup for production

## Troubleshooting

### Common Issues

**Authentication Error**: 
- Verify your GitHub token has `read:packages` scope
- Ensure you've authorized the token for Optimizely organization

**Module Not Found**: 
- Check that you've installed the SDK from the correct registry
- Verify your `.npmrc` configuration

**Content Not Found**: 
- Confirm your Graph Single Key is correct
- Check that content exists at the specified path in CMS
- Verify your content is published

**TypeScript Errors**: 
- Ensure you're using the latest TypeScript version
- Check that your content type definitions match your component props

For more troubleshooting tips, see the [Advanced Usage guide](./advanced-usage.md#troubleshooting).

---

*Ready to dive deeper? Continue with **[Content Types](./content-types.md)** to learn about the full power of the content type system.*