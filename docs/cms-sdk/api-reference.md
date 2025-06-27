# API Reference

Complete API reference for the Optimizely CMS SDK. This reference covers all public APIs, types, and utilities.

## Core Exports

```typescript
import {
  // Content Type System
  contentType,
  buildConfig,
  displayTemplate,
  isContentType,
  isDisplayTemplate,
  initContentTypeRegistry,
  
  // GraphQL Client
  GraphClient,
  getFilterFromPath,
  createQuery,
  
  // Type Inference
  Infer,
  
  // Content Types & Properties
  ContentTypes,
  DisplayTemplates,
  Properties,
  
  // Internal Types (advanced usage)
  BlankSectionContentType
} from '@episerver/cms-sdk';

import {
  // Server Components
  OptimizelyComponent,
  OptimizelyExperience,
  OptimizelyGridSection,
  initReactComponentRegistry,
  getPreviewUtils,
  
  // Types for React
  StructureContainer,
  ComponentContainer,
  StructureContainerProps,
  ComponentContainerProps
} from '@episerver/cms-sdk/react/server';

import {
  // Client Components
  PreviewComponent
} from '@episerver/cms-sdk/react/client';
```

## Content Type System

### `contentType<T>(options: T): T & { __type: 'contentType' }`

Creates a content type definition with validation and type safety.

```typescript
export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string', required: true },
    content: { type: 'richText' }
  }
});
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ContentTypeDefinition` | Content type configuration |

#### ContentTypeDefinition

```typescript
interface ContentTypeDefinition {
  key: string;                                    // Unique identifier
  displayName?: string;                           // Human-readable name
  baseType: BaseType;                            // Base content type
  properties?: Record<string, AnyProperty>;       // Property definitions
  compositionBehaviors?: CompositionBehavior[];   // Usage permissions
}

type BaseType = '_page' | '_component' | '_experience' | '_image' | '_video' | '_media' | '_folder' | '_element';

type CompositionBehavior = 'sectionEnabled' | 'elementEnabled';
```

### `buildConfig<T>(options: T): T & { __type: 'buildConfig' }`

Creates build configuration for component discovery.

```typescript
export default buildConfig({
  components: ['./src/components/**/*.tsx']
});
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `BuildConfig` | Build configuration |

#### BuildConfig

```typescript
interface BuildConfig {
  components: string[];  // Glob patterns for component discovery
}
```

### `displayTemplate<T>(options: T): T & { __type: 'displayTemplate' }`

Creates display template definitions (advanced usage).

```typescript
export const ArticleDisplayTemplate = displayTemplate({
  key: 'ArticleDetail',
  displayName: 'Article Detail View',
  // ... template configuration
});
```

### Type Guards

#### `isContentType(obj: unknown): obj is AnyContentType`

Checks if an object is a valid content type.

```typescript
if (isContentType(someObject)) {
  // someObject is guaranteed to be a content type
  console.log(someObject.key);
}
```

#### `isDisplayTemplate(obj: unknown): obj is DisplayTemplate`

Checks if an object is a valid display template.

### `initContentTypeRegistry(contentTypes: AnyContentType[]): void`

Initializes the global content type registry.

```typescript
import { initContentTypeRegistry } from '@episerver/cms-sdk';
import { ArticleContentType, ProductContentType } from './content-types';

initContentTypeRegistry([
  ArticleContentType,
  ProductContentType
]);
```

## Property Types

### String Properties

```typescript
interface StringProperty {
  type: 'string';
  required?: boolean;
  displayName?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  enum?: { value: string; displayName: string }[];
  group?: string;
  sortOrder?: number;
  localized?: boolean;
  format?: string;
}
```

### Boolean Properties

```typescript
interface BooleanProperty {
  type: 'boolean';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}
```

### Number Properties

```typescript
interface IntegerProperty {
  type: 'integer';
  required?: boolean;
  displayName?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: { value: number; displayName: string }[];
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface FloatProperty {
  type: 'float';
  required?: boolean;
  displayName?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: { value: number; displayName: string }[];
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}
```

### Date Properties

```typescript
interface DateTimeProperty {
  type: 'dateTime';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}
```

### Content Properties

```typescript
interface RichTextProperty {
  type: 'richText';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface UrlProperty {
  type: 'url';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface BinaryProperty {
  type: 'binary';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
}

interface JsonProperty {
  type: 'json';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
}
```

### Reference Properties

```typescript
interface ContentReferenceProperty {
  type: 'contentReference';
  required?: boolean;
  displayName?: string;
  description?: string;
  allowedTypes?: ContentOrMediaType[];
  restrictedTypes?: ContentOrMediaType[];
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface ContentProperty {
  type: 'content';
  required?: boolean;
  displayName?: string;
  description?: string;
  allowedTypes?: ContentOrMediaType[];
  restrictedTypes?: ContentOrMediaType[];
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface ComponentProperty<T extends AnyContentType> {
  type: 'component';
  contentType: T;
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}

interface LinkProperty {
  type: 'link';
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}
```

### Array Properties

```typescript
interface ArrayProperty<T extends ArrayItems> {
  type: 'array';
  items: T;
  required?: boolean;
  displayName?: string;
  description?: string;
  group?: string;
  sortOrder?: number;
  localized?: boolean;
}
```

## GraphQL Client

### `GraphClient`

Primary client for interacting with Optimizely Content Graph.

```typescript
class GraphClient {
  constructor(key: string, options?: GraphOptions);
  
  // Main content fetching methods
  fetchContent(path: string): Promise<any>;
  fetchPreviewContent(params: PreviewParams): Promise<any>;
  fetchContentType(filter: GraphFilter, previewToken?: string): Promise<string | undefined>;
  
  // Low-level GraphQL method
  request(query: string, variables: any, previewToken?: string): Promise<any>;
}
```

#### Constructor

```typescript
const client = new GraphClient(key, options);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Graph Single Key from Optimizely |
| `options` | `GraphOptions` | Optional configuration |

#### GraphOptions

```typescript
interface GraphOptions {
  graphUrl?: string;  // Default: 'https://cg.optimizely.com/content/v2'
}
```

#### Methods

##### `fetchContent(path: string): Promise<any>`

Fetches content by URL path with automatic query generation.

```typescript
const content = await client.fetchContent('/articles/my-article/');
```

##### `fetchPreviewContent(params: PreviewParams): Promise<any>`

Fetches content for preview mode with context decoration.

```typescript
const content = await client.fetchPreviewContent({
  preview_token: 'token',
  key: 'content_key',
  ctx: 'edit',
  ver: 'version',
  loc: 'en'
});
```

##### `fetchContentType(filter: GraphFilter, previewToken?: string): Promise<string | undefined>`

Determines content type for a given filter.

```typescript
const contentType = await client.fetchContentType(
  getFilterFromPath('/articles/my-article/')
);
```

##### `request(query: string, variables: any, previewToken?: string): Promise<any>`

Executes custom GraphQL queries.

```typescript
const result = await client.request(
  'query GetContent($filter: _ContentWhereInput) { ... }',
  { filter: { ... } }
);
```

### Filter Utilities

#### `getFilterFromPath(path: string): GraphFilter`

Creates a filter for path-based content fetching.

```typescript
const filter = getFilterFromPath('/blog/my-post/');
// Returns: { _metadata: { url: { default: { eq: '/blog/my-post/' } } } }
```

#### `getFilterFromPreviewParams(params: PreviewParams): GraphFilter`

Creates a filter for preview parameter-based fetching.

```typescript
const filter = getFilterFromPreviewParams({
  preview_token: 'token',
  key: 'content_key',
  ctx: 'edit',
  ver: '1',
  loc: 'en'
});
```

### Types

#### `PreviewParams`

```typescript
interface PreviewParams {
  preview_token: string;
  key: string;
  ctx: string;      // 'edit' | 'preview'
  ver: string;
  loc: string;
}
```

#### `GraphFilter`

```typescript
interface GraphFilter {
  _metadata: {
    [key: string]: any;
  };
}
```

## Type Inference

### `Infer<T>`

Automatically infers TypeScript types from content type definitions.

```typescript
import { Infer } from '@episerver/cms-sdk';

type ArticleData = Infer<typeof ArticleContentType>;

// ArticleData now has all properties with correct types:
// {
//   _metadata: { key: string; url: { default: string }; types: string[] };
//   title: string;
//   content: string;
//   publishDate?: string;
//   author?: { name: string; bio: string; ... };
//   // ... other properties
// }
```

#### Usage in Components

```typescript
function Article({ opti }: { opti: Infer<typeof ArticleContentType> }) {
  // opti is fully typed with IntelliSense support
  return <h1>{opti.title}</h1>;
}
```

## React Integration

### Server Components

#### `OptimizelyComponent`

Renders content with automatic component resolution.

```typescript
function OptimizelyComponent({ opti, ...props }: {
  opti: {
    __typename: string;
    __context?: { edit: boolean; preview_token: string };
  };
}): JSX.Element
```

```typescript
<OptimizelyComponent opti={content} />
```

#### `initReactComponentRegistry(options: InitOptions): void`

Initializes the React component registry.

```typescript
interface InitOptions {
  resolver: ComponentResolver<ComponentType>;
}

type ComponentResolver<T> = (contentType: string) => T | null | Promise<T | null>;
```

```typescript
initReactComponentRegistry({
  resolver: (contentType) => {
    const components = {
      'Article': Article,
      'Product': Product
    };
    return components[contentType] || null;
  }
});
```

#### `getPreviewUtils(opti: Props['opti']): PreviewUtils`

Returns utilities for preview mode integration.

```typescript
interface PreviewUtils {
  pa(property: string | { key: string }): Record<string, string>;
  src(url: string): string;
}
```

```typescript
const { pa, src } = getPreviewUtils(opti);

// Property attributes for in-place editing
<h1 {...pa('title')}>{opti.title}</h1>

// Source URLs with preview tokens
<img src={src(opti.image.url.default)} alt={opti.image.alt} />
```

#### Experience Components

##### `OptimizelyExperience`

Renders experience compositions.

```typescript
function OptimizelyExperience({
  nodes,
  ComponentWrapper
}: {
  nodes: ExperienceNode[];
  ComponentWrapper?: ComponentContainer;
}): JSX.Element[]
```

##### `OptimizelyGridSection`

Renders grid-based layouts.

```typescript
function OptimizelyGridSection({
  nodes,
  row,
  column
}: {
  nodes?: ExperienceNode[];
  row: StructureContainer;
  column: StructureContainer;
}): JSX.Element[]
```

#### Types

```typescript
interface StructureContainerProps {
  node: ExperienceStructureNode;
  children: React.ReactNode;
  index?: number;
}

interface ComponentContainerProps {
  node: ExperienceComponentNode;
  children: React.ReactNode;
}

type StructureContainer = (props: StructureContainerProps) => JSX.Element;
type ComponentContainer = (props: ComponentContainerProps) => JSX.Element;
```

### Client Components

#### `PreviewComponent`

Enables CMS preview mode functionality.

```typescript
function PreviewComponent(): null
```

```typescript
'use client';
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function Layout({ children }) {
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

## Advanced APIs

### Query Generation

#### `createQuery(contentTypeName: string): string`

Generates GraphQL query for a content type.

```typescript
import { createQuery } from '@episerver/cms-sdk';

const query = createQuery('Article');
// Returns optimized GraphQL query string
```

### Content Type Registry

Access to the internal content type registry (advanced usage):

```typescript
import {
  getContentType,
  getAllContentTypes,
  getContentTypeByBaseType,
  getAllMediaTypeKeys
} from '@episerver/cms-sdk/model/contentTypeRegistry';

// Get specific content type
const articleType = getContentType('Article');

// Get all registered content types
const allTypes = getAllContentTypes();

// Get content types by base type
const pageTypes = getContentTypeByBaseType('_page');

// Get all media type keys
const mediaTypes = getAllMediaTypeKeys();
```

## Error Handling

### Common Error Types

```typescript
// Content not found
try {
  const content = await client.fetchContent('/nonexistent/');
} catch (error) {
  if (error.message.includes('No content found')) {
    // Handle 404
  }
}

// Component not found
// OptimizelyComponent will render:
// <div>No component found for content type {contentType}</div>

// GraphQL errors
try {
  const result = await client.request(query, variables);
} catch (error) {
  // Handle GraphQL or network errors
}
```

### Error Boundaries

Recommended error boundary pattern:

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export class OptimizelyErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultFallback;
      return <Fallback error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}
```

## Performance Considerations

### Fragment Threshold

The SDK monitors query complexity:

```typescript
// Set environment variable to control threshold
process.env.MAX_FRAGMENT_THRESHOLD = '100';

// The SDK will warn when queries exceed this complexity
```

### Caching

```typescript
// Client-side caching example
const cache = new Map();

export async function getCachedContent(path: string) {
  if (cache.has(path)) {
    return cache.get(path);
  }
  
  const content = await client.fetchContent(path);
  cache.set(path, content);
  return content;
}
```

## Migration Guide

### From Manual GraphQL

```typescript
// Before: Manual GraphQL
const query = `
  query GetArticle {
    Article {
      title
      content
      author { name }
    }
  }
`;

// After: SDK Content Type + Automatic Queries
const ArticleType = contentType({
  key: 'Article',
  properties: {
    title: { type: 'string' },
    content: { type: 'richText' },
    author: { type: 'contentReference', allowedTypes: ['Author'] }
  }
});

const content = await client.fetchContent('/articles/my-article/');
```

### From Custom Component Resolution

```typescript
// Before: Manual component mapping
function renderContent(content) {
  switch (content.__typename) {
    case 'Article': return <Article {...content} />;
    case 'Product': return <Product {...content} />;
    default: return <div>Unknown content</div>;
  }
}

// After: Component registry
initReactComponentRegistry({
  resolver: (contentType) => componentMap[contentType]
});

return <OptimizelyComponent opti={content} />;
```

---

*This API reference provides comprehensive documentation for all public APIs. For usage examples and patterns, see the other documentation sections.*