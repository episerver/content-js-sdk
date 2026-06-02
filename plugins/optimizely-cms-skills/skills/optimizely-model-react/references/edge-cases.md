# Edge Cases and Considerations

This reference covers edge cases and important considerations when generating React components for Optimizely CMS content types.

## Optional Chaining

Properties in content objects might not be set, especially in draft content or when properties are optional. Always use optional chaining to prevent runtime errors.

### Basic Optional Chaining

```tsx
{content.body?.json}
{content.sections?.map(...)}
{content.hero?.heading}
```

**Why it matters:**
- Draft content may have unset properties
- Optional properties might never be filled
- Referenced content might be deleted or unpublished
- Prevents "Cannot read property 'X' of undefined" errors

### Nested Optional Chaining

```tsx
{content.author?.profile?.bio}
{content.settings?.display?.theme}
{content.image?.metadata?.altText}
```

**When to use:**
- Any property access beyond the top level
- When accessing properties of referenced content
- When accessing nested configuration objects

## Null Fallbacks

Provide sensible fallbacks for missing data to ensure components render gracefully.

### Image Fallbacks

```tsx
<img 
  src={imageUrl} 
  alt={getAlt(content.image, 'Decorative image')} 
/>
```

**Fallback strategies:**
- Default alt text for images
- Placeholder images for missing image content
- Empty string for truly decorative images

### Rich Text Fallbacks

```tsx
<RichText content={content.body?.json ?? undefined} />
```

**Why use `undefined` instead of `null`:**
- `RichText` component expects `undefined` for empty content
- Using `undefined` prevents rendering empty paragraphs
- `null` might cause type errors

### Array Fallbacks

```tsx
{content.items ?? []}
```

**Common patterns:**
- Empty array `[]` for iterations
- Allows safe `.map()` calls
- Prevents "undefined is not a function" errors

### String Fallbacks

```tsx
<h1>{content.title || 'Untitled'}</h1>
<p>{content.description || 'No description available'}</p>
```

**When to use:**
- Display text for empty fields
- User-facing labels and headings
- Default content when properties are optional

## Key Props

When rendering lists of items, React requires a unique `key` prop for each element. Use stable, unique identifiers when possible.

### Prefer Content ID

```tsx
{content.items?.map((item) => (
  <OptimizelyComponent 
    key={item._metadata?.key ?? item.id} 
    content={item} 
  />
))}
```

**Why content ID is better:**
- Stable across renders
- Helps React optimize re-renders
- Prevents unnecessary component remounting
- Better performance for large lists

### Fallback to Index

```tsx
{content.items?.map((item, i) => (
  <OptimizelyComponent key={i} content={item} />
))}
```

**When to use index:**
- When items don't have stable IDs
- When the list is static and won't reorder
- As a last resort only

**Why index is problematic:**
- Can cause re-render issues if list changes
- May break component state if items reorder
- Can cause performance problems in large lists

### Composite Keys

```tsx
{content.sections?.map((section, i) => (
  <div key={`${section._metadata?.key}-${i}`}>
    <OptimizelyComponent content={section} />
  </div>
))}
```

**When to use:**
- When IDs might not be unique across different content types
- When combining multiple data sources
- When you need guaranteed uniqueness

## Preview Attributes for Arrays

When using preview attributes on arrays of content, the preview attribute goes on the container, not on individual items.

### Correct Pattern

```tsx
<div {...pa('sections')}>
  {content.sections?.map((section, i) => (
    <OptimizelyComponent key={i} content={section} />
  ))}
</div>
```

**Why this works:**
- SDK handles individual item preview attributes internally
- Container gets the "add item" button in preview mode
- Items can be reordered within the container

### Incorrect Pattern

```tsx
{content.sections?.map((section, i) => (
  // ❌ Don't do this - pa() should be on the container
  <OptimizelyComponent key={i} content={section} {...pa('sections')} />
))}
```

**Why this doesn't work:**
- Puts preview attributes on wrong element
- Breaks preview editing functionality
- Can cause duplicate preview controls

### Arrays of Primitives

For arrays of simple values (strings, numbers):

```tsx
<ul {...pa('tags')}>
  {content.tags?.map((tag, i) => (
    <li key={i}>{tag}</li>
  ))}
</ul>
```

**Key points:**
- Preview attribute still goes on container
- Primitive items don't need `OptimizelyComponent`
- Use index as key for primitive arrays (stable values)

## Handling Missing Content References

Referenced content might be missing, unpublished, or deleted. Always check before rendering.

### Safe Content Reference

```tsx
{content.featuredArticle ? (
  <OptimizelyComponent content={content.featuredArticle} />
) : (
  <p>No featured article selected</p>
)}
```

### Array of References

```tsx
{content.relatedArticles && content.relatedArticles.length > 0 ? (
  content.relatedArticles.map((article, i) => (
    <OptimizelyComponent key={i} content={article} />
  ))
) : (
  <p>No related articles</p>
)}
```

### Silent Failure

```tsx
{content.featuredArticle && (
  <OptimizelyComponent content={content.featuredArticle} />
)}
```

**When to use:**
- When missing content is acceptable
- When empty state would clutter the UI
- When the referenced content is truly optional

## Type Coercion and Validation

Properties might contain unexpected values. Validate and coerce when necessary.

### Number Validation

```tsx
{typeof content.price === 'number' && content.price > 0 && (
  <span>${content.price.toFixed(2)}</span>
)}
```

### String Validation

```tsx
{typeof content.title === 'string' && content.title.trim() !== '' && (
  <h1>{content.title}</h1>
)}
```

### Date Validation

```tsx
{content.publishDate && !isNaN(new Date(content.publishDate).getTime()) && (
  <time dateTime={content.publishDate}>
    {new Date(content.publishDate).toLocaleDateString()}
  </time>
)}
```

## Component Type Properties

When a property has `type: 'component'`, it embeds another content item.

### Embedded Component

```tsx
{content.ctaButton && (
  <OptimizelyComponent content={content.ctaButton} />
)}
```

### Multiple Embedded Components

```tsx
{content.hero && <OptimizelyComponent content={content.hero} />}
{content.sidebar && <OptimizelyComponent content={content.sidebar} />}
```

**Key points:**
- Treat component properties like content references
- Always check existence before rendering
- SDK handles component type resolution automatically

## Display Template Settings

When implementing display templates, access settings via the content object.

### Using Settings

```tsx
export default function ArticleCard({ content, settings }: ArticleCardProps) {
  const showImage = settings?.showImage ?? true;
  
  return (
    <article>
      {showImage && content.image && (
        <img src={src(content.image)} alt={getAlt(content.image)} />
      )}
      <h2>{content.title}</h2>
    </article>
  );
}
```

**Key points:**
- Settings come from display template definition
- Always provide defaults for settings
- Use optional chaining for settings access
- Settings control visual variations, not core functionality

## Best Practices Summary

1. **Always use optional chaining** for any property that might not exist
2. **Provide sensible fallbacks** for missing data
3. **Use stable keys** (content IDs) when possible
4. **Put preview attributes on containers**, not individual items
5. **Check referenced content** existence before rendering
6. **Validate values** when type coercion matters
7. **Handle empty arrays** explicitly
8. **Default settings** to sensible values in display templates
