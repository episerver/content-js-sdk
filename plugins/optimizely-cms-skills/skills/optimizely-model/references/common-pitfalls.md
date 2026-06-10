# Common Pitfalls to Avoid

This reference documents common mistakes when modeling Optimizely CMS content types and how to avoid them.

## 1. Nested Arrays

**Problem:** Attempting to create arrays that contain other arrays.

**Why it fails:** The Optimizely CMS schema does not support nested array structures.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Arrays cannot contain other arrays
relatedItems: {
  type: 'array',
  items: {
    type: 'array',  // This will fail
    items: { type: 'string' }
  }
}
```

**Solution:** Flatten the structure or use content references:
```typescript
// ✅ CORRECT - Use a flat array
relatedItemIds: {
  type: 'array',
  items: { type: 'string' }
}

// ✅ CORRECT - Or use content references
relatedItems: {
  type: 'array',
  items: {
    type: 'contentReference',
    allowedTypes: ['RelatedItem']
  }
}
```

## 2. Invalid Base Type

**Problem:** Using a base type that doesn't exist or isn't in the allowed list.

**Why it fails:** Only specific base types are supported by the CMS.

**Valid base types:**
- `'_page'`
- `'_component'`
- `'_experience'`
- `'_folder'`
- `'_image'`
- `'_media'`
- `'_video'`

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Invalid base type
export const ArticleType = contentType({
  key: 'Article',
  baseType: '_article',  // Not a valid base type
  // ...
});
```

**Solution:** Use one of the documented base types:
```typescript
// ✅ CORRECT
export const ArticleType = contentType({
  key: 'Article',
  baseType: '_page',  // Valid base type
  // ...
});
```

## 3. Missing Type for Component Properties

**Problem:** Component properties don't specify a `type` field or have an incomplete definition.

**Why it fails:** Component properties require explicit type information to know which component can be embedded.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Missing type field
ctaButton: {
  contentType: ButtonComponentType  // Incomplete
}
```

**Solution:** Always include both `type` and `contentType`:
```typescript
// ✅ CORRECT
ctaButton: {
  type: 'component',
  contentType: ButtonComponentType
}
```

## 4. Forgetting to Register

**Problem:** Creating content types, display templates, or contracts but not adding them to the appropriate registry.

**Why it fails:** The CMS won't recognize your types unless they're registered.

**What to register:**
- **Content types** → `initContentTypeRegistry()`
- **Display templates** → `initDisplayTemplateRegistry()`
- **Contracts** → `initContentTypeRegistry()` (yes, contracts go in content type registry)

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Created BlogPage but didn't register it
export const BlogPageContentType = contentType({
  key: 'BlogPage',
  baseType: '_page',
  // ...
});
// File ends here - not registered!
```

**Solution:** Always update the registry:
```typescript
// ✅ CORRECT
// In initContentTypeRegistry.ts or wherever registry is initialized
export function initContentTypeRegistry() {
  return [
    BlogPageContentType,
    ArticlePageContentType,
    SEOContract,  // Contracts go here too
    // ... other types
  ];
}

// In initDisplayTemplateRegistry.ts
export function initDisplayTemplateRegistry() {
  return [
    ArticleCardTemplate,
    ArticleListTemplate,
    // ... other templates
  ];
}
```

## 5. Contracts with Base Type

**Problem:** Adding a `baseType` field to contracts.

**Why it fails:** Contracts are reusable property sets, not content types. They don't have a base type.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Contracts don't have baseType
export const SEOContract = contract({
  key: 'seo',
  baseType: '_contract',  // This field doesn't exist for contracts
  // ...
});
```

**Solution:** Omit `baseType` from contracts:
```typescript
// ✅ CORRECT
export const SEOContract = contract({
  key: 'seo',
  displayName: 'SEO Properties',
  properties: {
    // ... properties
  }
});
```

## 6. Using Strings Instead of Type References

**Problem:** Using string literals for `contentType`, `allowedTypes`, or `restrictedTypes` when referencing custom content types.

**Why it fails:** The SDK expects references to the actual type objects, not string names (except for base types like `'_image'`).

**Example of what NOT to do:**
```typescript
// ❌ WRONG - Using string instead of type reference
hero: {
  type: 'component',
  contentType: 'HeroComponentType'  // String instead of reference
}

featuredArticle: {
  type: 'content',
  allowedTypes: ['ArticleContentType']  // String instead of reference
}
```

**Solution:** Use the actual type object references:
```typescript
// ✅ CORRECT - Using type object references
hero: {
  type: 'component',
  contentType: HeroComponentType  // Reference to the type object
}

featuredArticle: {
  type: 'content',
  allowedTypes: [ArticleContentType]  // Reference to the type object
}

// Base types can remain as strings:
featuredImage: {
  type: 'contentReference',
  allowedTypes: ['_image']  // Base types are strings
}
```

## 7. Incorrect editorSettings Usage

**Problem:** Using `editorSettings` with wrong structure or on non-richText properties.

**Why it matters:** `editorSettings` is now supported in SDK for configuring TinyMCE toolbar, but only on `richText` properties.

**Example of what NOT to do:**
```typescript
// ❌ WRONG - editorSettings on non-richText property
title: {
  type: 'string',
  editorSettings: {  // Only valid on richText
    preset: 'minimal'
  }
}
```

**Solution:** Use `editorSettings` only on `richText` properties:
```typescript
// ✅ CORRECT - editorSettings on richText property
bodyText: {
  type: 'richText',
  displayName: 'Body Text',
  group: 'content',
  editorSettings: {
    preset: 'minimal'  // Now supported!
  }
}
```

## Quick Checklist

Before finalizing your content type definition:

- [ ] No nested arrays
- [ ] Base type is one of the documented valid types
- [ ] Component properties have both `type` and `contentType` fields
- [ ] Content type/contract/display template is registered in the appropriate registry
- [ ] Contracts don't have a `baseType` field
- [ ] All required imports are present
- [ ] File naming follows conventions (e.g., `BlogPage.tsx` for BlogPage type)
- [ ] Type references use objects (e.g., `ArticleContentType`), not strings (e.g., `'ArticleContentType'`)
- [ ] `editorSettings` used only on `richText` properties (not on string/other types)
