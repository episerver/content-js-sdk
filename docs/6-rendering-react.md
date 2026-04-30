# Rendering (with React)

In this page you will learn how to create a React component for your content type and how to render it.

## Step 1. Create a React component for Article

Open the `src/app/components/Article.tsx` file and add the following

```tsx
import { ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

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
import {
  OptimizelyComponent,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import React from 'react';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function Page({ params }: Props) {
  const { slug } = await params;

  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  return <OptimizelyComponent content={content[0]} />;
}

export default withAppContext(Page);
```

### Using `getClient()` Instead

Recommended approach: configure client once in your app's entry point, for example the root layout, then use `getClient()` everywhere.

**In `layout.tsx`:**

```tsx
import Article, { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry, config } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

// Configure client once
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

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

**In `page.tsx`:**

```tsx
import { getClient } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function Page({ params }: Props) {
  const { slug } = await params;

  const client = getClient(); // No env vars needed
  const content = await client.getContentByPath(`/${slug.join('/')}/`);

  return <OptimizelyComponent content={content[0]} />;
}

export default withAppContext(Page);
```

**Benefits:**

- Single config point - change API key in one place
- Cleaner page components - no env vars passed around
- Easier maintenance

See [Fetching Content](./5-fetching.md#why-use-getclient-instead-of-new-graphclient) for full details.

---

Go again to <http://localhost:3000/en>. You should see your page

### Understanding `withAppContext`

The `withAppContext` HOC wraps your page component to provide request-scoped context:

```tsx
export async function Page({ params }: Props) {
  // ... component logic
}

export default withAppContext(Page);
```

**What it does:**

**Initializes context storage** - Sets up isolated, request-scoped storage for context data. This is required when using the context system in React Server Components. The context created is for the current routed content and lives only for the duration of the current request.

**When do you need it:**

Use `withAppContext` when you need request-scoped context storage:

- To manually set context data via `setContext()` for the current request
- To ensure context is available throughout the component tree
- When you need to pass content metadata or request-specific data to nested components

**Benefits:**

- **Request isolation** - Each request gets its own context storage for the routed content (critical for server components). Context data is scoped per request and automatically cleaned up when the request completes.
- **No prop drilling** - Access context data anywhere in your component tree
- **Framework-agnostic** - Works with any React Server Components framework

### Accessing Context in Components

Any component can access the context data without props:

```tsx
import { getContext } from '@optimizely/cms-sdk/react/server';

export function MyComponent() {
  const context = getContext();

  // Access preview token, locale, etc.
  const locale = context?.locale ?? 'en-US';
  const isPreview = !!context?.preview_token;

  return <div>Locale: {locale}</div>;
}
```

**How context is populated:**

Use `setContext()` to populate context data with information from your content:

```tsx
setContext({
  currentContent: content[0],
  locale: content[0]?._metadata?.locale,
  type: content[0]?.__typename,
  key: content[0]?._metadata?.key,
});
```

This is particularly useful for:

- Displaying locale-specific formatting
- Accessing content metadata in nested components without prop drilling

## Next steps

You have finished 🎉!

This is the end of the tutorial on how to create your first website using Optimizely CMS SaaS.

You can continue exploring these topics:

- **[Add Experiences](./8-experiences.md)** - Learn how to create personalized content experiences for different audiences
- **[Add Live Preview](./7-live-preview.md)** - Enable real-time content editing and preview capabilities
- **[Add Display Settings](./9-display-settings.md)** - Configure how your content is displayed across different contexts
