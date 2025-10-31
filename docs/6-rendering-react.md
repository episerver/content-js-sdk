# Rendering (with React)

In this page you will learn how to create a React component for your content type and how to render it.

## Step 1. Create a React component for Article

Open the `src/app/components/Article.tsx` file and add the following

```tsx
import { RichText } from '@episerver/cms-sdk/react/richText';

type Props = {
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1>{opti.heading}</h1>
      <RichText content={opti.body?.json} />
    </main>
  );
}
```

> [!TIP]
> Using the `<RichText/>` component is the recommended way to render rich text content. It's safer than `dangerouslySetInnerHTML` as it doesn't rely on HTML parsing, and allows you to customize how elements are rendered with your own React components.

### Customizing Rich Text Elements

You can customize how specific elements are rendered by providing custom components:

```tsx
import { RichText, type ElementProps } from '@episerver/cms-sdk/react/richText';

// Custom heading renderer
const CustomHeading = (props: ElementProps) => (
  <h2 style={{ color: 'blue', fontSize: '1.8rem' }}>{props.children}</h2>
);

// Custom link renderer
const CustomLink = (props: ElementProps) => (
  <a
    href={props.element.url}
    style={{ color: 'purple', textDecoration: 'underline' }}
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
);

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1>{opti.heading}</h1>
      <RichText
        content={opti.body?.json}
        elements={{
          'heading-two': CustomHeading,
          link: CustomLink,
        }}
      />
    </main>
  );
}
```

> [!NOTE]
> For comprehensive documentation on the RichText component including all props, advanced customization options, fallback handling, and TypeScript support, see the [RichText Component Reference](./6.1-richtext-component-react.md).

The entire file should look like this:

```tsx
import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof ArticleContentType>;
};

export default function Article({ opti }: Props) {
  return (
    <main>
      <h1>{opti.heading}</h1>
      <RichText content={opti.body?.json} />
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
+ return <OptimizelyComponent opti={content[0]} />;
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
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
  });
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  return <OptimizelyComponent opti={content[0]} />;
}
```

Go again to http://localhost:3000/en. You should see your page

## Next steps

You have finished 🎉!

This is the end of the tutorial on how to create your first website using Optimizely CMS SaaS.

You can continue exploring these topics:

- Add live preview _(under construction)_
- Add Experiences _(under construction)_
