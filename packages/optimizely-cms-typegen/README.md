# @optimizely/cms-typegen

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-typegen)](https://www.npmjs.com/package/@optimizely/cms-typegen)

The official type generator and CLI tool for Optimizely CMS. Automatically generates component registry and TypeScript type definitions from your content type definitions, enabling full type safety and hot reload during development.

> **Note:** This package is designed for Vite and Next.js projects using [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk).

## Features

- **Auto-generates registry** - Creates `registry.ts` and `global.d.ts` from your components
- **Registers components** - Maps each component to its content type, with tag variants
- **Watch mode** - Hot reload during development with `opti-dev`
- **Type-safe** - Full TypeScript definitions for your content types
- **Zero config** - Reads from your existing `optimizely.config.mjs`
- **CLI tools** - Simple commands for generation and development

## Installation

Install as a development dependency. `typescript` (version 5 or later) is a peer dependency, used to read your source files:

```bash
npm install -D @optimizely/cms-typegen typescript
```

Or using other package managers:

```bash
# pnpm
pnpm add -D @optimizely/cms-typegen

# yarn
yarn add -D @optimizely/cms-typegen
```

## Quick Start

### 1. Configure your project

Create an `optimizely.config.mjs` file in your project root:

```js
export default {
  components: 'src/components/**/*.tsx',
};
```

Or specify multiple patterns:

```js
export default {
  components: [
    'src/components/**/*.tsx',
    'src/blocks/**/*.tsx',
  ],
};
```

### 2. Define your content types

Create components with content type definitions:

```tsx
// src/components/Hero.tsx
import { contentType, displayTemplate, ContentProps } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero Block',
  baseType: '_component',
  properties: {
    title: {
      displayName: 'Title',
      type: 'string',
    },
    subtitle: {
      displayName: 'Subtitle',
      type: 'string',
    },
  },
});


export const HeroDisplayTemplate = displayTemplate({
  key: 'HeroDisplayTemplate',
  isDefault: false,
  displayName: 'HeroDisplayTemplate',
  baseType: '_component',
  settings: {
    orientation: {
      editor: 'select',
      displayName: 'Hero Orientation',
      sortOrder: 0,
      choices: {
        vertical: {
          displayName: 'Vertical',
          sortOrder: 1,
        },
        horizontal: {
          displayName: 'Horizontal',
          sortOrder: 2,
        },
      },
    },
  },
});

export default function Hero({ content }: { content: ContentProps<typeof HeroContentType> }) {
  return <h1>{content.title}</h1>;
}
```

The default export is registered as the component for `Hero`. See [Component matching](#component-matching) for other layouts.

### 3. Generate registry

Run the generator:

```bash
# Generate registry.ts and global.d.ts
pnpm exec opti-typegen

# Or using npx
npx opti-typegen
```

This creates:

- `src/registry.ts` - Component registry for SDK initialization (`app/registry.ts` if there is no `src/`, else the project root)
- `global.d.ts` - TypeScript type definitions, in the project root

Commit both files. They are generated, so don't edit them.

## CLI Commands

### `opti-typegen`

Generate registry and types from your components:

```bash
# Generate once
opti-typegen

# Watch mode - regenerate on file changes
opti-typegen --watch

# Check only - exit 1 if the committed files are out of date (for CI)
opti-typegen --check
```

Typegen needs `optimizely.config.mjs`. Without it the command fails and writes nothing, so a committed `registry.ts` is never overwritten.

### `opti-dev`

Run your dev server with automatic type generation:

```bash
# Next.js
opti-dev next dev

# Next.js with HTTPS
opti-dev next dev --experimental-https

# Vite
opti-dev vite

# Custom command
opti-dev npm run dev
```

The `opti-dev` command:

1. Generates `registry.ts` and `global.d.ts` once, and stops if that fails, before the dev server starts
2. Watches for component file changes
3. Runs your dev server concurrently
4. Regenerates types when components change

## Generated Files

### `src/registry.ts`

Imports all content types and components, and provides initialization:

```ts
// @generated – do not edit
import { BlankExperienceContentType, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import HeroComponent from './components/Hero';
import { HeroContentType, HeroDisplayTemplate } from './components/Hero';

export const contentTypes = [BlankExperienceContentType, HeroContentType];
export const displayTemplates = [HeroDisplayTemplate];

// React components by content type key
export const components = {
  'Hero': HeroComponent,
};

export function initRegistry(extraComponents = {}) {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
  initReactComponentRegistry({ resolver: { ...components, ...extraComponents } });
}
```

`initRegistry` takes an optional map for components typegen can't find, or to override generated ones:

```tsx
initRegistry({ BlankSection });
```

If no component is found, `components` is omitted and `initRegistry()` registers content types and display templates only.

#### How each part is generated

Typegen reads every file matched by `components` without running it, then builds each part of `registry.ts` and `global.d.ts` from what it finds.

1. **`contentTypes`.** An exported variable assigned `contentType({...})` or `contract({...})` is added, whatever its name. If the value is not one of those calls, a name ending in `ContentType` or `Contract` is used instead. The `key` and `baseType` are read from the object when they are string literals.
2. **`displayTemplates`.** An exported variable assigned `displayTemplate({...})`, or named `...DisplayTemplate`, is added. Its `contentType` and `tag` are kept to match components.
3. **`components`.** The default export of each file is matched to a content type by the rules in [Component matching](#component-matching). The result is one entry per slot, `'Key'` or `'Key:tag'`.
4. **`global.d.ts`.** Every key found in step 1 goes into `ContentTypeRegistry`. Keys with a `baseType` of `_page`, `_experience` or `_folder` also go into `MayContainRegistry`. `propertyGroups` keys from `optimizely.config.mjs` go into `PropertyGroupRegistry`.

`initRegistry()` then passes these lists to the SDK. At render time the SDK reads the content type key of a block, finds the component in `components`, and uses a tag if one applies, as described under [Tags](#tags).

#### Component matching

A component is the default export of a file matched by `components`. Typegen reads the files without running them, and picks the content type in this order.

**1. Same file as the content type**

```tsx
export const HeroContentType = contentType({ key: 'Hero', ... });
export default function Hero() { ... }
// 'Hero': HeroComponent
```

**2. A tagged display template the component imports**

The template's `contentType` and `tag` give the slot. A tagged component registers as `'Key:tag'`:

```tsx
// Hero.tsx
export const HeroCompactDisplayTemplate = displayTemplate({ key: 'HeroCompact', contentType: 'Hero', tag: 'compact', ... });

// HeroCompact.tsx
import { HeroCompactDisplayTemplate } from './Hero';
export default function HeroCompact() { ... }
// 'Hero:compact': Hero_compactComponent
```

**3. The one content type the component imports**

```tsx
// HeroView.tsx
import { HeroContentType } from './Hero';
export default function HeroView({ content }: { content: ContentProps<typeof HeroContentType> }) { ... }
// 'Hero': HeroComponent
```

**4. The file name**

A file named `Hero.tsx` matches a content type with key `Hero`, or one exported as `Hero` or `HeroContentType`.

#### Tags

Add `export const tag` to a component to fill `'Key:tag'`, or `export const tags` in the content type file to attach variants to the default component:

```tsx
export const tags = { teaser: StandardTeaser };
export default Standard;
// 'Standard': { default: StandardComponent, tags: StandardComponentTags }
```

How a tag reaches the right component:

1. An editor picks a display template for a block in the CMS.
2. The SDK finds that template in `displayTemplates` by its key and reads its `tag`. If the template is not in `displayTemplates`, there is no tag and the default component renders.
3. The SDK looks for `components['Key:tag']`, then `components['Key'].tags[tag]`, then the default component.

An unknown tag falls back to the default component without an error. A tag can also be passed with the `tag` prop on `OptimizelyComponent`, which overrides the template's tag.

A display template that has no `contentType`, such as one scoped by `baseType` or `nodeType`, cannot be matched to a component by rule 2. Use `export const tag` in the component file for those.

#### Conflicts

If two components claim the same slot, the first file (sorted by path) wins and a warning names the one ignored. A component defined next to its content type always beats an inferred one. Content types with no component are listed in a warning.

Only string literals are read, so `key: MY_KEY` isn't picked up. Anything typegen can't match goes through `initRegistry({ ... })`.

### `global.d.ts`

Type-safe content type keys:

```ts
// @generated – do not edit

declare module '@optimizely/cms-sdk' {
  export interface ContentTypeRegistry {
    'Hero': string;
    'Button': string;
  }

  export interface PropertyGroupRegistry {
  }

  export interface MayContainRegistry {
    'Start': string;
  }
}

// Only when `config({ platform })` is set in your app
declare global {
  interface OptimizelyCmsRegister {
    platform: 'saas';
  }
}

export {};
```

`MayContainRegistry` holds the keys of content types whose `baseType` is
`_page`, `_experience`, or `_folder`. These are the values accepted by a
content type's `mayContainTypes`.

## Usage in Your App

### Next.js App Router

```tsx
// app/layout.tsx
import { initRegistry } from '../registry';

export default function RootLayout({ children }) {
  initRegistry();
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### React/Vite

```tsx
// src/main.tsx
import { initRegistry } from './registry';

initRegistry();

// Your app code...
```

## Configuration

### `optimizely.config.mjs`

```js
export default {
  // Component file patterns (required)
  components: 'src/components/**/*.tsx',
  
  // Or multiple patterns
  components: [
    'src/components/**/*.tsx',
    'src/blocks/**/*.tsx',
  ],
  
  // Property groups (optional)
  propertyGroups: [
    {
      key: 'seo',
      displayName: 'SEO Settings',
    },
  ],
};
```

## Package Scripts (For Nextjs)

Add to your `package.json`:

```json
{
  "scripts": {
    "dev": "opti-dev next dev --experimental-https",
    "build": "opti-typegen && next build",
    "typegen": "opti-typegen",
    "typegen:watch": "opti-typegen --watch",
    "typecheck": "opti-typegen && tsc --noEmit"
  }
}
```

## Best Practices

- **Run before build** - Always generate types before building: `opti-typegen && next build`
- **Use opti-dev** - Prefer `opti-dev` over `opti-typegen --watch` for development
- **Don't edit generated files** - `registry.ts` and `global.d.ts` are auto-generated
- **Commit generated files** - `registry.ts` and `global.d.ts` belong in git, so a fresh clone builds without running typegen first. CI can run `opti-typegen --check` to catch a stale registry

## Integration

This package works seamlessly with:

- **[@optimizely/cms-sdk](https://www.npmjs.com/package/@optimizely/cms-sdk)** - Content fetching and rendering
- **[@optimizely/cms-cli](https://www.npmjs.com/package/@optimizely/cms-cli)** - Sync content types to CMS

For complete setup instructions, see the [main repository README](https://github.com/episerver/content-js-sdk).

## Support

- **Community Slack** - Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **GitHub Issues** - Report bugs or request features on [GitHub](https://github.com/episerver/content-js-sdk/issues)

## License

Apache License 2.0

---

**Built by the Optimizely CMS Team** | [Documentation](../../docs/) | [GitHub](https://github.com/episerver/content-js-sdk)
