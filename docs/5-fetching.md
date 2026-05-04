# Fetching content

In this page you will learn how to create an application in your CMS and fetch content from Graph

## 1. Get the Graph key

1. Go to your CMS &rarr; Settings &rarr; API Keys
2. Under _Render Content_, copy the "Single Key"
3. Edit your `.env` file in the root and add the following line:

   ```ini
   OPTIMIZELY_GRAPH_SINGLE_KEY=<the value you copied>
   ```

## 2. Register the content type Article

Locate the file `src/app/layout.tsx` or create it if it doesn't exist. Put the following content:

```tsx
import { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry } from '@optimizely/cms-sdk';

initContentTypeRegistry([ArticleContentType]);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## 3. Create a page in Next.js

Create a file `src/app/[...slug]/page.tsx`. Your file structure should look like this:

```sh
.
├── src/
│   ├── app/
│   │   ├── [...slug]/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── components/
│       └── Article.tsx
├── public
├── .env
├── package.json
└── ...
```

Put the following content in `page.tsx`

```tsx
import { GraphClient } from '@optimizely/cms-sdk';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
}
```

### Define client in a more flexible way

With JS SDK version 2 and above, it is easier to define the client and use it throughout the application. You can now define the client in the root file and then use built-in functions to create the client.

```tsx
import { config } from '@optimizely/cms-sdk';
// Configure Optimizely Graph client
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});
```

#### config() Parameters

- **`apiKey`** (required): Your Optimizely Graph API key (Single key from CMS Settings → API Keys)
- **`graphUrl`** (optional): Custom Graph URL. Defaults to `https://cg.optimizely.com/content/v2`
- **`host`** (optional): Default application host for path filtering. Useful for multi-site scenarios
- **`maxFragmentThreshold`** (optional): Maximum number of GraphQL fragments before logging warnings. Defaults to `100`
- **`cache`** (optional): Enable/disable server-side caching for all queries. Defaults to `true`
- **`slot`** (optional): Select which Graph index to query (`'Current'` or `'New'`). Used during smooth rebuilds

After declaring this, you can get the client anywhere within the project by using the `getClient()` method.

```tsx
import { getClient } from '@optimizely/cms-sdk';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function Page({ params }: Props) {
  const { slug } = await params;

  // gets an instance of the client
  const client = getClient();
  const path = `/${slug.join('/')}/`;
  
  // fetch content via the client
  const content = await client.getContentByPath(path);

   return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
}
```

### Why use `getClient()` instead of `new GraphClient()`?

The `getClient()` approach is preferred because:

- **Single configuration point**: Configure Graph client once in your app's entry point instead of passing environment variables to every component
- **Cleaner code**: No need to instantiate client in every page/component that needs content
- **Easier maintenance**: Change API key or Graph URL in one place

## 4. Start the app

Start the application

```sh
npm run dev
```

Go to [http://localhost:3000/en/](http://localhost:3000/en/)

You should see the content you have created as JSON

## Next steps

Now you are ready to [render the content](./6-rendering-react.md) that you just fetched.

---

## API Reference

### Fetching Methods

The GraphClient provides multiple methods for fetching content from Optimizely CMS.

#### `getContentByPath(path, options?)`

Fetches content based on URL path. Returns an array of all items matching the path and options.

```typescript
// Fetch content by path
const content = await client.getContentByPath('/blog/my-article');

// With variation options
const content = await client.getContentByPath('/blog/my-article', {
  variation: { include: 'SOME', value: ['variation-id'] },
  host: 'https://example.com'
});
```

**Parameters:**

- `path` (string): URL path to the content
- `options` (optional):
  - `variation`: Filter by experience variations
  - `host`: Override default host for multi-site scenarios

**Returns:** Array of content items (empty array if not found)

---

#### `getContent(reference, previewToken?)`

Unified content fetching method using GraphReference. Provides flexible content retrieval with support for key-based queries, locale filtering, and version selection.

```typescript
// Fetch by key only (latest published)
const content = await client.getContent({ key: 'abc123' });

// Fetch latest draft in specific locale
const content = await client.getContent({
  key: 'abc123',
  locale: 'en'
});

// Fetch specific version (version has priority)
const content = await client.getContent({
  key: 'abc123',
  version: '1.0'
});

// Using string format
const content = await client.getContent('graph://cms/Page/abc123?loc=en&ver=1.0');

// With preview token
const content = await client.getContent(
  { key: 'abc123', version: '1.0' },
  'preview-token'
);
```

**Parameters:**

- `reference` (GraphReference | string): Content reference (object or graph:// string)
- `previewToken` (optional): Preview token for draft content

**GraphReference format:**

- `key` (required): Content GUID/key
- `locale` (optional): Content locale (e.g., 'en', 'sv')
- `version` (optional): Specific version (takes priority over locale)
- `type` (optional): Content type name
- `source` (optional): Source identifier (unused for now)

**String format:** `graph://[source]/[type]/key?loc=locale&ver=version`

**Priority rules:**

- If `version` is specified, it takes priority (ignores locale-based filtering)
- If only `locale` is specified, fetches latest draft in that locale
- If neither specified, fetches latest published version

**Returns:** Content item or null if not found

---

#### `getPath(input, options?)`

Fetches the breadcrumb path (ancestor pages) for a given page. Now supports both URL paths and GraphReference.

```typescript
// Using URL path
const path = await client.getPath('/blog/my-article');

// Using GraphReference object
const path = await client.getPath({
  key: 'abc123',
  locale: 'en'
});

// Using graph:// string format
const path = await client.getPath('graph://Page/abc123?loc=en');

// With locales filter
const path = await client.getPath(
  { key: 'abc123' },
  { locales: ['en', 'sv'] }
);
```

**Parameters:**

- `input` (string | GraphReference): URL path or GraphReference
- `options` (optional):
  - `host`: Override default host (only for path strings)
  - `locales`: Array of locales to filter

**Returns:** Array of ancestor page metadata (sorted from top to current) or null if page doesn't exist

---

#### `getItems(input, options?)`

Fetches child pages for a given parent page. Now supports both URL paths and GraphReference.

```typescript
// Using URL path
const items = await client.getItems('/blog');

// Using GraphReference object
const items = await client.getItems({
  key: 'abc123',
  locale: 'en'
});

// Using graph:// string format
const items = await client.getItems('graph://Page/abc123?loc=en');

// With locales filter
const items = await client.getItems(
  { key: 'abc123' },
  { locales: ['en', 'sv'] }
);
```

**Parameters:**

- `input` (string | GraphReference): URL path or GraphReference
- `options` (optional):
  - `host`: Override default host (only for path strings)
  - `locales`: Array of locales to filter

**Returns:** Array of child page metadata or null if parent doesn't exist

---

## Advanced topics

### GraphClient Options

The `GraphClient` constructor accepts the following options:

#### `graphUrl`

The Content Graph endpoint URL.

- **Default**: `https://cg.optimizely.com/content/v2`
- **Example**: `https://cg.staging.optimizely.com/content/v2`

#### Using non-production Graph

The Graph Client uses the production Content Graph endpoint by default (<https://cg.optimizely.com/content/v2>). If you want to use a different URL, configure it by passing the `graphUrl` as option. For example:

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: 'https://cg.staging.optimizely.com/content/v2',
});
```

or

```ts
// define in root or starting point of your application
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: 'https://cg.staging.optimizely.com/content/v2',
})

// Use the client any where inside the application
const client = getClient()
```

#### `host`

Default application host for path filtering. Useful when multiple sites share the same CMS instance - ensures content is retrieved only from the specified domain.

- **Default**: `undefined`
- **Example**: `https://example.com`
- **Can be overridden**: Yes, per-request via `getContentByPath`, `getPath`, and `getItems` options

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  host: 'https://example.com',
});
```

or

```ts
// define in root or starting point of your application
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  host: 'https://example.com',
})

// Use the client with defined
const client = getClient()
```

```ts
// Uses default host from client
await client.getContentByPath('/about');

// Override for specific request
await client.getContentByPath('/contact', {
  host: 'https://other-site.com',
});
```

#### `maxFragmentThreshold`

Maximum number of GraphQL fragments before logging performance warnings. Prevents overly complex queries from unrestricted content types that could breach GraphQL limits or degrade performance.

- **Default**: `100`
- **Example**: `150`

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  maxFragmentThreshold: 150,
});
```

or

```ts
// define in root or starting point of your application
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  maxFragmentThreshold: 150,
})

// Use the client with maxFragmentThreshold defined
const client = getClient()
```

When this threshold is exceeded, you'll see a warning like:

```sh
⚠️ [optimizely-cms-sdk] Fragment "MyContentType" generated 200 inner fragments (limit: 150).
→ Consider narrowing it using allowedTypes and restrictedTypes or reviewing schema references to reduce complexity.
```
