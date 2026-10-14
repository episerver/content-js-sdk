# Build navigation

Breadcrumbs and menus follow the page tree you build in Optimizely CMS. Instead of writing
the GraphQL for that tree yourself, you ask the client for a page's ancestors with
`getPath()` or its children with `getItems()`.

> **You will learn**
>
> - How to build breadcrumbs with `getPath()`
> - How to build a menu with `getItems()`
> - How to share one helper between both
> - How to keep navigation in one language
> - How to handle a page that doesn't exist

## Build breadcrumbs with `getPath()`

`getPath()` takes the URL path of a page and returns the pages above it, from the top-most
page down to the current one:

```tsx
// src/components/Breadcrumbs.tsx
import { getClient } from '@optimizely/cms-sdk';

export async function Breadcrumbs({ path }: { path: string }) {
  const ancestors = (await getClient().getPath(path)) ?? [];

  return (
    <nav aria-label='Breadcrumb'>
      <ol>
        {ancestors.map(({ _metadata }) => (
          <li key={_metadata?.key}>
            <a href={_metadata?.url?.hierarchical}>{_metadata?.displayName}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

Each item holds only `_metadata`, with the fields a link needs: `key`, `displayName`,
`locale`, `sortOrder`, `types` and `url` (`base`, `hierarchical` and `default`). Most of
them are optional in the returned type, hence the `?.`.

The first item is usually your start page and the last is the current page. Drop either
with `slice()` if your design doesn't show them.

## Build a menu with `getItems()`

`getItems()` returns the direct children of a page. Pass your start page to get the
top-level menu:

```tsx
// src/components/MainMenu.tsx
import { getClient } from '@optimizely/cms-sdk';

export async function MainMenu() {
  const children = (await getClient().getItems('/en/')) ?? [];

  return (
    <nav aria-label='Main'>
      <ul>
        {children.map(({ _metadata }) => (
          <li key={_metadata?.key}>
            <a href={_metadata?.url?.hierarchical}>{_metadata?.displayName}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

To match the order editors set in the CMS, sort the children by `_metadata.sortOrder`
before rendering them.

## Share one helper between both

Both methods return the same item shape. The SDK doesn't export a name for it, but you can
derive one from the method's return type and write a single helper that turns items into
links:

```ts
// src/lib/navigation.ts
import type { GraphClient } from '@optimizely/cms-sdk';

type PageLink = NonNullable<Awaited<ReturnType<GraphClient['getItems']>>>[number];

export type NavLink = { key: string; label: string; href: string };

export const toNavLinks = (pages: PageLink[]): NavLink[] =>
  pages.flatMap(({ _metadata }) =>
    _metadata?.url?.hierarchical ?
      [
        {
          key: _metadata.key,
          label: _metadata.displayName ?? '',
          href: _metadata.url.hierarchical,
        },
      ]
    : [],
  );
```

Pages without a URL are left out, so every `NavLink` is safe to render:

```tsx
// src/components/Breadcrumbs.tsx
import { getClient } from '@optimizely/cms-sdk';
import { toNavLinks } from '@/lib/navigation';

export async function Breadcrumbs({ path }: { path: string }) {
  const crumbs = toNavLinks((await getClient().getPath(path)) ?? []);

  return (
    <nav aria-label='Breadcrumb'>
      <ol>
        {crumbs.map(crumb => (
          <li key={crumb.key}>
            <a href={crumb.href}>{crumb.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## Keep navigation in one language

The path chooses which page to start from. The `locales` option chooses which language
versions of the linked pages come back. Without it, the results aren't filtered by
language, so a menu or breadcrumb can mix languages:

```ts
import { getClient } from '@optimizely/cms-sdk';

const locale = 'en';
const client = getClient();

const ancestors = await client.getPath('/en/about/team/', { locales: [locale] });
const children = await client.getItems('/en/', { locales: [locale] });
```

Pages that fall back to another language are included. Region codes such as `en-BE` work
as they are.

If you already have the page's key, for example from the
[request context](./request-context.md), pass a reference instead of a path. Its `locale`
then filters the results, unless you also set `locales`:

```ts
import { getClient } from '@optimizely/cms-sdk';

const children = await getClient().getItems({
  key: '880777d5a2824399b07e93e3ca70668e',
  locale: 'en',
});
```

Both methods also accept a `graph://` reference string and the per-request options such as
`host`. See [GraphClient](../reference/graph-client.md) for the full list.

## Handle a page that doesn't exist

Both methods return `null` when no page matches the path or reference, and an empty array
when the page exists but has no children. Check for `null` when the difference matters:

```tsx
// src/components/SectionMenu.tsx
import { getClient } from '@optimizely/cms-sdk';

export async function SectionMenu({ path }: { path: string }) {
  const children = await getClient().getItems(path);

  if (children === null) return <p>Page not found</p>;
  if (children.length === 0) return null;

  return (
    <ul>
      {children.map(({ _metadata }) => (
        <li key={_metadata?.key}>
          <a href={_metadata?.url?.hierarchical}>{_metadata?.displayName}</a>
        </li>
      ))}
    </ul>
  );
}
```

> [!WARNING]
>
> `getPath()` is meant for pages. If Graph returns no tree path for the content, for
> example because the key points at a component, it throws a `GraphResponseError` instead
> of returning `null`.

## Recap

- `getPath()` returns a page's ancestors, top-most first, including the page itself.
- `getItems()` returns a page's direct children.
- Each item holds `_metadata` with `key`, `displayName` and `url`. Derive its type from
  `GraphClient['getItems']`.
- Pass `locales` to keep navigation in one language.
- Both return `null` when the page doesn't exist.

## Related

- [GraphClient](../reference/graph-client.md)
- [Request context](./request-context.md)
- [Fetch content](../learn/fetch-content.md)
