# Preview a component on its own

A **component preview** renders one component on a page of its own, with no header, no
navigation and nothing else around it. The CMS embeds that page in an iframe to show
editors what a component looks like before they place one, and a screenshot tool loads it
to build thumbnails.

The page measures itself and reports its size, because a page cannot measure across
origins. This guide covers both ends: serving the preview, and reading what it says.

> **You will learn**
>
> - How to serve the preview route
> - How to choose which component the URL shows
> - How to say who may read a preview's measurements
> - How to read the measurements in an embedding page
> - How to read them from a screenshot tool, which embeds nothing
> - How to avoid the resize loop

## Serve the preview route

`createStandalonePreview()` builds the page. Mount it wherever your framework puts
routes:

```tsx
// app/preview/component/page.tsx
import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';
import { faker } from '@faker-js/faker';

export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: faker,
});
```

The page needs React Server Components: it returns an async server component, and reports
its size from a client component. Next's App Router works; its Pages Router and plain
client-side React do not. Nothing in it imports Next.

Components render with **stand-in content** built from the content type's schema, so a
component previews before any editor has authored one. See
[Mock content](./mock-content.md) for what fills it.

## Choose the component with the URL

```text
/preview/component
  ?type=HeadingElement      which component
  &template=HeadingStyles   optional: render through a display template
  &level=h3                 optional: any display setting, by name
  &loc=en                   optional: the locale to render in
```

**Any parameter the page does not read itself becomes a display setting.** That is how
one URL shows one variant:

```text
?type=ButtonElement&template=ButtonStyles&variant=primary
```

Naming the display template matters. With it, the page applies the template's tag and the
defaults for its other settings, which is what an editor sees. A bare setting on its own
overrides that one value and nothing else.

The route serves generated content only. It takes no preview token and does no
authorization, so there is nothing on it to protect.

## Say who may read the measurements

A preview reports to **one** origin, and the site decides which — an embedder cannot ask
to be told. That origin is `OPTIMIZELY_CMS_URL` by default, so for the CMS there is
nothing to configure.

To report somewhere else, such as a local preview tool, name it:

```tsx
createStandalonePreview({ parentOrigin: 'http://localhost:5173' });
```

With neither, the component still renders but reports nothing, and the embedder is left
guessing. In development the frame logs a warning in its own console saying so.

This decides who may *hear* a preview. A `frame-ancestors` CSP is what decides who may
frame the page at all — get that wrong and the tile is blank, with no message from the
SDK.

## Read the measurements in an embedding page

The preview posts `dimensions` once it has settled — fonts loaded, images decoded — and
again whenever its box moves by 8px or more. The payload is the **component's** box, not
the page's.

```ts
import {
  isPreviewMessage,
  isValidDimensions,
  PreviewMessageType,
} from '@optimizely/cms-sdk/protocol';

window.addEventListener('message', event => {
  // Ours? The channel is shared with every library on the page.
  if (!isPreviewMessage(event.data)) return;
  // From the site we embedded, and from this frame? Every frame sees every message.
  if (event.origin !== siteOrigin) return;
  if (event.source !== frame.contentWindow) return;

  if (event.data.type === PreviewMessageType.error) {
    showError(event.data.payload.message); // untrusted text: render as text, never HTML
    return;
  }

  // A broken component can report anything.
  if (!isValidDimensions(event.data.payload)) return;

  const { width, height, offsetX, offsetY } = event.data.payload;
  scaleTile({ width, height, offsetX, offsetY });
});
```

There is no separate `ready` message. The first `dimensions` **is** the readiness signal;
the rest are changes. Your page already knows which it is, because it is the first if
nothing has arrived yet.

When you resize a frame yourself, say so. The preview watches its own box, not yours, and
a change smaller than 8px is treated as jitter:

```ts
frame.contentWindow.postMessage(
  { type: PreviewMessageType.measure, version: 1 },
  siteOrigin,
);
```

You get a `dimensions` back whether or not anything moved.

## Read them from a screenshot tool

A screenshot runner loads the preview as a page of its own, so `postMessage` reaches
nobody. The same measurement is written onto the preview element:

| Attribute | |
| --- | --- |
| `data-preview-ready` | Present once a measurement has been taken |
| `data-preview-width` / `-height` | The component's box, in CSS pixels |
| `data-preview-offset-x` / `-offset-y` | Where that box sits on the page |
| `data-preview-error` | Present instead when the component could not render |

Those four numbers are a clip rectangle:

```ts
await page.waitForSelector('[data-preview-ready]');

const box = await page.$eval('#optimizely-preview', element => ({
  x: +element.dataset.previewOffsetX,
  y: +element.dataset.previewOffsetY,
  width: +element.dataset.previewWidth,
  height: +element.dataset.previewHeight,
}));

await page.screenshot({ clip: box });
```

Without the clip you capture the whole viewport and get a component adrift in white
space. Without the wait you capture it half-painted — and a cached thumbnail of a
half-painted component is wrong forever.

The viewport is the layout width, so it decides which breakpoint you capture. The same
card reports 811×784 at a 1280px viewport and 178×177 at 343px.

## Avoid the resize loop

**Never resize the frame because a message told you a new size.** The component reflows
at its new width, reports a different height, you resize again, and it never settles.

Give the frame a fixed size and scale it with a CSS `transform`. A transform is
paint-only: it changes nothing about layout, so the component cannot reflow because you
scaled it.

Resizing a frame for your own reasons — a dragged panel, a breakpoint toggle — is fine.
That is not a response to a message, so there is no loop. Send `measure` afterwards.

## Recap

- `createStandalonePreview()` serves one component on a page of its own.
- `?type=` picks the component; unrecognised parameters become display settings.
- `parentOrigin` names the one origin allowed to hear a measurement.
- The first `dimensions` means it has settled; later ones mean it moved.
- Tools that cannot listen read the same numbers off `data-preview-*` attributes.
- Scale frames with a transform, never by resizing them in response to a message.

**Related:**

- [Mock content](./mock-content.md): what fills a component that nobody has authored
- [Display templates](./display-templates.md): the variants a preview URL can ask for
- [Live preview](../learn/live-preview.md): previewing a whole page as an editor edits it
