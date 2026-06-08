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

### Path Alias Import Errors

**Error:**
```
Cannot find module '@/components/Article'
Module not found: Can't resolve '@/components/experiences/BlankExperience'
```

**Symptoms:**
- TypeScript shows red squiggles on component imports
- Build fails with module resolution errors
- IDE autocomplete doesn't suggest the path
- Dev server crashes on startup with import errors

**Root Cause:** The `tsconfig.json` path alias configuration doesn't match the import pattern.

**Most Common Scenario:** Components are in `src/components/` directory, but `tsconfig.json` has `"@/*": ["./*"]` (maps to root, not src). The generated import incorrectly uses `@/components/...` when it should be `@/src/components/...`.

**Solution Steps:**

**1. Verify tsconfig.json has path aliases configured:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**CRITICAL:** The `baseUrl` field is REQUIRED for `paths` to work. If `baseUrl` is missing, path aliases won't resolve.

**2. Check the file actually exists:**

```bash
# If import is: @/components/Article
# And tsconfig has: "@/*": ["./src/*"]
# Then file should be at:
ls src/components/Article.tsx
```

**3. Test path resolution with TypeScript:**

```bash
# Check for TypeScript errors (won't compile, just checks types)
npx tsc --noEmit

# If error persists, check if Next.js/build tool picks up tsconfig
npm run build
```

**4. Common tsconfig.json patterns and their import paths:**

| tsconfig.json | File location | Import as | Notes |
|---------------|---------------|-----------|-------|
| `"@/*": ["./src/*"]` + `"baseUrl": "."` | `src/components/Article.tsx` | `@/components/Article` | Most common Next.js pattern ✅ |
| `"@/*": ["./*"]` + `"baseUrl": "."` | `src/components/Article.tsx` | `@/src/components/Article` | ⚠️ Alias at root - MUST include src/ |
| `"~/*": ["./src/*"]` + `"baseUrl": "."` | `src/components/Article.tsx` | `~/components/Article` | Alternative alias character |
| `"baseUrl": "./src"` (no paths) | `src/components/Article.tsx` | `components/Article` | Relative to baseUrl |

⚠️ **CRITICAL**: The second pattern (`"@/*": ["./*"]`) is the most commonly misconfigured. When the alias maps to the project root (`./*`), you MUST include the `src/` prefix in your import path. Forgetting this causes "Cannot find module" errors.

**Example of the common mistake:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]  // ← Maps to project root, NOT src/
    }
  }
}
```

```tsx
// ❌ WRONG - Missing src/ prefix
import BlankExperience from '@/components/experiences/BlankExperience';
// Error: Cannot find module '@/components/experiences/BlankExperience'

// ✅ CORRECT - Include src/ because @/ maps to root
import BlankExperience from '@/src/components/experiences/BlankExperience';
```

**5. If path aliases don't work, use relative imports:**

```tsx
// Instead of:
import Article from '@/components/Article';  // ❌ If this doesn't work

// Use relative path:
import Article from '../../components/Article';  // ✅ Always works
```

**6. Restart TypeScript server after changing tsconfig.json:**

In VS Code:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "TypeScript: Restart TS Server"
- Press Enter

**7. Verify existing imports in the same file:**

```tsx
// Look at other imports in the registration file
// If they use @/ and work, your new import should too
import HomePage from '@/components/HomePage';  // Existing working import
import Article from '@/components/Article';    // Your new import should match
```

### Framework-Specific Path Resolution Issues

**Next.js:**
- Ensure `tsconfig.json` is in the project root
- Next.js automatically configures `@/*` → `./src/*` if you have a `src` folder
- Check if `next.config.js` has custom webpack aliases that override tsconfig

**Vite:**
- Path aliases in `tsconfig.json` are for TypeScript only
- You MUST also add them to `vite.config.ts`:
  ```ts
  import { defineConfig } from 'vite';
  import path from 'path';
  
  export default defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
  ```

**Create React App:**
- CRA doesn't support `tsconfig.json` path aliases by default
- Use `craco` or `react-app-rewired` to enable path aliases
- Or use relative imports instead

### Debugging Import Path Issues

**Step-by-step debugging process:**

1. **Confirm file exists:**
   ```bash
   ls -la src/components/Article.tsx
   ```

2. **Check TypeScript can resolve it:**
   ```bash
   npx tsc --traceResolution --noEmit | grep Article
   ```
   This shows how TypeScript resolves the import.

3. **Verify IDE recognizes the path:**
   - Hover over the import in your editor
   - It should show the resolved file path
   - If it shows an error, the path is wrong

4. **Test with a known working import:**
   - Copy an existing import from the same file
   - Change just the component name
   - If that works, your path pattern is correct

5. **Try the import in a different file:**
   - If it works elsewhere, the issue is file-specific
   - Check if the file has a different `tsconfig.json` (monorepo)

**Quick diagnostic:**

```tsx
// Add this temporarily to test path resolution
import { ArticleContentType } from '@/components/Article';
//                                   ^^^^^^^^^^^^^^^^^^^^^^
//                                   Hover here in IDE

// If hover shows:
// - Full file path → Path works ✅
// - "Cannot find module" → Path wrong ❌
// - Type info → Everything working ✅
```

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
- Changing display template in CMS has no effect
- Default component always renders regardless of selected display template

**Solutions:**

1. **Register in `initDisplayTemplateRegistry`:**
```tsx
import { CardDisplayTemplate } from '@/components/CardDisplayTemplate';
import { initDisplayTemplateRegistry } from '@optimizely/cms-sdk';

initDisplayTemplateRegistry([
  CardDisplayTemplate,  // Add template here
]);
```

2. **CRITICAL: Verify `tag` field matches the key in `initReactComponentRegistry`:**

This is the most common mistake. The `tag` field in the display template definition MUST exactly match the key used in the component registry's `tags` object.

```tsx
// ❌ WRONG - using component name as key
export const AnimatedHeadingStylesDisplayTemplate = displayTemplate({
  key: 'AnimatedHeadingStyles',
  displayName: 'Animated',
  contentType: 'HeadingElement',
  tag: 'TestingTag',  // ← This is the value you need
});

initReactComponentRegistry({
  resolver: {
    HeadingElement: {
      default: HeadingElementDefault,
      tags: {
        HeadingElementTemplate: HeadingElementTemplate,  // ❌ Wrong - doesn't match 'TestingTag'
      },
    },
  },
});

// ✅ CORRECT - tag field matches registry key
export const AnimatedHeadingStylesDisplayTemplate = displayTemplate({
  key: 'AnimatedHeadingStyles',
  displayName: 'Animated',
  contentType: 'HeadingElement',
  tag: 'TestingTag',  // ← This exact value must be used below
});

initReactComponentRegistry({
  resolver: {
    HeadingElement: {
      default: HeadingElementDefault,
      tags: {
        TestingTag: HeadingElementTemplate,  // ✅ Correct - matches tag field
      },
    },
  },
});
```

**How to fix:**
1. Find the display template definition and read the `tag` field value
2. Use that EXACT value as the key in `initReactComponentRegistry` `tags` object
3. Do NOT use the component name, display template name, or any other identifier
4. The tag value is case-sensitive and must match exactly

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
