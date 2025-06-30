# Rendering (with React)

In this page you will learn how to create a React component for your content type and how to render it.

## Step 1. Create a React component for Article

Open the `src/app/components/Article.tsx` file and add the following

```tsx
type Props = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1>{opti.heading}</h1>
      <div dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }} />
    </main>
  );
}
```

The entire file should look like this:

```tsx
import { contentType, Infer } from '@episerver/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});

type Props = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1>{opti.heading}</h1>
      <div dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }} />
    </main>
  );
}
```

## Step 2. Register the component

Edit the `src/app/layout.tsx` to register the Article component. Add the following snippet below `initContentTypeRegistry()`:

```tsx
initReactComponentRegistry({
  resolver: {
    Article,
  },
});
```

The entire `layout.tsx` should look like this:

```tsx
import Article, { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry } from '@episerver/cms-sdk';
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

initContentTypeRegistry([ArticleContentType]);
initReactComponentRegistry({
  resolver: {
    Article,
  },
});

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

## Step 3. Change the page

Open `src/app/[...slug]/page.tsx` file and replace the last line inside the `Page` function:

```diff
- return <pre>{JSON.stringify(content, null, 2)}</pre>
+ return <OptimizelyComponent opti={content} />;
```

Your entire file should look like this:

```tsx
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';
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

  return <OptimizelyComponent opti={content} />;
}
```

Go again to http://localhost:3000/en. You should see your page
