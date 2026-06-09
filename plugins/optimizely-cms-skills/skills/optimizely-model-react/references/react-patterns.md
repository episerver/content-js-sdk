# React Component Patterns Reference

This reference provides common React patterns for rendering different property types in Optimizely CMS components.

## Content Reference Properties

**IMPORTANT:** Properties with `type: 'contentReference'` return `InferredContentReference` which contains `{ key, url, item }` but NOT `__typename`. These **CANNOT** be used with `OptimizelyComponent`.

### Single Content Reference

For properties that reference a single content item, render as a link:

```tsx
{content.relatedPage?.url && (
  <a href={content.relatedPage.url.default ?? ''}>
    {content.relatedPage.key}
  </a>
)}
```

**Key points:**

- ContentReference returns `{ key, url, item }` - no `__typename`
- Always check if `url` exists before rendering
- Use `url.default` for the href value
- Use `key` for the link text (or provide custom text)
- Cannot use `OptimizelyComponent` - type mismatch

### Array of Content References

For properties that reference multiple content items:

```tsx
{content.relatedPages?.map((ref, i) => (
  ref?.url && (
    <a key={i} href={ref.url.default ?? ''}>
      {ref.key}
    </a>
  )
))}
```

**Key points:**

- Use optional chaining `?.` since the array might be undefined
- Each item needs a unique `key` prop
- Check if `url` exists on each item before rendering
- Render as plain links, not `OptimizelyComponent`

### Content Reference with Custom Rendering

You can access the `item` property for asset metadata:

```tsx
{content.documentRef?.item && (
  <div>
    <a href={content.documentRef.url.default ?? ''}>
      {content.documentRef.key}
    </a>
    {content.documentRef.item.contentType === 'application/pdf' && (
      <span className="file-type">PDF</span>
    )}
  </div>
)}
```

## Content Type Properties (Arrays)

**Different from contentReference**: Properties with `type: 'content'` return full content objects with `__typename` and can be used with `OptimizelyComponent`.

### Array of Content Type Items

```tsx
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

{content.articles?.map((article, i) => (
  <OptimizelyComponent key={i} content={article} />
))}
```

**Key points:**

- Use `OptimizelyComponent` for `type: 'content'` arrays
- Content items have `__typename` which OptimizelyComponent requires
- Each item is a full content object, not just a reference

## Boolean Properties

Boolean properties control conditional rendering of sections.

### Basic Boolean Check

```tsx
{content.showHeader && (
  <header>
    <h1>{content.title}</h1>
  </header>
)}
```

### Boolean with Alternative

```tsx
{content.showFullArticle ? (
  <RichText content={content.fullBody?.json ?? undefined} />
) : (
  <p>{content.excerpt}</p>
)}
```

**Key points:**
- Use `&&` for simple conditional rendering
- Use ternary `? :` when you need both true and false cases
- Always check for truthy/falsy, not equality (`content.show`, not `content.show === true`)

## Enum/Select Properties

Enum or select properties typically use string values to determine behavior.

### Conditional Rendering Based on Enum

```tsx
<div className={content.theme === 'dark' ? 'dark-mode' : 'light-mode'}>
  {/* content */}
</div>
```

### Multiple Enum Values

```tsx
{content.layout === 'grid' && <GridLayout items={content.items} />}
{content.layout === 'list' && <ListView items={content.items} />}
{content.layout === 'carousel' && <CarouselView items={content.items} />}
```

### Enum in className

```tsx
<article className={`article article-${content.variant}`}>
  {/* Uses classes like 'article-featured', 'article-standard' */}
</article>
```

**Key points:**
- Use strict equality `===` for enum comparisons
- Consider a map or switch statement for many enum values
- Provide fallback rendering for unexpected values

## DateTime Properties

DateTime properties store ISO 8601 date strings.

### Basic Date Display

```tsx
<span>
  {new Date(content.publishDate).toLocaleDateString()}
</span>
```

### Custom Date Formatting

```tsx
<time dateTime={content.publishDate}>
  {new Date(content.publishDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
</time>
```

### Relative Time

```tsx
<span>
  Published {getRelativeTime(content.publishDate)}
</span>
```

**Key points:**
- Always wrap the date string in `new Date()`
- Use `<time>` element with `dateTime` attribute for semantic HTML
- Consider user locale for date formatting
- Handle invalid dates gracefully

## Link Properties

Link properties (`type: 'link'`) include metadata beyond just the URL. The SDK returns a `LinkItem` object.

### LinkItem Object Structure

```typescript
{
  url: string | null;      // The link destination URL
  text: string | null;     // The link text/label
  title: string | null;    // The title attribute (tooltip)
  target: string | null;   // The link target (_blank, _self, etc.)
}
```

### Full Link Pattern

**CRITICAL**: Link properties can have `null` values. TypeScript requires `string | undefined` for HTML attributes, not `string | null`. Use nullish coalescing `?? undefined` to convert `null` to `undefined`.

```tsx
{content.ctaLink && (
  <a 
    href={content.ctaLink.url ?? undefined} 
    title={content.ctaLink.title ?? undefined}
    target={content.ctaLink.target ?? undefined}
    rel={content.ctaLink.target === '_blank' ? 'noopener noreferrer' : undefined}
  >
    {content.ctaLink.text}
  </a>
)}
```

### Link with Fallback Text

```tsx
{content.ctaLink && (
  <a 
    href={content.ctaLink.url ?? undefined} 
    target={content.ctaLink.target ?? undefined}
  >
    {content.ctaLink.text || 'Learn More'}
  </a>
)}
```

### External Link Pattern

```tsx
{content.ctaLink && (
  <a 
    href={content.ctaLink.url ?? undefined}
    title={content.ctaLink.title ?? undefined}
    target={content.ctaLink.target ?? undefined}
    rel={content.ctaLink.target === '_blank' ? 'noopener noreferrer' : undefined}
  >
    {content.ctaLink.text}
    {content.ctaLink.target === '_blank' && <ExternalIcon />}
  </a>
)}
```

**Common mistakes to avoid:**

```tsx
// ❌ WRONG: Passing null to attributes
<a 
  title={content.ctaLink.title}
  target={content.ctaLink.target}
>
// Error: Type 'string | null' is not assignable to type 'string | undefined'

// ✅ CORRECT: Convert null to undefined with ?? undefined
<a 
  title={content.ctaLink.title ?? undefined}
  target={content.ctaLink.target ?? undefined}
>
```

**Key points:**

- Link properties return `LinkItem` objects with nullable fields
- Always use `?? undefined` to convert `null` to `undefined` for HTML attributes
- TypeScript HTML attributes accept `string | undefined` but NOT `string | null`
- Always add `rel="noopener noreferrer"` for `target="_blank"` links
- Provide fallback text if `content.ctaLink.text` is empty or null
- Use the `title` attribute for accessibility
- Consider indicating external links visually

## URL Properties

URL properties (`type: 'url'`) return an `InferredUrl` object with routing information, not simple strings.

### InferredUrl Object Structure

```typescript
{
  default: string | null;        // The primary URL
  base: string | null;           // Base path
  hierarchical: string | null;   // Full hierarchical path
  internal: string | null;       // Internal route
}
```

### Basic URL Pattern

**CRITICAL**: URL properties return an object, not a string. Always access `.default` for the href value.

```tsx
{content.websiteUrl && (
  <a href={content.websiteUrl.default ?? undefined}>Visit Website</a>
)}
```

### URL with Text Display

```tsx
{content.websiteUrl?.default && (
  <a href={content.websiteUrl.default} target='_blank' rel='noopener noreferrer'>
    {content.websiteUrl.default}
  </a>
)}
```

### URL with Fallback

```tsx
<a href={content.websiteUrl?.default ?? '#'}>
  {content.linkText || 'Visit Website'}
</a>
```

**Common mistakes to avoid:**

```tsx
// ❌ WRONG: Trying to use URL directly as string
<a href={content.websiteUrl}>Visit</a>
// Error: Type 'InferredUrl' is not assignable to type 'string'

// ✅ CORRECT: Access .default property
<a href={content.websiteUrl?.default ?? undefined}>Visit</a>
```

**Key points:**
- URL properties return `InferredUrl` objects, NOT strings
- Always access `.default` for the href value (e.g., `content.websiteUrl.default`)
- Use nullish coalescing `?? undefined` or `?? '#'` for fallback
- The `.default` property can be `null`, so use optional chaining
- Other properties (`.base`, `.hierarchical`, `.internal`) are available for advanced routing

## String and Rich Text Properties

### Simple String

```tsx
<h1 {...pa('title')}>{content.title}</h1>
```

### Rich Text

```tsx
<RichText content={content.body?.json ?? undefined} />
```

**Key points:**
- Use `{...pa('propertyName')}` for preview attributes
- Rich text requires the `json` property from the content
- Always use `RichText` component from SDK for rich text properties

## Integer and Float Properties

### Numeric Display

```tsx
<span>${content.price.toFixed(2)}</span>
<span>{content.quantity} items</span>
```

### Numeric Calculation

```tsx
<span>Total: ${(content.price * content.quantity).toFixed(2)}</span>
```

**Key points:**
- Use `toFixed()` for currency display
- Handle null/undefined with optional chaining
- Consider locale-specific number formatting

## Best Practices

1. **Always use optional chaining** for properties that might be undefined
2. **Provide fallbacks** for missing data
3. **Use semantic HTML** elements (`<time>`, `<article>`, etc.)
4. **Add preview attributes** `{...pa('propertyName')}` for editable fields
5. **Check existence** before rendering referenced content
6. **Use stable keys** when mapping arrays
7. **Handle null cases** explicitly rather than crashing
