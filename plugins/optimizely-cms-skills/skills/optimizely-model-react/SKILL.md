---
name: optimizely-model-react
description: This skill should be used when the user asks to "create a React component for BlogPage", "generate the component", "build the display template component", "add preview attributes", "render rich text", "implement the Hero component", "create component for Article", or mentions creating React components for Optimizely content types or display templates.
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
   - **CRITICAL for display templates**: Read the `tag` field value - this exact value will be used as the key in the component registry

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

Before generating components, check for existing styles to maintain consistency. See `references/styling-strategy.md` for detailed guidance on integrating CSS/SCSS classes, CSS Modules, Tailwind, and handling projects without styles.

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
  tag: 'Square',  // CRITICAL: This tag value must match the key in initReactComponentRegistry tags object
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

**CRITICAL**: The `tag` field in the display template definition is the exact key that MUST be used in the `initReactComponentRegistry` tags object. If the display template has `tag: 'Square'`, then the registration MUST use `tags: { Square: SquareTile }`.

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

After creating the component, automatically register it in both `initContentTypeRegistry` and `initReactComponentRegistry`.

### Find the Registration File

1. Search for files importing `initReactComponentRegistry`:
   ```bash
   grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
   ```
2. Typically found in `app/layout.tsx` or `src/app/layout.tsx`

### Determine the Correct Import Path

**CRITICAL**: Before adding imports, check `tsconfig.json` to understand the path alias configuration:

#### Step 1: Read tsconfig.json

1. Open `tsconfig.json` and find `compilerOptions.paths`
2. Common configurations:
   - `"@/*": ["./src/*"]` → Alias maps to src directory
   - `"@/*": ["./*"]` → Alias maps to project root
   - `"~/*": ["./src/*"]` → Alternative alias convention
3. Also check `compilerOptions.baseUrl` (usually `"."` or `"./"`)

#### Step 2: Determine the Import Path

If the component file is at `src/components/Article.tsx`:

| tsconfig paths | baseUrl | Import as |
|----------------|---------|-----------|
| `"@/*": ["./src/*"]` | `"."` | `@/components/Article` |
| `"@/*": ["./*"]` | `"."` | `@/src/components/Article` |
| `"~/*": ["./src/*"]` | `"."` | `~/components/Article` |
| No paths, only baseUrl | `"./src"` | `./components/Article` |

#### Step 3: Verify the Import Path Works

**BEFORE adding the import to the registration file**, verify the path resolves correctly:

1. **Check existing imports** in the registration file:
   - Look for other component imports in the same file
   - Match their pattern (if they use `@/components/...`, use the same)

2. **Test the import path** by adding it temporarily:
   ```tsx
   import Article, { ArticleContentType } from '@/components/Article';
   ```

3. **Verify TypeScript resolves it**:
   - Check for red squiggles in your editor
   - Run `npx tsc --noEmit` to verify no import errors
   - If error "Cannot find module '@/components/Article'", adjust the path

4. **Common fixes for import errors**:
   - **Error: "Cannot find module '@/...'"**
     - Check if `tsconfig.json` has `"paths"` configured
     - Verify `baseUrl` is set (required for paths to work)
     - Try relative path instead: `../components/Article`
   
   - **Error: "Module has no default export"**
     - Verify component uses `export default function ...`
     - Check you're importing from the right file
   
   - **Error: "Module has no exported member 'ArticleContentType'"**
     - Verify content type is exported: `export const ArticleContentType = ...`
     - Check you're importing the named export correctly

#### Step 4: Match Existing Patterns

If the registration file already has imports, copy their exact pattern:

```tsx
// Existing imports in the file:
import HomePage, { HomePageContentType } from '@/components/HomePage';
import Hero from '@/components/Hero';

// Your new import should match:
import Article, { ArticleContentType } from '@/components/Article';  // ✅ Matches pattern
```

### Add Imports and Registration

**For regular components (most common case):**

```tsx
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article, { ArticleContentType } from '@/src/components/Article'; // Adjust path based on tsconfig

// Register the content type
initContentTypeRegistry([
  ArticleContentType,
  // ... other content types
]);

// Register the React component
initReactComponentRegistry({
  resolver: {
    Article,
    // ... other components
  },
});
```

**Key points:**
- Import `initContentTypeRegistry` from `@optimizely/cms-sdk` (NOT from react/server)
- `initContentTypeRegistry` takes an **array** of content types
- Import both the component (default export) AND the content type (named export)
- Only import what you use - don't import `ArticleContentType` if you're not registering it

**For components with display template variants:**

When a content type has multiple display templates with different `tag` values, you MUST:

**STEP 1**: Read the display template definition to find the `tag` field value
**STEP 2**: Use that EXACT tag value as the key in the `tags` object

Example: If the display template is defined as:
```tsx
export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  displayName: 'Square Display',
  tag: 'Square',  // ← This is the value you need
  // ...
});
```

Then the registration MUST use `'Square'` as the key:

```tsx
import { initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Tile, { 
  SquareTile,
  TileContentType,
  SquareDisplayTemplate 
} from '@/src/components/Tile'; // Adjust path based on tsconfig

initContentTypeRegistry([
  TileContentType,
  // ... other content types
]);

initDisplayTemplateRegistry([
  SquareDisplayTemplate,
  // ... other display templates
]);

initReactComponentRegistry({
  resolver: {
    Tile: {
      default: Tile,           // Default component (no display template)
      tags: {
        Square: SquareTile,    // ← Key MUST match display template's tag field
      },
    },
    // ... other components
  },
});
```

**CRITICAL POINTS:**
- The key in the `tags` object MUST match the `tag` field from the display template definition
- Do NOT use the component name, display template name, or any other identifier
- Do NOT make up tag names - always read them from the display template definition
- Example mistake: `tags: { SquareTile: SquareTile }` ❌ - component name doesn't match tag
- Example correct: `tags: { Square: SquareTile }` ✅ - matches the tag field

The registry matches components using:
1. First, check if there's a display template `tag` setting in the content
2. If tag matches, use `tags[tagName]` component
3. Otherwise, use the `default` component
4. If no display template variants, just register the component directly by name

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

## Common Patterns

For detailed React patterns for rendering different property types (content references, booleans, enums, dates, links), see `references/react-patterns.md`.

## Edge Cases

Always use optional chaining, provide null fallbacks, use stable keys for arrays, and put preview attributes on array containers. See `references/edge-cases.md` for detailed guidance.

## Troubleshooting

For solutions to type errors, preview issues, component rendering problems, and image loading issues, see `references/troubleshooting.md`.

For detailed path resolution verification and debugging, see `references/path-resolution-workflow.md`.

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

## Additional Resources

### Reference Files

For detailed information, consult:

- **`references/styling-strategy.md`** - CSS/SCSS integration guide with patterns for CSS Modules, Tailwind, and styling best practices
- **`references/react-patterns.md`** - React patterns for rendering different property types (content references, booleans, dates, links, etc.)
- **`references/edge-cases.md`** - Edge cases and considerations including optional chaining, null fallbacks, keys, and preview attributes
- **`references/troubleshooting.md`** - Solutions to common issues with types, preview mode, component rendering, and images
- **`references/path-resolution-workflow.md`** - Complete guide to verifying tsconfig.json path aliases and debugging import errors
