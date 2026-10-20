# DAM assets

When Optimizely CMS is connected to the Optimizely Content Marketing Platform (CMP),
editors can pick images, videos and files from its digital asset management (DAM) library.
The SDK fetches the asset's details, such as its renditions and alt text, and gives you
helpers to render them.

> **You will learn**
>
> - What a DAM asset looks like in your content
> - How the SDK decides whether to fetch DAM fields
> - How to render a responsive image
> - How to set alt text
> - How to handle images, videos and files in one property
> - How to use DAM images with Next.js `Image`

## What a DAM asset looks like

Editors pick a DAM asset in a `contentReference` property:

```tsx
// src/components/Hero.tsx
import { contentType } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    image: {
      type: 'contentReference',
      displayName: 'Image',
      allowedTypes: ['_image'],
    },
  },
});
```

When the editor picks a DAM asset, `content.image.item` holds it. Its `__typename` tells
you which kind of asset it is, and which fields it has:

| `__typename`             | Kind  | Fields                                                                           |
| ------------------------ | ----- | -------------------------------------------------------------------------------- |
| `cmp_PublicImageAsset`   | Image | The common fields, plus `AltText`, `Width`, `Height`, `Renditions`, `FocalPoint` |
| `cmp_PublicVideoAsset`   | Video | The common fields, plus `AltText`, `Renditions`                                  |
| `cmp_PublicRawFileAsset` | File  | The common fields only                                                           |

The common fields are `Url`, `Title`, `Description`, `MimeType` and `Tags`. Each entry in
`Renditions` has `Id`, `Name`, `Url`, `Width` and `Height`. Every field can be `null`.

When the editor picks an image from the CMS's own media library instead, `item` is `null`
and the URL is in `content.image.url.default`. The `src()` helper used below handles both.

## Controlling whether DAM fields are fetched

By default, the SDK checks whether your Graph schema has DAM types and, if it does, adds
the asset fields to every `contentReference` property it queries. The check rides on a
request the SDK already makes, so it costs no extra round trip.

Set `fragment.dam` to skip the check:

```ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    dam: 'on', // 'automatic' | 'on' | 'off'
  },
});
```

| Value                   | Behaviour                                      |
| ----------------------- | ---------------------------------------------- |
| `'automatic'` (default) | Fetch DAM fields when the schema has DAM types |
| `'on'`                  | Always fetch them                              |
| `'off'`                 | Never fetch them. `item` is never populated    |

The setting shapes the generated query, so it applies to every request the client makes.
You can't change it for a single request.

## Rendering a responsive image

Use `src()` from `getPreviewUtils()` for the URL and `getSrcset()` from `damAssets()` for
the renditions. Both add the preview token when an editor previews the page, so that
unpublished assets load:

```tsx
// src/components/Hero.tsx
import { damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof HeroContentType>;
};

export default function Hero({ content }: Props) {
  const { src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);

  return (
    <section>
      <h1>{content.heading}</h1>
      <img
        src={src(content.image)}
        srcSet={getSrcset(content.image)}
        sizes='(max-width: 768px) 100vw, 50vw'
        alt={getAlt(content.image, 'Hero image')}
      />
    </section>
  );
}
```

This goes in the same file as `HeroContentType`. `getSrcset()` returns a string such as
`https://…/small.jpg 256w, https://…/medium.jpg 512w`. It skips renditions without a URL
or width, keeps only the first rendition of each width, and returns `undefined` when there
are none, so React leaves the attribute out.

## Setting alt text

`getAlt(asset, fallback?)` returns the first of these that has a value:

1. The asset's `AltText`
2. The `fallback` you pass
3. An empty string

```tsx
<img src={src(content.image)} alt={getAlt(content.image, 'Product photo')} />
```

> [!TIP]
>
> An empty `alt` marks an image as decorative, so screen readers skip it. Pass a fallback
> for any image that carries meaning, in case an editor leaves `AltText` empty.

## Handling several asset types

A property that accepts any asset can hold an image, a video or a file. The type guards
from `damAssets()` check `__typename` and narrow the type, so TypeScript knows which
fields are available inside each branch:

```tsx
// src/components/Media.tsx
import { contentType, damAssets, type ContentProps } from '@optimizely/cms-sdk';

export const MediaContentType = contentType({
  key: 'Media',
  displayName: 'Media',
  baseType: '_component',
  properties: {
    asset: {
      type: 'contentReference',
      displayName: 'Asset',
      allowedTypes: ['_image', '_video', '_media'],
    },
  },
});

type Props = {
  content: ContentProps<typeof MediaContentType>;
};

export default function Media({ content }: Props) {
  const { isDamImageAsset, isDamVideoAsset, isDamRawFileAsset, getSrcset, getAlt } =
    damAssets(content);
  const { asset } = content;

  if (isDamImageAsset(asset)) {
    return (
      <img
        src={asset.item.Url ?? undefined}
        srcSet={getSrcset(asset)}
        width={asset.item.Width ?? undefined}
        height={asset.item.Height ?? undefined}
        alt={getAlt(asset, 'Media image')}
      />
    );
  }

  if (isDamVideoAsset(asset)) {
    return (
      <video src={asset.item.Url ?? undefined} aria-label={getAlt(asset)} controls />
    );
  }

  if (isDamRawFileAsset(asset)) {
    return (
      <a href={asset.item.Url ?? undefined} download>
        {asset.item.Title ?? 'Download file'}
      </a>
    );
  }

  return null;
}
```

Two more helpers come from `damAssets()`:

- `getDamAssetType(asset)` returns `'image'`, `'video'`, `'file'` or `'unknown'`. Use it
  for a label or a CSS class. It doesn't narrow the type, so use the guards above to read
  type-specific fields.
- `isDamAsset(asset)` returns `true` for any of the three kinds. Use it to show a
  placeholder when the property is empty.

All the helpers accept `null` and `undefined`, and return `false`, `'unknown'`,
`undefined` or the fallback for them.

## Using Next.js `Image`

Next.js only optimises remote images from hosts listed in `images.remotePatterns`. Add the
host of your CMS and of your DAM:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cms.optimizely.com' },
      { protocol: 'https', hostname: 'your-dam-host.example.com' }, // replace with your DAM host
    ],
  },
};

export default nextConfig;
```

To find your DAM host, look at the `Url` of any asset in a Graph response.

Then pass the URL to `Image`. Next.js generates its own `srcset`, so you don't need
`getSrcset()` here:

```tsx
// src/components/Hero.tsx
import Image from 'next/image';
import { damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof HeroContentType>;
};

export default function Hero({ content }: Props) {
  const { src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);
  const imageUrl = src(content.image);

  return (
    <section>
      <h1>{content.heading}</h1>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={getAlt(content.image, 'Hero image')}
          width={1200}
          height={600}
          sizes='100vw'
          priority
        />
      )}
    </section>
  );
}
```

## Recap

- DAM assets arrive in `contentReference` properties, as `item` with a `__typename` of
  `cmp_PublicImageAsset`, `cmp_PublicVideoAsset` or `cmp_PublicRawFileAsset`.
- The SDK fetches DAM fields automatically when your schema has them. Force it with
  `fragment.dam`.
- `getSrcset()` and `getAlt()` from `damAssets(content)` build responsive, accessible
  images, and `src()` from `getPreviewUtils()` gives the URL.
- The type guards narrow an asset to its kind, so you can read its fields safely.

## Related

- [Property types](../reference/property-types.md)
- [`config()` reference](../reference/config.md)
- [Live preview](../learn/live-preview.md)
- [Render with React](../learn/render-with-react.md)
