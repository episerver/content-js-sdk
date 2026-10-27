# Request context

Some information belongs to the request rather than to any one piece of content: the
preview token, the locale, whether the editor is in edit mode. **Request context** lets
any server component read that information without it being passed down as props through
every level of the tree.

> **You will learn**
>
> - What the context holds and what fills it
> - How to read it in a component
> - How to add your own data
> - When to use `withAppContext`

## What the context holds

| Key              | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| `previewToken`   | The preview token, when the page is rendered for live preview |
| `mode`           | The CMS context the preview was opened in, such as `'edit'`   |
| `version`        | The content version being previewed                           |
| `locale`         | The locale of the content                                     |
| `key`            | The key of the content                                        |
| `type`           | The content type of the content                               |
| `currentContent` | The content being rendered, if you store it                   |

`getPreviewContent()` fills in everything except `currentContent` from the preview URL. On
a normal page the context starts empty, and you fill it yourself if you need it.

The SDK reads the context too. For example, `<RichText>` appends the preview token to
image URLs when the preview was fetched with `usePreviewToken: true`.

## Read it in a component

`getContextData(key)` returns a single value:

```tsx
// src/components/PublishDate.tsx
import { getContextData } from '@optimizely/cms-sdk/react/server';

export function PublishDate({ date }: { date: Date }) {
  const locale = getContextData('locale') ?? 'en';

  return <time>{date.toLocaleDateString(locale)}</time>;
}
```

`getContext()` returns the whole object, which is handy when you need several values at
once:

```tsx
// src/components/PreviewBanner.tsx
import { getContext } from '@optimizely/cms-sdk/react/server';

export function PreviewBanner() {
  const context = getContext();

  if (!context?.previewToken) return null;

  return <div className='preview-banner'>Preview, locale {context.locale}</div>;
}
```

## Add your own data

On public pages, store whatever your components need with `setContext()`. It merges into
the existing context:

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent, setContext } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [content] = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (!content) notFound();

  setContext({
    currentContent: content,
    locale: content._metadata?.locale ?? undefined,
    key: content._metadata?.key ?? undefined,
  });

  return <OptimizelyComponent content={content} />;
}
```

Every component rendered below this page can now read the locale and the current content.
Use `setContextData(key, value)` to set a single value.

## Start each page with a clean context

Wrap a page component with `withAppContext` to start it with an empty context:

```tsx
import { withAppContext } from '@optimizely/cms-sdk/react/server';

async function Page() {
  // …
}

export default withAppContext(Page);
```

The context is stored with React's `cache()`, which is already scoped to a single server
request. `withAppContext` makes the starting point explicit, so a page never sees values
set earlier in the same request. Always use it on the preview route, and on any page that
writes to the context.

> [!WARNING]
>
> Request context is available in **server components only**. A client component
> (`'use client'`) can't read it, so pass it the values it needs as props.

<details>
<summary><b>Deep dive:</b> Using request context outside React</summary>

Importing `@optimizely/cms-sdk/react/server` sets up the React storage automatically. In
other frameworks, configure an adapter yourself, such as `MemoryAdapter` backed by Node's
`AsyncLocalStorage`, and run each request inside it. See
[The framework-agnostic core](./framework-agnostic-core.md).

</details>

## Recap

- Request context holds per-request data such as the preview token and locale.
- `getPreviewContent()` fills it on the preview route. Use `setContext()` to fill it on
  other pages.
- Read it with `getContextData(key)` or `getContext()`, in server components only.
- Wrap pages that write to it, and the preview route, with `withAppContext`.

## Related

- [Live preview](../learn/live-preview.md)
- [React components reference](../reference/react-components.md)
- [Rich text](./rich-text.md)
