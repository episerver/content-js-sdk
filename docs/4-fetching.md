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

Locate the file `app/layout.tsx` or create it if it doesn't exist. Put the following content:

```tsx
import { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry } from '@episerver/cms-sdk';

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

Create a file `app/[...slug]/page.tsx`. Your file structure should look like this:

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
import { GraphClient } from '@episerver/cms-sdk';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const content = await client.fetchContent(`/${slug.join('/')}/`);

  return <pre>{JSON.stringify(content, null, 2)}</pre>;
}
```

## 4. Start the app

Start the application

```sh
npm run dev
```

Go to http://localhost:3000/en/

You should see the content you have created as JSON

---

## Advanced topics

### Using non-production Graph

The Graph Client uses the production Content Graph endpoint by default (https://cg.optimizely.com/content/v2). If you want to use a different URL, configure it by passing the `graphUrl` as option. For example:

```ts
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY, {
  graphUrl: 'https://cg.staging.optimizely.com/content/v2',
});
```
