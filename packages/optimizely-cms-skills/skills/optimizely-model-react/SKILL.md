---
name: optimizely-model-react
description: Generate React components for Optimizely CMS content types and display templates. Use this skill when the user asks to create/add/generate a React component, component implementation, or React rendering for an Optimizely content type, page type, component type, block type, experience type, or display template. Also trigger when they say things like "add React component for Article", "create component for BlogPage", "implement the Hero component", "render the CardTemplate", or "make a component for that content type". This skill handles React component generation and registration - for TypeScript modeling only, use the optimizely-model skill instead.
---

# Optimizely React Component Generator

This skill generates React components for Optimizely CMS content types and display templates, following SDK patterns and best practices.

## When to Use This Skill

Use this skill when the user wants to:
- Create a React component for an existing content type definition
- Implement rendering logic for a page, component, or experience type
- Add a React component for a display template
- Generate component boilerplate that follows Optimizely SDK patterns

## Prerequisites

Before generating a React component, you need:
1. An existing content type or display template definition (created via `optimizely-model` skill)
2. The `optimizely.config.mjs` file to determine the components directory
3. The SDK package `@optimizely/cms-sdk` installed

## Step 1: Locate the Content Type or Display Template

First, find where the content type or display template is defined:

1. Ask the user which content type or display template they want to create a component for
2. Search for the content type definition using Grep:
   ```
   pattern: "export const.*ContentType = contentType"
   or
   pattern: "export const.*DisplayTemplate = displayTemplate"
   ```
3. Read the file containing the definition to understand:
   - Property names and types
   - Base type (page, component, experience)
   - Array items and content references
   - Embedded components
   - Display template settings

## Step 2: Determine File Strategy

Choose where to add the React component:

**Strategy A: Add to existing file** (preferred if content type is already in a .tsx file)
- If the content type definition is already in a .tsx file (e.g., `Article.tsx`)
- Add the component to the same file below the content type definition
- This keeps related code together

**Strategy B: Create new file**
- If the content type is in a non-component directory
- If the user explicitly asks for a separate file
- Create a new .tsx file named after the content type

## Step 2.5: Check for Existing CSS/SCSS Classes

Before generating the component, check for existing styles to maintain consistency:

1. **Locate style files** - Search for CSS/SCSS files in the project:
   ```
   glob: "**/*.css"
   glob: "**/*.scss"
   glob: "**/*.module.css"
   glob: "**/*.module.scss"
   ```

2. **Search for relevant classes** - Look for class names that might apply to your component:
   - If creating a Hero component, search for patterns like `hero`, `banner`, `header`
   - If creating a Card component, search for `card`, `tile`, `item`
   - Search for common structural classes like `container`, `wrapper`, `section`, `grid`
   - Look for typography classes like `heading`, `title`, `body-text`, `subtitle`

3. **Review existing components** - Check how similar components use className:
   ```
   grep: "className=" glob: "**/*.tsx"
   ```
   Look at components with similar visual structure or base types

4. **Prefer existing classes** when applicable:
   - Use existing classes that match the component's purpose
   - Follow the project's naming conventions (BEM, camelCase, kebab-case, etc.)
   - Combine existing utility classes rather than creating new ones

5. **Only add new classes** when:
   - No existing classes fit the component's purpose
   - The component needs unique styling not covered by existing classes
   - Follow the project's class naming pattern when adding new ones

**Example workflow:**
```tsx
// After searching and finding existing classes
<article className='blog-experience'>  // Found in existing components
  <header className='blog-header'>      // Reusing existing header style
    <h1 {...pa('title')}>{content.title}</h1>
  </header>
  <section className='blog-articles' {...pa('articles')}>  // Consistent naming
    ...
  </section>
</article>
```

If no relevant CSS files exist or the project doesn't use classNames, skip this step and generate minimal semantic HTML without className attributes.

## Step 3: Generate the React Component

Use these patterns based on the content type structure:

### Basic Component Template

```tsx
import { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof XYZContentType>;
};

export default function XYZ({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  
  return (
    <div>
      <h1 {...pa('heading')}>{content.heading}</h1>
    </div>
  );
}
```

### Key Patterns to Apply

**1. Preview Attributes**
Always use preview attributes for editable properties. This enables in-context editing in the CMS:

```tsx
const { pa } = getPreviewUtils(content);

// For simple properties
<h1 {...pa('heading')}>{content.heading}</h1>
<p {...pa('subtitle')}>{content.subtitle}</p>

// For nested properties (embedded components)
<div {...pa('hero.heading')}>{content.hero?.heading}</div>
```

**2. RichText Properties**
For `richText` type properties, use the RichText component:

```tsx
import { RichText } from '@optimizely/cms-sdk/react/richText';

// Basic usage
<RichText content={content.body?.json} />

// With custom element renderers (optional)
<RichText 
  content={content.body?.json}
  elements={{
    'heading-two': (props) => <h1 style={{ color: 'blue' }}>{props.text}</h1>
  }}
/>

// Or use HTML rendering (simpler but less customizable)
<div {...pa('body')} dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }} />
```

**3. Image Properties**
For image content references, use damAssets and the src utility:

```tsx
import { damAssets } from '@optimizely/cms-sdk';

const { pa, src } = getPreviewUtils(content);
const { getSrcset, getAlt } = damAssets(content);
const imageUrl = src(content.image);

{content.image && imageUrl && (
  <img
    src={imageUrl}
    srcSet={getSrcset(content.image)}
    sizes="(max-width: 768px) 100vw, 50vw"
    alt={getAlt(content.image, 'Default alt text')}
  />
)}
```

For Next.js projects, prefer using the Image component:

```tsx
import Image from 'next/image';

const imageUrl = src(content.background);

{imageUrl && <Image src={imageUrl} alt="" fill={true} />}
```

**4. Array Properties**
Map over arrays and render with OptimizelyComponent:

```tsx
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

<div {...pa('sections')}>
  {content.sections?.map((section, index) => (
    <OptimizelyComponent key={index} content={section} />
  ))}
</div>

// With optional chaining for safety
<div {...pa('articles')}>
  {(content.articles ?? []).map((article, i) => (
    <OptimizelyComponent key={i} content={article} />
  ))}
</div>
```

**5. Embedded Component Properties**
For `type: 'component'` properties, access the nested data directly:

```tsx
// The property is embedded inline, not a reference
{content.hero && (
  <header {...pa('hero')}>
    <h1 {...pa('hero.heading')}>{content.hero.heading}</h1>
    <p {...pa('hero.summary')}>{content.hero.summary}</p>
  </header>
)}
```

**6. Experience Types with Composition**
Experiences need OptimizelyComposition to render the visual builder nodes:

```tsx
import { 
  OptimizelyComposition,
  ComponentContainerProps,
  getPreviewUtils 
} from '@optimizely/cms-sdk/react/server';

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function MyExperience({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  
  return (
    <main>
      {/* Your content properties */}
      <h1 {...pa('title')}>{content.title}</h1>
      
      {/* Visual builder composition */}
      <OptimizelyComposition 
        nodes={content.composition.nodes ?? []} 
        ComponentWrapper={ComponentWrapper} 
      />
    </main>
  );
}
```

**7. Display Templates**
For display template components, accept displaySettings as a prop:

```tsx
import { ContentProps } from '@optimizely/cms-sdk';

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  displayName: 'Square Display',
  baseType: '_component',
  settings: {
    color: {
      editor: 'select',
      displayName: 'Color',
      choices: {
        red: { displayName: 'Red' },
        blue: { displayName: 'Blue' },
      },
    },
  },
  tag: 'Square',
});

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  
  return (
    <div style={{ backgroundColor: displaySettings?.color }}>
      <h1 {...pa('title')}>{content.title}</h1>
    </div>
  );
}
```

The `tag` field in the display template determines the component name used during registration.

### Choosing Semantic HTML

Use appropriate semantic HTML based on the base type:
- `_page` → wrap in `<main>`
- `_component` with `sectionEnabled` → wrap in `<section>` or `<article>`
- `_component` with `elementEnabled` → use `<div>`, `<span>`, or specific elements like `<a>`, `<button>`
- `_experience` → wrap in `<main>`

### Import Organization

Organize imports logically:

```tsx
// SDK imports
import { contentType, ContentProps, damAssets } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { 
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyComposition 
} from '@optimizely/cms-sdk/react/server';

// Framework imports (Next.js, etc.)
import Image from 'next/image';

// Local imports
import { HeroContentType } from './Hero';
```

## Step 4: Register the Component

After creating the component, automatically register it in `initReactComponentRegistry`:

### Find the Registration File

1. Search for files importing `initReactComponentRegistry`:
   ```bash
   grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
   ```
2. Typically found in `app/layout.tsx` or `src/app/layout.tsx`

### Add Import and Registration

**For regular components:**

```tsx
import Article, { ArticleContentType } from '@/components/Article';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

initReactComponentRegistry({
  resolver: {
    Article,  // Add this line
    // ... other components
  },
});
```

**For components with display template variants:**

When a content type has multiple display templates with different `tag` values:

```tsx
import Tile, { 
  SquareTile,
  TileContentType,
  SquareDisplayTemplate 
} from '@/components/Tile';

initReactComponentRegistry({
  resolver: {
    Tile: {
      default: Tile,           // Default component
      tags: {
        Square: SquareTile,    // Display template with tag='Square'
      },
    },
    // ... other components
  },
});
```

The registry matches components using:
1. First, check if there's a display template `tag` setting in the content
2. If tag matches, use `tags[tagName]` component
3. Otherwise, use the `default` component
4. If no display template variants, just register the component directly by name

### Determine the Import Alias

Check the existing imports in the layout file to determine the correct path alias:
- If other imports use `@/components/...`, use that pattern
- If they use relative paths like `../components/...`, match that
- Most Next.js projects use `@/` configured in `tsconfig.json`

## Step 5: Inform the User

After successfully creating and registering the component:

1. Show a summary of what was created:
   ```
   ✓ Created React component `Article` in src/components/Article.tsx
   ✓ Registered component in src/app/layout.tsx
   ```

2. Mention next steps:
   - Test the component by visiting the page in the browser (if dev server is running)
   - Sync any content type changes with `npx @optimizely/cms-cli@latest config push`

3. If display templates were involved, remind about registering them:
   - Display templates need to be added to `initDisplayTemplateRegistry` as well
   - Point to the `optimizely-model` skill for display template registration

## Common Patterns Reference

### Content Reference Properties

```tsx
// Single content reference
{content.featuredArticle && (
  <OptimizelyComponent content={content.featuredArticle} />
)}

// Array of content references
{content.relatedArticles?.map((article, i) => (
  <OptimizelyComponent key={i} content={article} />
))}
```

### Boolean Properties

```tsx
{content.showHeader && (
  <header>...</header>
)}
```

### Enum/Select Properties

```tsx
<div className={content.theme === 'dark' ? 'dark-mode' : 'light-mode'}>
  ...
</div>
```

### DateTime Properties

```tsx
<span>
  {new Date(content.publishDate).toLocaleDateString()}
</span>
```

### Link Properties

For `type: 'link'` properties (not `type: 'url'`):

```tsx
{content.ctaLink && (
  <a 
    href={content.ctaLink.url} 
    title={content.ctaLink.title}
    target={content.ctaLink.target}
  >
    {content.ctaLink.text}
  </a>
)}
```

## Edge Cases and Considerations

### Optional Chaining

Always use optional chaining for properties that might not be set:

```tsx
{content.body?.json}
{content.sections?.map(...)}
{content.hero?.heading}
```

### Null Fallbacks

Provide sensible fallbacks for missing data:

```tsx
<img src={imageUrl} alt={getAlt(content.image, 'Decorative image')} />
<RichText content={content.body?.json ?? undefined} />
{content.items ?? []}
```

### Key Props

When mapping arrays, use stable keys when possible:

```tsx
// Prefer content ID if available
{content.items?.map((item) => (
  <OptimizelyComponent key={item._metadata?.key ?? item.id} content={item} />
))}

// Fall back to index if necessary
{content.items?.map((item, i) => (
  <OptimizelyComponent key={i} content={item} />
))}
```

### Preview Attributes for Arrays

When using preview attributes on mapped arrays, use the array property name:

```tsx
<div {...pa('sections')}>
  {content.sections?.map((section, i) => (
    <OptimizelyComponent key={i} content={section} />
  ))}
</div>
```

Don't put `pa()` on individual items - the SDK handles that internally.

## Troubleshooting

### Type Errors

If you see TypeScript errors about missing properties:
- Ensure the content type definition includes all properties being accessed
- Use optional chaining `?.` for properties that might be undefined
- Check that imports are correct (`ContentProps`, `getPreviewUtils`, etc.)

### Preview Not Working

If preview attributes aren't working in the CMS:
- Verify `getPreviewUtils(content)` is called
- Ensure `{...pa('propertyName')}` is spread on the correct element
- Check that `withAppContext` wraps the page component

### Component Not Rendering

If the component doesn't render:
- Verify it's registered in `initReactComponentRegistry`
- Check the export is correct (`export default function ComponentName`)
- Ensure the component name matches the content type key
- For display templates, verify the `tag` matches the registry

### Images Not Loading

If images don't appear:
- Use `src()` from `getPreviewUtils` to get the URL
- Check that the property type is `'contentReference'` with `allowedTypes: ['_image']`
- For DAM assets, use `damAssets(content)` utilities
- Verify the image content reference exists in the CMS

## Summary

The workflow for this skill:
1. Find the content type or display template definition
2. Determine if adding to existing file or creating new file
3. Generate React component following SDK patterns:
   - Import necessary utilities
   - Define Props type with ContentProps
   - Use getPreviewUtils for preview attributes
   - Handle RichText, images, arrays, and nested content appropriately
   - Use semantic HTML
4. Register component in initReactComponentRegistry
5. Inform user of completion and next steps

Always prioritize:
- Following SDK patterns exactly (preview attributes, ContentProps, etc.)
- Using optional chaining for safety
- Providing sensible fallbacks
- Writing semantic, accessible HTML
- Keeping component code clean and readable
