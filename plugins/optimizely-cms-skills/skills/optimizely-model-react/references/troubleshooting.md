# Troubleshooting Guide

This reference provides solutions to common issues when developing React components for Optimizely CMS.

## Type Errors

TypeScript errors are common when working with content properties and SDK types.

### Missing Properties Error

**Error:**
```
Property 'title' does not exist on type 'ContentProps<...>'
```

**Causes:**
- Content type definition doesn't include the property
- Type import is incorrect
- Property name mismatch between definition and component

**Solutions:**

1. **Verify content type definition** includes all accessed properties:
```typescript
// In BlogPage.tsx (content type file)
export const BlogPageContentType = contentType({
  key: 'BlogPage',
  properties: {
    title: { type: 'string' },  // Make sure this exists
    body: { type: 'richText' },
  }
});
```

2. **Use optional chaining** for properties that might not be defined:
```tsx
<h1>{content.title}</h1>  // ❌ Error if title not in type
<h1>{content.title?.toString()}</h1>  // ✅ Safe access
```

3. **Check imports** are correct:
```tsx
import { ContentProps } from '@optimizely/cms-sdk/react';
```

### Undefined Type Error

**Error:**
```
Type 'undefined' is not assignable to type 'string'
```

**Solution:**
Use optional chaining and nullish coalescing:
```tsx
// ❌ Wrong
<h1>{content.title}</h1>

// ✅ Correct
<h1>{content.title ?? 'Untitled'}</h1>
```

### Import Errors

**Error:**
```
Cannot find module '@optimizely/cms-sdk/react'
```

**Solutions:**
- Verify SDK is installed: `npm install @optimizely/cms-sdk`
- Check import path: `@optimizely/cms-sdk/react` not `@optimizely/cms-sdk`
- Restart TypeScript server in IDE

## Preview Not Working

When components don't show live preview in the CMS editor.

### Preview Attributes Not Applied

**Symptoms:**
- Can't edit content in preview mode
- No click-to-edit functionality
- Preview mode shows static content

**Solution checklist:**

1. **Verify `getPreviewUtils` is called:**
```tsx
export default function BlogPage({ content }: BlogPageProps) {
  const { pa } = getPreviewUtils(content);  // Must be here
  
  return (
    <article>
      <h1 {...pa('title')}>{content.title}</h1>
    </article>
  );
}
```

2. **Ensure preview attributes are spread correctly:**
```tsx
// ❌ Wrong - not spread
<h1 pa={pa('title')}>{content.title}</h1>

// ✅ Correct - spread with ...
<h1 {...pa('title')}>{content.title}</h1>
```

3. **Check property names match:**
```tsx
// Content type definition
properties: {
  heading: { type: 'string' }  // Property is 'heading'
}

// Component - must match
<h1 {...pa('heading')}>{content.heading}</h1>  // Not 'title'
```

### Page Not Showing in Preview

**Symptoms:**
- Page renders in production but not in CMS preview
- Blank screen in preview mode

**Solution checklist:**

1. **Verify `withAppContext` wraps the layout:**
```tsx
// app/layout.tsx or pages/_app.tsx
import { withAppContext } from '@optimizely/cms-sdk/react';

export default withAppContext(RootLayout);
```

2. **Check preview route is configured:**
Ensure your Next.js app handles the preview route.

3. **Verify authentication:**
Check that CMS can reach the preview URL (CORS, authentication, etc.).

## Component Not Rendering

When components don't appear on the page.

### Component Not Registered

**Symptoms:**
- Console warnings about missing components
- Content appears as raw JSON
- Blank spaces where components should be

**Solutions:**

1. **Add to `initReactComponentRegistry`:**
```tsx
import { BlogPage } from '@/components/BlogPage';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react';

initReactComponentRegistry([
  BlogPage,  // Add your component here
]);
```

2. **Verify export is correct:**
```tsx
// ✅ Correct - default export
export default function BlogPage({ content }: BlogPageProps) {
  // ...
}

// ❌ Wrong - named export won't work
export function BlogPage({ content }: BlogPageProps) {
  // ...
}
```

3. **Check component name matches content type key:**
```tsx
// Content type key
export const BlogPageContentType = contentType({
  key: 'BlogPage',  // Component name must match
  // ...
});

// Component function name
export default function BlogPage({ content }: BlogPageProps) {
  // Name must match key
}
```

### Display Template Not Rendering

**Symptoms:**
- Display template doesn't appear in CMS selector
- Wrong component renders for content

**Solutions:**

1. **Register in `initDisplayTemplateRegistry`:**
```tsx
import { CardDisplayTemplate } from '@/components/CardDisplayTemplate';
import { initDisplayTemplateRegistry } from '@optimizely/cms-sdk';

initDisplayTemplateRegistry([
  CardDisplayTemplate,  // Add template here
]);
```

2. **Verify `tag` matches component name:**
```tsx
// Display template definition
export const CardDisplayTemplate = displayTemplate({
  key: 'CardTemplate',
  tag: 'ArticleCard',  // Must match component name
  contentType: 'Article',
});

// Component
export default function ArticleCard({ content, settings }: ArticleCardProps) {
  // Name must match 'tag' field
}
```

## Images Not Loading

When images don't appear or show broken image icons.

### Image Source Not Resolved

**Symptoms:**
- Broken image icons
- 404 errors for image URLs
- Images show as `[object Object]`

**Solutions:**

1. **Use `src()` from `getPreviewUtils`:**
```tsx
export default function BlogPage({ content }: BlogPageProps) {
  const { src, getAlt } = getPreviewUtils(content);
  
  return (
    <img 
      src={src(content.image)}  // Use src() helper
      alt={getAlt(content.image)} 
    />
  );
}
```

2. **Check property type is correct:**
```tsx
// ❌ Wrong - type: 'string'
featuredImage: {
  type: 'string',
}

// ✅ Correct - type: 'contentReference'
featuredImage: {
  type: 'contentReference',
  allowedTypes: ['_image'],
}
```

3. **Verify image content exists:**
```tsx
{content.image && (
  <img src={src(content.image)} alt={getAlt(content.image)} />
)}
```

### DAM Assets Not Loading

**For Digital Asset Manager (DAM) assets:**

```tsx
import { damAssets } from '@optimizely/cms-sdk/react';

export default function BlogPage({ content }: BlogPageProps) {
  const { getAssetUrl, getAssetAlt } = damAssets(content);
  
  return (
    <img 
      src={getAssetUrl(content.heroImage)}
      alt={getAssetAlt(content.heroImage)}
    />
  );
}
```

## Rich Text Not Rendering

When rich text content appears as raw JSON or doesn't render at all.

### Missing RichText Component

**Symptoms:**
- Rich text shows as `[object Object]`
- HTML tags appear as plain text
- Content is not formatted

**Solution:**
```tsx
import { RichText } from '@optimizely/cms-sdk/react';

export default function BlogPage({ content }: BlogPageProps) {
  return (
    <div {...pa('body')}>
      <RichText content={content.body?.json ?? undefined} />
    </div>
  );
}
```

**Key points:**
- Import `RichText` from SDK
- Pass `content.body?.json` (access the `json` property)
- Use `?? undefined` for safe fallback
- Preview attribute goes on container, not on `RichText`

### Wrong Property Access

```tsx
// ❌ Wrong - missing .json
<RichText content={content.body} />

// ✅ Correct - access .json property
<RichText content={content.body?.json ?? undefined} />
```

## Performance Issues

When components render slowly or cause performance problems.

### Too Many Re-renders

**Solutions:**

1. **Memoize expensive computations:**
```tsx
import { useMemo } from 'react';

export default function BlogPage({ content }: BlogPageProps) {
  const sortedArticles = useMemo(
    () => content.articles?.sort((a, b) => /* ... */),
    [content.articles]
  );
  
  return (/* ... */);
}
```

2. **Use stable keys in lists:**
```tsx
// ✅ Stable key
{content.items?.map((item) => (
  <div key={item._metadata?.key}>{/* ... */}</div>
))}

// ❌ Unstable key causes re-renders
{content.items?.map((item, i) => (
  <div key={Math.random()}>{/* ... */}</div>
))}
```

## Common Error Messages

### "Cannot read property 'X' of undefined"

**Cause:** Accessing nested property without optional chaining

**Solution:** Add `?.` at each level:
```tsx
content.author?.profile?.bio  // ✅
content.author.profile.bio    // ❌
```

### "X is not a function"

**Cause:** Calling method on undefined/null value

**Solution:** Check existence first:
```tsx
content.tags?.map(...)  // ✅
content.tags.map(...)   // ❌ if tags is undefined
```

### "Each child in a list should have a unique 'key' prop"

**Cause:** Missing or duplicate keys in mapped arrays

**Solution:** Add unique keys:
```tsx
{items.map((item) => (
  <div key={item._metadata?.key ?? item.id}>{/* ... */}</div>
))}
```

## Getting Help

If you encounter issues not covered here:

1. **Check SDK documentation** for API changes
2. **Verify SDK version** matches examples
3. **Check browser console** for error details
4. **Inspect network tab** for failed requests
5. **Use React DevTools** to inspect component props
6. **Check CMS preview mode** is actually enabled
