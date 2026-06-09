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

**3a. URL Properties**

**CRITICAL**: URL properties (`type: 'url'`) return an `InferredUrl` object, NOT a string. Always access `.default` for the href value.

```tsx
// ✅ CORRECT: Access .default from InferredUrl object
{content.websiteUrl && (
  <a href={content.websiteUrl.default ?? undefined} {...pa('websiteUrl')}>
    Visit Website
  </a>
)}

// ❌ WRONG: Using URL directly as string causes TypeScript error
{content.websiteUrl && (
  <a href={content.websiteUrl}>Visit</a>
)}
// Error: Type 'InferredUrl' is not assignable to type 'string'
```

**3b. Link Properties**

**CRITICAL**: Link properties (`type: 'link'`) return a `LinkItem` object with nullable fields. TypeScript requires `string | undefined` for HTML attributes, NOT `string | null`. Always use `?? undefined` to convert null to undefined.

```tsx
// ✅ CORRECT: Convert null to undefined with ?? undefined
{content.ctaButton && (
  <a 
    href={content.ctaButton.url ?? undefined}
    title={content.ctaButton.title ?? undefined}
    target={content.ctaButton.target ?? undefined}
    rel={content.ctaButton.target === '_blank' ? 'noopener noreferrer' : undefined}
    {...pa('ctaButton')}
  >
    {content.ctaButton.text}
  </a>
)}

// ❌ WRONG: Passing null to attributes causes TypeScript error
{content.ctaButton && (
  <a 
    title={content.ctaButton.title}
    target={content.ctaButton.target}
  >
// Error: Type 'string | null' is not assignable to type 'string | undefined'
```

For detailed patterns on URL and link rendering, see `references/react-patterns.md`.

**4. ContentReference Properties**
ContentReference properties return `InferredContentReference` which contains `{ key, url, item }` but NOT `__typename`. They cannot be used with `OptimizelyComponent`.

For single contentReference:
```tsx
{content.relatedPage?.url && (
  <a href={content.relatedPage.url.default ?? ''}>
    {content.relatedPage.key}
  </a>
)}
```

For array of contentReferences:
```tsx
{content.relatedPages?.map((ref, i) => (
  ref?.url && (
    <a key={i} href={ref.url.default ?? ''}>
      {ref.key}
    </a>
  )
))}
```

**5. Array Properties (Content Type Arrays)**
For arrays of content types (not contentReferences), use OptimizelyComponent:

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

Note: Use `OptimizelyComponent` for `type: 'content'` arrays, NOT for `type: 'contentReference'` arrays.

**6. Embedded Component Properties**
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

**7. Experience Types with Composition**
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

**8. Display Templates**
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

**CRITICAL WORKFLOW**: Import path errors are the #1 issue when registering components. Follow this exact sequence:

1. ✅ Find the registration file
2. ✅ **Read tsconfig.json to understand path aliases** (REQUIRED)
3. ✅ Check existing imports in registration file for patterns
4. ✅ Calculate correct import path based on tsconfig + file location
5. ✅ Verify with `npx tsc --noEmit` before finalizing
6. ✅ Use relative imports as fallback if aliases fail

**Do NOT skip Step 2 (reading tsconfig.json).** Assuming path aliases without verification leads to broken imports.

### Find the Registration File

1. Search for files importing `initReactComponentRegistry`:
   ```bash
   grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
   ```
2. Typically found in `app/layout.tsx` or `src/app/layout.tsx`

### Determine the Correct Import Path

**CRITICAL**: Before adding imports, you MUST check `tsconfig.json` to understand the path alias configuration. This is the most common source of import errors.

#### Step 1: Read tsconfig.json

**ALWAYS read `tsconfig.json` first** before generating any imports:

```bash
# Read the tsconfig.json file
cat tsconfig.json
```

Look for these critical fields:

1. `compilerOptions.baseUrl` - REQUIRED for path aliases to work (usually `"."` or `"./"`)
2. `compilerOptions.paths` - Defines the alias mappings

Common configurations:
- `"@/*": ["./src/*"]` → Alias `@/` maps to `src/` directory
- `"@/*": ["./*"]` → Alias `@/` maps to project root
- `"~/*": ["./src/*"]` → Alternative alias convention
- No `paths` field → Path aliases not configured, use relative imports

**If `baseUrl` is missing**, path aliases won't work regardless of the `paths` configuration. In this case, use relative imports.

#### Step 2: Calculate the Correct Import Path

Given the component file location and tsconfig configuration, calculate the import path:

**Example: Component at `src/components/Article.tsx`**

| tsconfig paths | baseUrl | Import as | Why |
|----------------|---------|-----------|-----|
| `"@/*": ["./src/*"]` | `"."` | `@/components/Article` | Alias strips `./src/`, add `@/` |
| `"@/*": ["./*"]` | `"."` | `@/src/components/Article` | Alias is at root, keep full path |
| `"~/*": ["./src/*"]` | `"."` | `~/components/Article` | Different alias symbol |
| No paths | `"./src"` | `./components/Article` | Relative from baseUrl |
| No paths, no baseUrl | N/A | `../src/components/Article` | Relative from layout.tsx |

**Step-by-step calculation for `"@/*": ["./*"]` (root mapping):**

1. Component file: `src/components/Article.tsx`
2. Alias `@/*` maps to `./*` (project root)
3. Path from root: `src/components/Article.tsx`
4. Apply alias: Replace `./` with `@/` → `@/src/components/Article.tsx`
5. Remove extension: `@/src/components/Article`

**Result:** `import Article from '@/src/components/Article'`

**Step-by-step calculation for `"@/*": ["./src/*"]` (src mapping):**

1. Component file: `src/components/Article.tsx`
2. Alias `@/*` maps to `./src/*`
3. Remove `./src/` prefix: `components/Article.tsx`
4. Apply alias: Add `@/` → `@/components/Article.tsx`
5. Remove extension: `@/components/Article`

**Result:** `import Article from '@/components/Article'`

#### Step 3: Match Existing Import Patterns (Most Reliable)

**The most reliable method is to copy the exact pattern from existing imports in the registration file.**

1. **Find the registration file:**
   ```bash
   grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
   ```

2. **Open the file and examine existing imports:**
   ```tsx
   // Example: app/layout.tsx
   import HomePage from '@/components/HomePage';  // ← Existing pattern
   import Hero from '@/src/components/Hero';       // ← Different project might use this
   ```

3. **Copy the exact pattern:**
   - If existing imports use `@/components/...`, use `@/components/Article`
   - If existing imports use `@/src/components/...`, use `@/src/components/Article`
   - If existing imports use relative paths `../`, calculate the relative path

**This approach is safer than calculating from tsconfig because:**
- Existing imports are already proven to work
- They account for any build tool quirks (Next.js, Vite, etc.)
- They reflect the actual working configuration

#### Step 4: Verify the Import Path Works

**After determining the import path, verify it before finalizing:**

1. **Add the import temporarily:**
   ```tsx
   import Article, { ArticleContentType } from '@/components/Article';
   ```

2. **Run TypeScript type checking:**
   ```bash
   npx tsc --noEmit
   ```
   
   Expected output:
   - ✅ No errors → Import path works correctly
   - ❌ "Cannot find module" → Import path is wrong, continue to fixes below

3. **Common fixes for import errors:**

   **Error: "Cannot find module '@/...'"**
   - **Cause**: Path alias not configured or baseUrl missing
   - **Fix**: Check `tsconfig.json` for `baseUrl` field
   - **Fallback**: Use relative import `../src/components/Article`

   **Error: Module resolves but path seems wrong (e.g., `@/components/Article` when file is at `src/components/Article.tsx` and tsconfig has `"@/*": ["./*"]`)**
   - **Cause**: Path calculation error - forgot to include `src/` when alias maps to root
   - **Fix**: Correct import to `@/src/components/Article`
   - **Verify**: Check that `tsconfig.json` has `"@/*": ["./*"]` (maps to root, not src)

   **Error: "Module has no default export"**
   - **Cause**: Component doesn't use `export default`
   - **Fix**: Verify component file uses `export default function Article() {...}`

   **Error: "Module has no exported member 'ArticleContentType'"**
   - **Cause**: Content type not exported or wrong name
   - **Fix**: Verify `export const ArticleContentType = contentType({...})`

4. **Test in development server:**
   ```bash
   npm run dev  # or yarn dev, pnpm dev
   ```
   
   Check for module resolution errors in the console. If the dev server fails to start with import errors, the path is incorrect.

#### Step 5: Use Relative Imports as Safe Fallback

If path aliases fail or are unclear, **relative imports always work**:

```tsx
// From: app/layout.tsx
// To:   src/components/Article.tsx
// Relative path: ../src/components/Article

import Article, { ArticleContentType } from '../src/components/Article';
```

**When to use relative imports:**
- `tsconfig.json` is missing `baseUrl` or `paths`
- Path alias verification failed (tsc errors)
- No existing imports to copy pattern from
- Quick fix during development (can refactor later)

**Calculate relative path:**
1. From file: `app/layout.tsx`
2. To file: `src/components/Article.tsx`
3. Go up one level: `../`
4. Navigate to target: `../src/components/Article.tsx`
5. Remove extension: `../src/components/Article`

### Add Imports and Registration

**IMPORTANT**: The import path in these examples is `@/src/components/Article` because we assume `tsconfig.json` has `"@/*": ["./*"]` (maps to root). If your tsconfig has `"@/*": ["./src/*"]`, use `@/components/Article` instead.

**For regular components (most common case):**

```tsx
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

// Example: tsconfig.json has "@/*": ["./*"] (maps to project root)
// Component file: src/components/Article.tsx
// Import path: @/src/components/Article
import Article, { ArticleContentType } from '@/src/components/Article';

// If your tsconfig.json has "@/*": ["./src/*"] instead (maps to src directory)
// Use this import instead:
// import Article, { ArticleContentType } from '@/components/Article';

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
- **ALWAYS check tsconfig.json first** to determine correct import path
- Import `initContentTypeRegistry` from `@optimizely/cms-sdk` (NOT from react/server)
- `initContentTypeRegistry` takes an **array** of content types
- Import both the component (default export) AND the content type (named export)
- Only import what you use - don't import `ArticleContentType` if you're not registering it

**Common error pattern to avoid:**

```tsx
// ❌ WRONG: Assuming "@/" maps to src when it actually maps to root
// tsconfig.json: "@/*": ["./*"]
// Component file: src/components/Article.tsx
import Article from '@/components/Article';  // ❌ Module not found!

// ✅ CORRECT: Include src/ because @/ maps to project root
import Article from '@/src/components/Article';  // ✅ Works!
```

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

## Step 5: Verify Import Resolution

**Before reporting completion**, verify the import actually works:

1. **Run type checking:**
   ```bash
   npx tsc --noEmit
   ```
   
   Expected: No errors related to module resolution

2. **Start dev server (if not running):**
   ```bash
   npm run dev
   ```
   
   Expected: Server starts without import errors

3. **Check console for errors:**
   - Look for "Cannot resolve module" errors
   - If errors appear, fix the import path using the steps in Step 4

**If verification fails**, do NOT report completion. Instead:
- Re-read tsconfig.json
- Check existing imports for pattern
- Try relative import as fallback
- Fix the error before reporting success

## Step 6: Inform the User

After successfully creating, registering, AND verifying the component:

1. Show a summary of what was created:
   ```
   ✓ Created React component `Article` in src/components/Article.tsx
   ✓ Registered component in app/layout.tsx
   ✓ Verified import resolution (no errors)
   ```

2. Mention next steps:
   - Test the component by visiting the page in the browser (if dev server is running)
   - Sync any content type changes with `npx @optimizely/cms-cli@latest config push`

3. If display templates were involved, remind about registering them:
   - Display templates need to be added to `initDisplayTemplateRegistry` as well
   - Point to the `optimizely-model` skill for display template registration

## Practical Example: Complete Registration Workflow

This example shows the complete workflow for a fresh Next.js project with the common `"@/*": ["./*"]` configuration.

### Scenario

- Fresh Next.js 14 App Router project
- Components in `src/components/` directory
- tsconfig.json has `"@/*": ["./*"]` (maps to project root, NOT src)
- Creating first component `BlankExperience`

### Step-by-Step Workflow

**Step 1: Read tsconfig.json**

```bash
cat tsconfig.json
```

Output:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]  // ← Maps to project root
    }
  }
}
```

**Analysis**: The alias `@/` maps to project root (`./*`), NOT to `src/`. This means imports must include the `src/` prefix.

**Step 2: Find registration file**

```bash
grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
```

Output:
```
app/layout.tsx:import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
```

**Step 3: Check existing imports**

```tsx
// app/layout.tsx (before adding BlankExperience)
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

// No existing component imports yet (first component)
```

**Step 4: Calculate import path**

```
Component file location: src/components/experiences/BlankExperience.tsx
tsconfig alias: "@/*" maps to "./*" (project root)

Calculation:
1. Full path from root: src/components/experiences/BlankExperience.tsx
2. Apply alias: Replace "./" with "@/" → @/src/components/experiences/BlankExperience.tsx
3. Remove extension: @/src/components/experiences/BlankExperience

Result: import BlankExperience from '@/src/components/experiences/BlankExperience'
```

**Step 5: Add import and registration**

```tsx
// app/layout.tsx
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import BlankExperience, { BlankExperienceContentType } from '@/src/components/experiences/BlankExperience';

initContentTypeRegistry([
  BlankExperienceContentType,
]);

initReactComponentRegistry({
  resolver: {
    BlankExperience,
  },
});
```

**Step 6: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors ✅

**Common mistake for this scenario:**

```tsx
// ❌ WRONG: Forgot that @/ maps to root, not src
import BlankExperience from '@/components/experiences/BlankExperience';
// Error: Cannot find module '@/components/experiences/BlankExperience'

// ✅ CORRECT: Include src/ because @/ maps to project root
import BlankExperience from '@/src/components/experiences/BlankExperience';
```

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
4. Register component in initReactComponentRegistry:
   - **READ tsconfig.json first** to understand path aliases (CRITICAL)
   - Check existing imports for patterns
   - Calculate correct import path based on tsconfig configuration
   - Verify with `npx tsc --noEmit` before finalizing
   - Use relative imports as safe fallback if aliases fail
5. **Verify import resolution** before reporting completion
6. Inform user of completion and next steps

Always prioritize:
- **Verifying tsconfig.json path aliases before generating imports** (prevents 90% of import errors)
- Following SDK patterns exactly (preview attributes, ContentProps, etc.)
- Using optional chaining for safety
- Providing sensible fallbacks
- Writing semantic, accessible HTML
- Keeping component code clean and readable
- **Testing imports with `npx tsc --noEmit` before reporting success**

## Additional Resources

### Reference Files

For detailed information, consult:

- **`references/styling-strategy.md`** - CSS/SCSS integration guide with patterns for CSS Modules, Tailwind, and styling best practices
- **`references/react-patterns.md`** - React patterns for rendering different property types (content references, booleans, dates, links, etc.)
- **`references/edge-cases.md`** - Edge cases and considerations including optional chaining, null fallbacks, keys, and preview attributes
- **`references/troubleshooting.md`** - Solutions to common issues with types, preview mode, component rendering, and images
- **`references/path-resolution-workflow.md`** - Complete guide to verifying tsconfig.json path aliases and debugging import errors
