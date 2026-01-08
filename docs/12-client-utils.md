# GraphClient Utility Functions

The Optimizely CMS SDK provides utility functions to help you navigate and structure your site. These functions are available through the `GraphClient` instance and are particularly useful for building navigation menus, breadcrumbs, and understanding page hierarchies.

## getPath()

The `getPath()` method returns the ancestor pages of a given page, from the root down to the current page. This is useful for building breadcrumb navigation.

### Signature

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
import { GraphClient } from '@optimizely/cms-sdk';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);

export default async function Page() {
  const currentPath = '/en/about/our-team';

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

The `getItems()` method returns the direct child pages of a given page. This is useful for building navigation menus and site maps.

### Signature

```typescript
async getItems(path: string, options?: GraphGetLinksOptions): Promise<Array<PageMetadata> | null>
```

### Parameters

- **`path`** - The URL path of the parent page (e.g., `/en/`)
- **`options`** (optional)
  - **`host`** - The host URL for filtering
  - **`locales`** - Array of locale codes to filter by

### Returns

An array of child page metadata objects, or `null` if the parent page doesn't exist.

### Example: Building Navigation

```tsx
import { GraphClient } from '@optimizely/cms-sdk';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);

export default async function Navigation() {
  // Get all direct children of the start page
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

## Combined Example: Full Navigation

Here's a complete example using both functions to build breadcrumbs and primary navigation:

```tsx
import { GraphClient } from '@optimizely/cms-sdk';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);

export default async function Layout({ currentPath }: { currentPath: string }) {
  // Get ancestors for breadcrumbs
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

Both functions support filtering by locale, which is useful for multi-language sites:

```tsx
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

Both functions return `null` if the requested page doesn't exist:

```tsx
const ancestors = await client.getPath('/non-existent-page');

if (ancestors === null) {
  // Page doesn't exist, handle accordingly
  return <div>Page not found</div>;
}

// Safe to use ancestors
const breadcrumbs = ancestors.map(/* ... */);
```
