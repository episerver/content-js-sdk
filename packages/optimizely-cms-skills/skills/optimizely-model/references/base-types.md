# Base Types Reference

This reference provides detailed information about base types for Optimizely CMS content type modeling.

## Overview

Every content type must specify a `baseType` that determines its fundamental behavior and where it can be used in the CMS. Choose the appropriate base type based on the content structure you're modeling.

## Available Base Types

### `'_page'`
**Page Content Type**

Use for traditional page content that appears in the content tree and has a URL route.

**Characteristics:**
- Appears in the content tree hierarchy
- Has its own URL/route
- Can contain child pages
- Typically represents web pages, landing pages, article pages, etc.

**Example:**
```typescript
export const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  // ... properties
});
```

### `'_component'`
**Component/Block Content Type**

Use for reusable components that can be added to content areas on pages or other content.

**Characteristics:**
- Can be added to content areas
- Reusable across multiple pages
- No standalone URL (exists within parent content)
- Typically represents hero sections, cards, CTAs, etc.

**Example:**
```typescript
export const HeroComponentType = contentType({
  key: 'Hero',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  // ... properties
});
```

### `'_experience'`
**Experience Content Type**

Use for visual builder experiences (full-page compositions built with the visual builder).

**Characteristics:**
- Designed for visual builder/composition
- Typically full-page experiences
- Supports advanced composition features

**Example:**
```typescript
export const LandingExperienceType = contentType({
  key: 'LandingExperience',
  baseType: '_experience',
  // ... properties
});
```

### `'_folder'`
**Folder Type**

Use for organizational folders in the content tree.

**Characteristics:**
- Container for organizing content
- No rendering (structural only)
- Helps organize content tree hierarchy

**Example:**
```typescript
export const ArticleFolderType = contentType({
  key: 'ArticleFolder',
  baseType: '_folder',
  // ... properties
});
```

### `'_image'`, `'_media'`, `'_video'`
**Media Types**

Use for specialized media content types.

**Characteristics:**
- `'_image'` - Image files (JPG, PNG, etc.)
- `'_media'` - Generic media files (PDFs, documents, etc.)
- `'_video'` - Video files (MP4, etc.)
- Typically used when extending built-in media types with custom properties

**Example:**
```typescript
export const BrandImageType = contentType({
  key: 'BrandImage',
  baseType: '_image',
  properties: {
    altText: { type: 'string' },
    photographer: { type: 'string' }
  }
});
```

## Choosing the Right Base Type

**Decision Tree:**

1. **Is it a standalone page with its own URL?** → Use `'_page'`
2. **Is it a reusable component for content areas?** → Use `'_component'`
3. **Is it for the visual builder?** → Use `'_experience'`
4. **Is it for organizing content?** → Use `'_folder'`
5. **Is it a media file?** → Use `'_image'`, `'_media'`, or `'_video'`

## Common Mistakes

- Using invalid base types not in this list
- Forgetting to specify `baseType` (required field)
- Using `'_component'` for pages (components don't have their own URLs)
- Using `'_page'` for reusable components (pages aren't designed for content areas)
