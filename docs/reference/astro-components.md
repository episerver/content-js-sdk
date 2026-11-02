# Astro components

Components for Astro sites. Astro renders your CMS content with the UI framework of your
choice, such as React or Svelte. These components handle what sits around it.

| Entry point                 | Exports             |
| --------------------------- | ------------------- |
| `@optimizely/cms-sdk/astro` | `OptimizelyPreview` |

## OptimizelyPreview

```astro
---
import { OptimizelyPreview } from '@optimizely/cms-sdk/astro';
---
```

Refreshes the preview when an editor saves in the CMS, without reloading the page. Use it
on your preview route, wrapped around the rendered content.

```astro
<OptimizelyPreview cmsUrl={import.meta.env.OPTIMIZELY_CMS_URL}>
  <ContentPage content={content} />
</OptimizelyPreview>
```

### Reference

#### Props

- `cmsUrl` — the base URL of your CMS instance, as a string or a `URL`. The component
  loads the communication injector script from it.
- Any other attribute, such as `class`, is set on the element that wraps the content.

#### Slots

- default — the rendered content. This is the part that refreshes.
- `loading` (optional) — shown while a refresh is in progress, such as a spinner.

#### Caveats

- It loads the communication injector script itself. Don't add a second one to the page.
- On save, it patches the wrapped content in place with
  [`refreshInPlace`](../guides/framework-agnostic-core.md#refreshing-without-a-client-side-router),
  which describes what survives a refresh and when it reloads the page instead. Anything
  outside the component keeps its first render.
- Hydrated islands inside the content keep their state. When their props change, they
  re-render with the new props. Islands that leave the page are unmounted.
- It runs no UI framework in the browser, so it works the same with React, Svelte or plain
  Astro components.

### Usage

#### Adding it to the preview route

```astro
---
// src/pages/preview.astro
import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyPreview } from '@optimizely/cms-sdk/astro';
import Layout from '../layouts/Layout.astro';
import ContentPage from '../components/ContentPage';
import '../lib/optimizely'; // calls config() and registers your components

export const prerender = false;

const previewParams = Object.fromEntries(Astro.url.searchParams);
const content = await getClient().getPreviewContent(previewParams as PreviewParams);
---

<Layout>
  <OptimizelyPreview cmsUrl={import.meta.env.OPTIMIZELY_CMS_URL}>
    <ContentPage content={content} />
  </OptimizelyPreview>
</Layout>
```

`prerender = false` renders the page on every request, which the preview needs because
each request carries a different draft. `ContentPage` stands for whatever renders your
content, such as a React component that returns `<OptimizelyComponent>`.

#### Showing a loading indicator

```astro
<OptimizelyPreview cmsUrl={import.meta.env.OPTIMIZELY_CMS_URL}>
  <p slot="loading" class="preview-loading">Updating…</p>
  <ContentPage content={content} />
</OptimizelyPreview>
```

A refresh usually takes a few hundred milliseconds. To avoid a flash on quick refreshes,
fade the indicator in after a short delay with CSS.

## Troubleshooting

### The whole page reloads on every save

**Cause:** One of the fallbacks applies:

- The saved content's preview URL points at a different path than the current page. The
  preview URL format in the CMS application settings decides that path.
- The fetched page has no `OptimizelyPreview`, for example because it's rendered
  conditionally.
- The request for the new preview URL fails. Check the browser's network tab.

**Fix:** Render `OptimizelyPreview` unconditionally on the route the preview URL points
at.
