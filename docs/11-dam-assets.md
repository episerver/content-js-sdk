# Working with DAM Assets

When DAM integration is enabled in your CMS instance, you get helper functions for working with images, media, and files from Optimizely's Content Marketing Platform. These utilities handle preview tokens, generate responsive image markup, and manage alt text automatically.

> [!NOTE]
> These utilities only work when DAM assets are enabled in your Content Graph. Check with your CMS administrator if you're not sure whether the integration is active.

The SDK gives you:

- `damAssets()` - Returns pre-configured helpers for the content property
- `getSrcset()` - Builds responsive srcset strings from renditions
- `getAlt()` - Pulls alt text from assets (with fallback support)
- Type checking utilities - Determine asset types with TypeScript type narrowing

## damAssets()

Use `damAssets()` to get pre-configured helper functions for working with DAM assets. The main benefit is automatic preview token handling—you don't need to worry about passing tokens around when editors are previewing content.

The `damAssets()` function returns:

- `getSrcset()` - Generates responsive srcset strings
- `getAlt()` - Retrieves alt text with fallback support
- `isDamImageAsset()` - Type guard for image assets
- `isDamVideoAsset()` - Type guard for video assets
- `isDamRawFileAsset()` - Type guard for file assets
- `getDamAssetType()` - Returns asset type as a string
- `isDamAsset()` - Validates any DAM asset

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function HeroComponent({ content }) {
  const { src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);

  return (
    <img
      src={src(content.heroImage)}
      srcSet={getSrcset(content.heroImage)}
      sizes="(max-width: 768px) 100vw, 50vw"
      alt={getAlt(content.heroImage, 'Hero image')}
    />
  );
}
```

## getSrcset()

Generates a `srcset` attribute from the renditions in your DAM asset. The function:

- Filters out duplicate widths (keeps the first one)
- Adds preview tokens automatically in edit mode
- Returns `undefined` if there are no renditions

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function ProductImage({ content }) {
  const { src } = getPreviewUtils(content);
  const { getSrcset } = damAssets(content);

  return (
    <img
      src={src(content.productImage)}
      srcSet={getSrcset(content.productImage)}
      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
      alt="Product image"
    />
  );
}
```

The generated `srcset` will look like:

```
https://example.dam.optimizely.com/image1.jpg 100w, https://example.dam.optimizely.com/image2.jpg 500w, https://example.dam.optimizely.com/image3.jpg 1000w
```

## getAlt()

Retrieves alt text with a simple priority system:

1. Asset's `AltText` property if it exists
2. Your fallback text
3. Empty string (decorative image)

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function ImageComponent({ content }) {
  const { src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);

  return <img src={src(content.image)} alt={getAlt(content.image)} />;
}
```

**With fallback text:**

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function BannerComponent({ content }) {
  const { src } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);

  return (
    <img
      src={src(content.bannerImage)}
      alt={getAlt(content.bannerImage, 'Marketing banner')}
    />
  );
}
```

**For decorative images:**

```tsx
const { src } = getPreviewUtils(content);
const { getAlt } = damAssets(content);

// Will render alt="" if no AltText exists in the asset
<img src={src(content.decorativeIcon)} alt={getAlt(content.decorativeIcon)} />;
```

> [!TIP]
> Don't skip the fallback parameter. Empty alt text marks images as decorative, which isn't always what you want.

## Working with Multiple Asset Types

Content references in your CMS can accept different types of media like images, videos, or files. Without type checking, you'd need to manually check the `__typename` property and cast types yourself:

```tsx
// Without type utilities (verbose and error-prone)
if (content.media?.item?.__typename === 'cmp_PublicImageAsset') {
  const renditions = (content.media.item as PublicImageAsset).Renditions;
}
```

The SDK provides type checking utilities through `damAssets()` that handle this automatically with proper TypeScript type narrowing.

### Available Type Checkers

- **`isDamImageAsset()`** - Checks for image assets (`cmp_PublicImageAsset`)
  Unlocks access to: `Renditions`, `AltText`, `Width`, `Height`, `FocalPoint`

- **`isDamVideoAsset()`** - Checks for video assets (`cmp_PublicVideoAsset`)
  Unlocks access to: `Renditions`, `AltText`

- **`isDamRawFileAsset()`** - Checks for file assets (`cmp_PublicRawFileAsset`)
  Unlocks access to: `Url`, `Title`, `Description`, `MimeType`

- **`getDamAssetType()`** - Returns the asset type as a string: `'image' | 'video' | 'file' | 'unknown'`
  Useful for switch-case logic or displaying asset type information

- **`isDamAsset()`** - Validates that a content reference is any type of DAM asset
  Returns `true` if the reference contains a valid image, video, or file asset

### Type-Safe Conditional Rendering

Use type guards when you need different rendering logic for each asset type. TypeScript automatically narrows the type inside each conditional block, giving you full autocomplete and type safety:

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function MediaComponent({ content }) {
  const {
    isDamImageAsset,
    isDamVideoAsset,
    isDamRawFileAsset,
    getSrcset,
    getAlt,
  } = damAssets(content);

  if (isDamImageAsset(content.media)) {
    // TypeScript knows content.media.item is PublicImageAsset
    return (
      <img
        src={content.media.item.Url}
        srcSet={getSrcset(content.media)}
        alt={getAlt(content.media, 'Media asset')}
      />
    );
  }

  if (isDamVideoAsset(content.media)) {
    // TypeScript knows content.media.item is PublicVideoAsset
    return (
      <video src={content.media.item.Url} controls>
        {content.media.item.AltText && (
          <track kind="captions" label={content.media.item.AltText} />
        )}
      </video>
    );
  }

  if (isDamRawFileAsset(content.media)) {
    // TypeScript knows content.media.item is PublicRawFileAsset
    return (
      <a href={content.media.item.Url} download>
        {content.media.item.Title || 'Download File'}
      </a>
    );
  }

  return null;
}
```

### Switch-Case Pattern with getDamAssetType()

For more declarative code or when you need the asset type as a value, use `getDamAssetType()`. This works well when the asset type needs to be passed to other functions or displayed to users:

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function AssetRenderer({ content }) {
  const { getSrcset, getAlt, getDamAssetType } = damAssets(content);
  const assetType = getDamAssetType(content.media);

  switch (assetType) {
    case 'image':
      return (
        <img
          src={content.media.item.Url}
          srcSet={getSrcset(content.media)}
          alt={getAlt(content.media, 'Image')}
        />
      );
    case 'video':
      return <video src={content.media.item.Url} controls />;
    case 'file':
      return (
        <a href={content.media.item.Url} download>
          {content.media.item.Title || 'Download'}
        </a>
      );
    default:
      return <p>No media available</p>;
  }
}
```

### Validating Asset Existence

Use `isDamAsset()` when you don't care about the specific asset type but need to verify that a valid DAM asset exists. This is useful for optional fields or when providing fallback content:

```tsx
import { damAssets } from '@optimizely/cms-sdk';

export default function OptionalMedia({ content }) {
  const { isDamAsset, getDamAssetType } = damAssets(content);

  if (!isDamAsset(content.media)) {
    return <div>No media uploaded</div>;
  }

  const assetType = getDamAssetType(content.media);
  return <div>Valid {assetType} asset detected</div>;
}
```

> [!NOTE]
> Type guards check the asset's `__typename` property. They return `false` for `null`, `undefined`, or content references without a valid asset item.

## Next.js Image Optimization

If you're using Next.js, add your DAM hostname to `remotePatterns` in `next.config.ts`. Otherwise Next.js won't optimize images from your DAM instance.

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cms.optimizely.com',
      },
      {
        protocol: 'https',
        hostname: '*.cmstest.optimizely.com',
      },
      {
        protocol: 'https',
        hostname: 'your-dam-instance.optimizely.com', // Replace with your hostname
      },
    ],
  },
};

export default nextConfig;
```

Then use the Next.js `Image` component normally:

```tsx
import Image from 'next/image';
import { damAssets } from '@optimizely/cms-sdk';

export default function OptimizedImage({ content }) {
  const { src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);

  return (
    <Image
      src={src(content.image)}
      alt={getAlt(content.image, 'Default alt text')}
      width={800}
      height={600}
      srcSet={getSrcset(content.image)}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
```

## Putting It Together

```tsx
import { damAssets } from '@optimizely/cms-sdk';
import Image from 'next/image';

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function ArticleHero({ content }: Props) {
  const { src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);

  return (
    <article>
      <header>
        <h1>{content.title}</h1>

        {/* Primary hero image with responsive srcset */}
        <Image
          src={src(content.heroImage)}
          alt={getAlt(content.heroImage, 'Article hero image')}
          width={1200}
          height={600}
          srcSet={getSrcset(content.heroImage)}
          sizes="100vw"
          priority
        />
      </header>

      <div>
        {/* Thumbnail image */}
        <img
          src={src(content.thumbnail)}
          srcSet={getSrcset(content.thumbnail)}
          sizes="(max-width: 768px) 100px, 200px"
          alt={getAlt(content.thumbnail)}
        />

        <div>{content.summary}</div>
      </div>
    </article>
  );
}
```
