# Rendering (with React)

In this page you will learn how to create a React component for your content type and how to render it.

## Step 1. Create a React component for Article

Open the `src/app/components/Article.tsx` file and add the following

```tsx
import { RichText } from '@episerver/cms-sdk/react/richText';

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  return (
    <main>
      <h1>{content.heading}</h1>
      <RichText content={content.body?.json} />
    </main>
  );
}
```

> [!NOTE]
> For complete documentation on the RichText component including all props, advanced customization options, fallback handling, and TypeScript support, see the [RichText Component Reference](./10-richtext-component-react.md).

The entire file should look like this:

```tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

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
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  return (
    <main>
      <h1>{content.heading}</h1>
      <RichText content={content.body?.json} />
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
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

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
- return <pre>{JSON.stringify(content[0], null, 2)}</pre>
+ return <OptimizelyComponent content={content[0]} />;
```

Your entire file should look like this:

```tsx
import { GraphClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
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

  return <OptimizelyComponent content={content[0]} />;
}
```

Go again to http://localhost:3000/en. You should see your page

## Next steps

You have finished 🎉!

This is the end of the tutorial on how to create your first website using Optimizely CMS SaaS.

You can continue exploring these topics:

- **[Add Experiences](./8-experiences.md)** - Learn how to create personalized content experiences for different audiences
- **[Add Live Preview](./7-live-preview.md)** - Enable real-time content editing and preview capabilities
- **[Add Display Settings](./9-display-settings.md)** - Configure how your content is displayed across different contexts
