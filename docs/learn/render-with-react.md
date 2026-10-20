# Render with React

You can fetch the article, but it shows up as raw JSON. On this page you write a React
component for the `Article` content type and let the SDK pick it whenever an article needs
rendering.

Not using React? Everything these components do is also available without a framework, in
[the framework-agnostic core](../guides/framework-agnostic-core.md).

> **You will learn**
>
> - How to write a typed component for a content type
> - How to register it
> - How `OptimizelyComponent` chooses the component to render

## Write a component for Article

Add a component to `src/components/Article.tsx`, below the content type:

```tsx
// src/components/Article.tsx
import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    body: { type: 'richText', displayName: 'Body' },
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

- `ContentProps<typeof ArticleContentType>` turns the content type definition into a
  TypeScript type. Your editor knows that `content.heading` is a string and autocompletes
  every property.
- `<RichText>` renders the rich text body as React elements. You can swap in your own
  components for headings, links and so on. See [Rich text](../guides/rich-text.md).

## Register the component

Add the component to `src/lib/optimizely.ts`:

```ts
// src/lib/optimizely.ts
import { config, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article, { ArticleContentType } from '@/components/Article';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
});

initContentTypeRegistry([ArticleContentType]);

initReactComponentRegistry({
  resolver: {
    Article,
  },
});
```

The `resolver` maps content type keys to components. `{ Article }` is short for
`{ Article: Article }`: content of type `Article` renders with the `Article` component.

## Render the page

In `src/app/[...slug]/page.tsx`, replace the JSON with `OptimizelyComponent`:

```diff
- return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
+ return <OptimizelyComponent content={content[0]} />;
```

The whole file:

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (content.length === 0) notFound();

  return <OptimizelyComponent content={content[0]} />;
}
```

Open <http://localhost:3000/en/> again. You now see your article as a page.

`OptimizelyComponent` reads the content's type, looks it up in the resolver and renders
the matching component. The page doesn't need to know which content type lives at a URL.
When you add more content types, register their components and this one route renders all
of them.

<details>
<summary><b>Deep dive:</b> What happens if no component is registered for a content type?</summary>

Instead of crashing the page, `OptimizelyComponent` renders a placeholder in development:
**No component found for content type Article**. In production it renders nothing.
Register a component under that key to fix it. The same lookup also handles display
template variants: a content type can have several components, picked by a tag. See
[Display templates](../guides/display-templates.md).

</details>

## Recap

- Write one component per content type and type its props with `ContentProps<typeof X>`.
- Register components with `initReactComponentRegistry({ resolver: { … } })`, keyed by
  content type key.
- `<OptimizelyComponent content={…} />` renders any content with the right component.

You now have a site that renders CMS content. The last step lets editors see their changes
before they publish.

**Next:** [Live preview →](./live-preview.md)
