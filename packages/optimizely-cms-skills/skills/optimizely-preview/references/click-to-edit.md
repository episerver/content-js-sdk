# Click-to-Edit Features (Preview Utils)

This reference explains how to enhance the preview editor experience by adding click-to-edit functionality using preview utilities.

## Overview

After basic preview is working, enhance the editor experience by adding click-to-edit functionality. When editors hover over elements with preview attributes, they're highlighted. Clicking them jumps to the corresponding field in the CMS editor.

## When to Use Click-to-Edit

Click-to-edit features should be added to:
- All content properties that editors need to modify
- Properties that appear in the rendered preview
- Any field where direct editing would improve workflow

**Don't add preview attributes to:**
- Non-editable computed values
- System metadata (_metadata fields)
- Properties that don't render visually

## Basic Usage

Import `getPreviewUtils` and use it to add preview attributes to your components.

### Complete Example

```tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  properties: {
    heading: { type: 'string' },
    body: { type: 'richText' },
  },
});

type AboutUsProps = {
  content: ContentProps<typeof AboutUsContentType>;
};

export default function AboutUs({ content }: AboutUsProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <section>
      <h2 {...pa('heading')}>{content.heading}</h2>
      <div {...pa('body')} className="content">
        {/* render body */}
      </div>
    </section>
  );
}
```

## Key Functions

### `pa(propertyName)`

**Purpose:** Spreads preview attributes onto elements to enable click-to-edit

**Usage:**
```tsx
<h1 {...pa('title')}>{content.title}</h1>
<div {...pa('body')}>
  <RichText content={content.body?.json ?? undefined} />
</div>
```

**Returns:** Object with data attributes that:
- Enable hover highlighting in preview mode
- Make the element clickable to jump to CMS field
- Have no effect in production mode

### `src(reference)`

**Purpose:** Resolves content reference URLs correctly in preview mode

**Usage:**
```tsx
const { src, getAlt } = getPreviewUtils(content);

<img 
  src={src(content.featuredImage)} 
  alt={getAlt(content.featuredImage)} 
/>
```

**Why it's needed:**
- Content references need special URL resolution in preview
- Ensures images and media load correctly
- Handles draft vs. published content URLs

## Where to Apply Preview Attributes

### String Properties

```tsx
<h1 {...pa('title')}>{content.title}</h1>
<p {...pa('description')}>{content.description}</p>
```

**Apply to:** The element that displays the text

### Rich Text Properties

```tsx
<div {...pa('body')}>
  <RichText content={content.body?.json ?? undefined} />
</div>
```

**Apply to:** The container div, NOT the RichText component

### Image Properties

```tsx
<img 
  {...pa('featuredImage')}
  src={src(content.featuredImage)} 
  alt={getAlt(content.featuredImage)} 
/>
```

**Apply to:** The `<img>` element itself

### Array Properties

```tsx
<div {...pa('sections')}>
  {content.sections?.map((section, i) => (
    <OptimizelyComponent key={i} content={section} />
  ))}
</div>
```

**Apply to:** The container element, NOT individual array items

**Why:** The SDK handles individual item preview attributes internally

### Boolean Properties

```tsx
{content.showHeader && (
  <header {...pa('showHeader')}>
    <h1>{content.title}</h1>
  </header>
)}
```

**Apply to:** The conditional element (but often not needed for booleans)

### Link Properties

```tsx
{content.ctaLink && (
  <a 
    {...pa('ctaLink')}
    href={content.ctaLink.url} 
    target={content.ctaLink.target}
  >
    {content.ctaLink.text}
  </a>
)}
```

**Apply to:** The `<a>` element

## Advanced Patterns

### Nested Content

```tsx
<div {...pa('hero')}>
  {content.hero && (
    <OptimizelyComponent content={content.hero} />
  )}
</div>
```

**For nested content:** Apply `pa()` to container, `OptimizelyComponent` handles the rest

### Multiple Properties in One Element

```tsx
// Only apply ONE pa() per element
<article {...pa('title')}>  {/* Pick the primary property */}
  <h1>{content.title}</h1>
  <p>{content.subtitle}</p>
</article>

// OR split into separate elements
<article>
  <h1 {...pa('title')}>{content.title}</h1>
  <p {...pa('subtitle')}>{content.subtitle}</p>
</article>
```

**Best practice:** Apply `pa()` to the most specific element possible

### Display Template Settings

```tsx
export default function ArticleCard({ content, settings }: ArticleCardProps) {
  const { pa } = getPreviewUtils(content);
  const showImage = settings?.showImage ?? true;

  return (
    <article>
      {showImage && content.image && (
        <img {...pa('image')} src={src(content.image)} alt={getAlt(content.image)} />
      )}
      <h2 {...pa('title')}>{content.title}</h2>
    </article>
  );
}
```

**Note:** Settings themselves are not editable via click-to-edit; they're configured in display template definition

## Common Mistakes

### Mistake 1: Not Spreading the pa() Result

```tsx
// ❌ Wrong - not spread
<h1 pa={pa('title')}>{content.title}</h1>

// ✅ Correct - spread with ...
<h1 {...pa('title')}>{content.title}</h1>
```

### Mistake 2: Applying to Wrong Element

```tsx
// ❌ Wrong - applied to RichText component
<RichText {...pa('body')} content={content.body?.json ?? undefined} />

// ✅ Correct - applied to container
<div {...pa('body')}>
  <RichText content={content.body?.json ?? undefined} />
</div>
```

### Mistake 3: Forgetting to Call getPreviewUtils

```tsx
// ❌ Wrong - pa is undefined
export default function MyComponent({ content }) {
  return <h1 {...pa('title')}>{content.title}</h1>;
}

// ✅ Correct - getPreviewUtils called
export default function MyComponent({ content }) {
  const { pa } = getPreviewUtils(content);
  return <h1 {...pa('title')}>{content.title}</h1>;
}
```

### Mistake 4: Applying pa() to Array Items

```tsx
// ❌ Wrong - pa on each item
{content.sections?.map((section, i) => (
  <div key={i} {...pa('sections')}>
    <OptimizelyComponent content={section} />
  </div>
))}

// ✅ Correct - pa on container
<div {...pa('sections')}>
  {content.sections?.map((section, i) => (
    <OptimizelyComponent key={i} content={section} />
  ))}
</div>
```

## Testing Click-to-Edit

### In Preview Mode

1. **Open content in CMS editor**
2. **Click "Preview"** button
3. **Hover over content** in preview window
4. **Elements with pa() should highlight** on hover
5. **Click highlighted element** to jump to that field in editor

### Expected Behavior

- **Hover:** Element gets visual highlight/outline
- **Click:** Focus shifts to corresponding field in CMS editor
- **Editing:** Changes in CMS editor update preview in real-time

### If Not Working

Check:
- `getPreviewUtils(content)` is called
- `{...pa('propertyName')}` is spread correctly
- Property name matches content type definition exactly
- Preview mode is actually active (not production mode)

## Production Mode

Preview attributes have **no effect in production**:
- `pa()` returns empty object when not in preview mode
- No performance impact
- No extra DOM attributes in production builds
- Safe to leave in code

## Helper Functions Reference

### getPreviewUtils(content)

**Returns object with:**
- `pa(propertyName)` - Preview attributes for click-to-edit
- `src(reference)` - Resolve content reference URL
- `getAlt(reference, fallback?)` - Get alt text from image reference
- `getAttribute(reference, attribute)` - Get custom attribute from reference

### Example: Using All Helpers

```tsx
const { pa, src, getAlt, getAttribute } = getPreviewUtils(content);

<img 
  {...pa('featuredImage')}
  src={src(content.featuredImage)} 
  alt={getAlt(content.featuredImage, 'Article image')}
  title={getAttribute(content.featuredImage, 'title')}
/>
```

## Best Practices

1. **Always call `getPreviewUtils` at the top of the component**
2. **Apply `pa()` to the most specific element** that displays the property
3. **Use `src()` for all content reference URLs**
4. **Put `pa()` on containers for arrays**, not individual items
5. **Spread with `{...pa()}`, never assign directly**
6. **Property names must exactly match** content type definition
7. **Test in preview mode** to verify click-to-edit works
8. **Don't remove preview attributes for production** - they're automatically inert

## Tips for Success

- **Be generous with preview attributes** - editors appreciate being able to click directly to any field
- **Apply to every editable property** that renders visually
- **Test frequently** by clicking preview and trying to edit fields
- **Combine with semantic HTML** for better accessibility
- **Use TypeScript** to catch property name mismatches early
