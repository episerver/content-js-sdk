# Rich text

A rich text property holds formatted content, such as an article body, that editors write
in the Optimizely CMS editor. This page shows how to model one, fetch it and render it
with the `<RichText>` component, and how to replace the HTML it produces with your own
components.

> **You will learn**
>
> - How to add a rich text property to a content type
> - How to choose which format the SDK fetches
> - How to render rich text with `<RichText>`
> - How to replace the default elements
> - How to style text marks such as bold
> - What happens to elements the SDK doesn't recognise
> - Why content created with the Integration API can render differently

## Adding a rich text property

Give the property the type `'richText'`:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    body: {
      type: 'richText',
      displayName: 'Body',
    },
    summary: {
      type: 'richText',
      displayName: 'Summary',
      editorSettings: { preset: 'minimal' },
    },
  },
});
```

`editorSettings.preset` picks the toolbar editors see in the CMS:

| Preset       | Toolbar                                                             |
| ------------ | ------------------------------------------------------------------- |
| `'minimal'`  | Basic formatting: bold, italic, links and lists                     |
| `'default'`  | Common formatting options. Used when you leave `editorSettings` out |
| `'expanded'` | The full toolbar, including tables, media and code                  |

Use `'minimal'` for short fields such as summaries, and `'expanded'` for long-form content
that needs tables or embedded media.

## Choosing which format to fetch

Graph stores every rich text property in two formats: `html`, a string, and `json`, a
structured tree. Fetching both doubles the size of that field in every response, so the
SDK fetches only `json` by default. Change it with `fragment.richTextFormat`:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    richTextFormat: 'json', // 'json' | 'html' | 'both'
  },
});
```

| Value              | Fetches           | Use it when                                                         |
| ------------------ | ----------------- | ------------------------------------------------------------------- |
| `'json'` (default) | `json`            | You render with `<RichText>`                                        |
| `'html'`           | `html`            | You render the HTML string yourself, with `dangerouslySetInnerHTML` |
| `'both'`           | `json` and `html` | The same app needs both                                             |

> [!WARNING]
>
> `<RichText>` renders from `json` only. With `richTextFormat: 'html'`,
> `content.body.json` is `undefined` and `<RichText>` renders nothing, without an error.

## Rendering rich text

Pass the `json` field to `<RichText>`:

```tsx
// src/components/Article.tsx
import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    body: { type: 'richText', displayName: 'Body' },
  },
});

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  return (
    <article>
      <h1>{content.title}</h1>
      <RichText content={content.body?.json} />
    </article>
  );
}
```

Each node in the tree becomes a plain HTML element: a paragraph becomes `<p>`, a level-one
heading becomes `<h1>`, a link becomes `<a>`, and so on. Because `<RichText>` builds React
elements rather than parsing HTML, there is no `dangerouslySetInnerHTML` involved.

Any other prop you pass, such as `className` or the output of `pa()` for
[live preview](../learn/live-preview.md), wraps the output in a `<div>` with those
attributes:

```tsx
<RichText {...pa('body')} className='prose' content={content.body?.json} />
```

## Replacing the default elements

To change how an element renders, pass a component for its type in `elements`. The
component receives the rendered `children`, plus the original `element`:

```tsx
// src/components/ArticleBody.tsx
import {
  RichText,
  type ElementProps,
  type LinkElement,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function Heading({ children }: ElementProps) {
  return <h2 className='text-3xl font-bold'>{children}</h2>;
}

function ArticleLink({ element, children }: ElementProps) {
  const { url, target } = element as LinkElement;
  const isExternal = url.startsWith('http');

  return (
    <a href={url} target={target} rel={isExternal ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  );
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return (
    <RichText
      content={content}
      elements={{
        'heading-one': Heading,
        link: ArticleLink,
      }}
    />
  );
}
```

Every type you leave out keeps its default. The element types use the names from the CMS
tree, such as `paragraph`, `heading-one`, `bulleted-list` and `link`. See
[`<RichText>`](../reference/rich-text-component.md) for the full list.

## Styling text marks

Bold, italic and similar formatting are **marks** on a run of text, rendered by **leaf**
components. Pass your own in `leafs`:

```tsx
import {
  RichText,
  type LeafProps,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function Bold({ children }: LeafProps) {
  return <strong className='font-semibold text-slate-900'>{children}</strong>;
}

function InlineCode({ children }: LeafProps) {
  return <code className='rounded bg-slate-100 px-1 font-mono text-sm'>{children}</code>;
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} leafs={{ bold: Bold, code: InlineCode }} />;
}
```

The built-in marks are `bold`, `italic`, `underline`, `strikethrough` and `code`. When a
run of text has several marks, each leaf wraps the previous one.

## Elements the SDK doesn't recognise

An element type that has no default and no entry in `elements` renders as a `<span>`, with
its attributes dropped. A mark with no leaf also renders as a `<span>`. A `<span>` is
valid anywhere, so unknown content never breaks the page or causes a hydration error.

To render an unknown type properly, add it to `elements` (or `leafs`) under its type name.
Custom fields on the node are available on `element`:

```tsx
import {
  RichText,
  type ElementProps,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function Callout({ element, children }: ElementProps) {
  const variant = typeof element.variant === 'string' ? element.variant : 'info';

  return <aside className={`callout callout-${variant}`}>{children}</aside>;
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} elements={{ 'callout-box': Callout }} />;
}
```

SVG isn't supported by default, because it needs its own child elements and attributes.
Upload SVGs as image assets instead, or handle them with a custom element.

## Content created with the Integration API

Rich text written in the CMS editor goes through the editor's own processing, which
validates the HTML, normalises attributes and strips unsafe markup. Rich text created
through the Integration API (the CMS REST API) skips that step, so it can contain things
the editor would never produce:

- **Unknown element types.** They render as `<span>`. Add them to `elements`.
- **Attributes and inline styles the SDK doesn't map.** A CSS property that isn't in the
  SDK's list stays an HTML attribute and has no visual effect. Read it from the
  `attributes` prop in a custom element.
- **Invalid or unsafe HTML.** The SDK doesn't sanitise content. Validate it before you
  create it.

For the most predictable rendering, create rich text in the CMS editor. The reference
lists
[which attributes and CSS properties the SDK converts](../reference/rich-text-component.md).

## Recap

- Model rich text with `type: 'richText'`, and pick an editor toolbar with
  `editorSettings.preset`.
- The SDK fetches `json` by default, which is what `<RichText>` needs. Change it with
  `fragment.richTextFormat`.
- Render with `<RichText content={content.body?.json} />`.
- Replace elements with `elements` and marks with `leafs`. Anything unknown renders as a
  `<span>`.

## Related

- [`<RichText>` reference](../reference/rich-text-component.md)
- [Property types](../reference/property-types.md)
- [Render with React](../learn/render-with-react.md)
- [`config()` reference](../reference/config.md)
