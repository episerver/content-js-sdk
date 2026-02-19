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

```
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

## 4. Start the app

Start the application

```sh
npm run dev
```

Go to http://localhost:3000/en/

You should see the content you have created as JSON

## Next steps

Now you are ready to [render the content](./6-rendering-react.md) that you just fetched.

---

## Advanced topics

### GraphClient Options

The `GraphClient` constructor accepts the following options:

#### `graphUrl`

The Content Graph endpoint URL.

- **Default**: `https://cg.optimizely.com/content/v2`
- **Example**: `https://cg.staging.optimizely.com/content/v2`

#### Using non-production Graph

The Graph Client uses the production Content Graph endpoint by default (https://cg.optimizely.com/content/v2). If you want to use a different URL, configure it by passing the `graphUrl` as option. For example:

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: 'https://cg.staging.optimizely.com/content/v2',
});
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
- **Example**: `200`

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  maxFragmentThreshold: 200,
});
```

When this threshold is exceeded, you'll see a warning like:

```
⚠️ [optimizely-cms-sdk] Fragment "MyContentType" generated 150 inner fragments (limit: 100).
→ Consider narrowing it using allowedTypes and restrictedTypes or reviewing schema references to reduce complexity.
```
