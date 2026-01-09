# Working with DAM Assets

When DAM integration is enabled in your CMS instance, you get helper functions for working with images, media, and files from Optimizely's Content Marketing Platform. These utilities handle preview tokens, generate responsive image markup, and manage alt text automatically.

> [!NOTE]
> These utilities only work when DAM assets are enabled in your Content Graph. Check with your CMS administrator if you're not sure whether the integration is active.

The SDK gives you:

- `damAssets()` - Returns pre-configured helpers for the content property
- `getSrcset()` - Builds responsive srcset strings from renditions
- `getAlt()` - Pulls alt text from assets (with fallback support)

## damAssets()

Use `damAssets()` to get pre-configured helper functions. The main benefit is automatic preview token handling—you don't need to worry about passing tokens around when editors are previewing content.

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
