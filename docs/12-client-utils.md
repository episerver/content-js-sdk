# GraphClient Utility Functions

The Optimizely CMS SDK provides utility functions to help you navigate and structure your site. These functions are available through the `GraphClient` instance and are particularly useful for building navigation menus, breadcrumbs, and understanding page hierarchies.

> [!TIP]
> Consider using `config()` in your app's entry point to configure the client globally and then `getClient()` to get a pre-configured client. Manually constructing a client with `new GraphClient()` is still fully supported. See [Fetching Content](./5-fetching.md#why-use-getclient-instead-of-new-graphclient).

## Which one to use

| You need | Use |
| --- | --- |
| Ancestors of a page — breadcrumbs | [`getPath()`](#getpath) |
| Direct children, one level — a top nav, a section listing | [`getItems()`](#getitems) |
| Two or more levels — a whole-site menu, a sitemap | [`getDescendants()`](#getdescendants) |

The choice between `getItems()` and `getDescendants()` is only about depth.

`getItems()` returns one level, so a recursive walk to build a tree costs one request per page, and each level waits for the one above it. Use `getDescendants()` instead — it returns the whole subtree in a single request.

The reverse is also true: `getDescendants()` fetches every page below the ancestor, however deep. Rendering four top-level links under a root with 3,000 descendants would download all 3,000. When one level is all you need, `getItems()` is both smaller and cheaper.

## getPath()

The `getPath()` method returns the ancestor pages of a given page, from the root down to the current page. This is useful for building breadcrumb navigation.

### getPath() Signature

```typescript
async getPath(path: string, options?: GraphGetLinksOptions): Promise<Array<PageMetadata> | null>
```

### Parameters

- **`path`** - The URL path of the page (e.g., `/en/about/team`)
- **`options`** (optional)
  - **`host`** - The host URL for filtering
  - **`locales`** - Array of locale codes to filter by

### Returns

An array of page metadata objects sorted from root to the current page, or `null` if the page doesn't exist.

### Example: Building Breadcrumbs

```tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function Page() {
  const currentPath = '/en/about/our-team';

  const client = getClient();

  // Get all ancestor pages
  const ancestors = (await client.getPath(currentPath)) || [];

  // Filter out the start page (first item) and create breadcrumbs
  const breadcrumbs = ancestors.slice(1).map((ancestor: any) => ({
    key: ancestor._metadata.key,
    label: ancestor._metadata.displayName,
    href: ancestor._metadata.url.hierarchical,
  }));

  return (
    <nav aria-label="Breadcrumb">
      <ol>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.key}>
            <a href={crumb.href}>{crumb.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## getItems()

The `getItems()` method returns the direct child pages of a given page — one level, no deeper. This is useful for a single-level menu.

> [!TIP]
> For more than one level, use [`getDescendants()`](#getdescendants) — see [Which one to use](#which-one-to-use).

### Signature

```typescript
async getItems(path: string, options?: GraphGetLinksOptions): Promise<Array<PageMetadata> | null>
```

### Input Parameters

- **`path`** - The URL path of the parent page (e.g., `/en/`)
- **`options`** (optional)
  - **`host`** - The host URL for filtering
  - **`locales`** - Array of locale codes to filter by

### Output

An array of child page metadata objects, or `null` if the parent page doesn't exist.

### Example: Building Navigation

```tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function Navigation() {
  // Get all direct children of the start page
  const client = getClient();
  const navLinks = (await client.getItems('/en/')) ?? [];

  // Create navigation from child pages
  const navigations = navLinks.map((item: any) => ({
    key: item._metadata.key,
    label: item._metadata.displayName,
    href: item._metadata.url.hierarchical,
  }));

  return (
    <nav>
      <ul>
        {navigations.map((nav) => (
          <li key={nav.key}>
            <a href={nav.href}>{nav.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## getDescendants()

The `getDescendants()` method returns **every** page below a given page, at any depth, as a flat list. Use it for whole-site menus, sitemaps, and any other tree you need in one go.

> [!IMPORTANT]
> Do not build a tree by calling `getItems()` recursively — see [Which one to use](#which-one-to-use).

### getDescendants() Signature

```typescript
async getDescendants(
  input: string | GraphReference,
  options?: GraphGetLinksOptions
): Promise<Array<PageMetadata> | null>
```

### getDescendants() Parameters

- **`input`** - URL path, `GraphReference` object, or `graph://` string identifying the ancestor page
- **`options`** (optional)
  - **`host`** - The host URL for filtering
  - **`locales`** - Array of locale codes to filter by

### getDescendants() Output

A flat array of page metadata for every descendant, sorted by `sortOrder` so items appear in the order set in the CMS. The ancestor itself is not included. Returns `null` if the ancestor doesn't exist.

Each item carries `_metadata.container` — the key of its parent — which is what you use to rebuild the hierarchy:

```jsonc
{
  "_metadata": {
    "key": "90969695c40540808a75193d4b0936c3",
    "container": "a8ff42c351e74f65a2f26223950c54ab", // parent page
    "sortOrder": 200,
    "displayName": "Subscriptions",
    "types": ["ProductPage", "_Experience", "_Page", "_Content", "_Item"],
    "url": { "default": "/en/subscriptions/", "hierarchical": "/en/subscriptions/", "base": "https://example.com" }
  }
}
```

### Example: Building a Nested Menu

```tsx
import { getClient } from '@optimizely/cms-sdk';

type MenuItem = {
  key: string;
  label: string;
  href: string;
  children: MenuItem[];
};

export default async function SiteMenu({ rootKey }: { rootKey: string }) {
  const client = getClient();
  const pages = (await client.getDescendants({ key: rootKey, locale: 'en' })) ?? [];

  // Create a node per page, then hang each one off its parent
  const nodes = new Map<string, MenuItem>(
    pages.map((page: any) => [
      page._metadata.key,
      {
        key: page._metadata.key,
        label: page._metadata.displayName,
        href: page._metadata.url.default,
        children: [],
      },
    ])
  );

  const topLevel: MenuItem[] = [];

  for (const page of pages as any[]) {
    const node = nodes.get(page._metadata.key)!;
    const parent = nodes.get(page._metadata.container);

    if (parent) parent.children.push(node);
    else topLevel.push(node);
  }

  const render = (items: MenuItem[]) => (
    <ul>
      {items.map((item) => (
        <li key={item.key}>
          <a href={item.href}>{item.label}</a>
          {item.children.length > 0 && render(item.children)}
        </li>
      ))}
    </ul>
  );

  return <nav aria-label="Site Menu">{render(topLevel)}</nav>;
}
```

### Request Cost

- **One request** when you pass a `GraphReference` or a `graph://` string, since those already carry the content key.
- **Two requests** when you pass a URL path — one to resolve the path to a key, then the subtree.
- **One extra request per 100 descendants.** Graph caps a result page at 100 items; `getDescendants()` pages through the rest for you.

> [!TIP]
> Rendering a page already fetched its own ancestors: `_metadata.path` holds the keys from the site root down to the page. Read `path[0]` to get the root key and pass it as a `GraphReference`, instead of calling `getPath()` for something you already have.

## Combined Example: Full Navigation

Here's a complete example using both functions to build breadcrumbs and primary navigation:

```tsx
import { getClient } from '@optimizely/cms-sdk';

export default async function Layout({ currentPath }: { currentPath: string }) {
  // Get ancestors for breadcrumbs
  const client = getClient();
  const ancestors = (await client.getPath(currentPath)) || [];
  const breadcrumbs = ancestors.slice(1).map((ancestor: any) => ({
    key: ancestor._metadata.key,
    label: ancestor._metadata.displayName,
    href: ancestor._metadata.url.hierarchical,
  }));

  // Get main navigation items
  const navLinks = (await client.getItems('/en/')) ?? [];
  const navigations = navLinks.map((item: any) => ({
    key: item._metadata.key,
    label: item._metadata.displayName,
    href: item._metadata.url.hierarchical,
  }));

  return (
    <div>
      {/* Primary Navigation */}
      <nav aria-label="Main Navigation">
        <ul>
          {navigations.map((nav) => (
            <li key={nav.key}>
              <a href={nav.href}>{nav.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <ol>
          {breadcrumbs.map((crumb) => (
            <li key={crumb.key}>
              <a href={crumb.href}>{crumb.label}</a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
```

## Filtering by Locale

All three functions support filtering by locale, which is useful for multi-language sites:

```tsx
const client = getClient();
// Get navigation items only in English and French
const navLinks = await client.getItems('/en/', {
  locales: ['en', 'fr'],
});

// Get breadcrumbs filtered by locale
const ancestors = await client.getPath('/en/about/team', {
  locales: ['en'],
});
```

## Error Handling

All three functions return `null` if the requested page doesn't exist:

```tsx
const client = getClient();
const ancestors = await client.getPath('/non-existent-page');

if (ancestors === null) {
  // Page doesn't exist, handle accordingly
  return <div>Page not found</div>;
}

// Safe to use ancestors
const breadcrumbs = ancestors.map(/* ... */);
```
