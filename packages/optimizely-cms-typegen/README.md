# @optimizely/cms-typegen

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-typegen)](https://www.npmjs.com/package/@optimizely/cms-typegen)

The official type generator and CLI tool for Optimizely CMS. Automatically generates component registry and TypeScript type definitions from your content type definitions, enabling full type safety and hot reload during development.

> **Note:** This package is designed for Vite and Next.js projects using [`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk).

## Features

- **Auto-generates registry** - Creates `registry.ts` and `global.d.ts` from your components
- **Watch mode** - Hot reload during development with `opti-dev`
- **Type-safe** - Full TypeScript definitions for your content types
- **Zero config** - Reads from your existing `optimizely.config.mjs`
- **CLI tools** - Simple commands for generation and development

## Installation

Install as a development dependency:

```bash
npm install -D @optimizely/cms-typegen
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
import { contentType, displayTemplate } from '@optimizely/cms-sdk';

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
```

### 3. Generate registry

Run the generator:

```bash
# Generate registry.ts and global.d.ts
pnpm exec opti-typegen

# Or using npx
npx opti-typegen
```

This creates:

- `.optimizely/registry.ts` - Component registry for SDK initialization
- `.optimizely/global.d.ts` - TypeScript type definitions

## CLI Commands

### `opti-typegen`

Generate registry and types from your components:

```bash
# Generate once
opti-typegen

# Watch mode - regenerate on file changes
opti-typegen --watch
```

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

1. Generates `registry.ts` and `global.d.ts`
2. Watches for component file changes
3. Runs your dev server concurrently
4. Regenerates types when components change

## Generated Files

### `.optimizely/registry.ts`

Imports all content types and provides initialization:

```ts
// @generated – do not edit

import { BlankExperienceContentType, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import { HeroContentType, HeroDisplayTemplate } from './components/Hero';
import { ButtonContentType } from './components/Button';

// Content types to register
export const contentTypes = [
  BlankExperienceContentType,
  HeroContentType,
  ButtonContentType,
]

// Display templates to register
export const displayTemplates = [
  HeroDisplayTemplate
];

// Initialize registries
export function initRegistry() {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
}
```

#### Component matching

A component is the default export of a file matched by `components`. Its content type is the first of:

1. The content type defined in the same file.
2. A display template it imports that declares both `tag` and `contentType`. It registers as `'Key:tag'`.
3. The one content type it imports.
4. A content type whose key or name (without `ContentType`) equals the file name.

`export const tag = '...'` makes a same-file component fill `'Key:tag'`. If two components claim the same slot, the first file
(sorted by path) wins and a warning names the one ignored. Typegen parses files with `typescript` (a peer dependency) and reads
string literals only.

### `.optimizely/global.d.ts`

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

export {};
```

`MayContainRegistry` holds the keys of content types whose `baseType` is
`_page`, `_experience`, or `_folder`. These are the values accepted by a
content type's `mayContainTypes`.

## Usage in Your App

### Next.js App Router

```tsx
// app/layout.tsx
import { initRegistry } from '../.optimizely/registry';

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
import { initRegistry } from '../.optimizely/registry';

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
    "typegen:watch": "opti-typegen --watch"
  }
}
```

## Best Practices

- **Run before build** - Always generate types before building: `opti-typegen && next build`
- **Use opti-dev** - Prefer `opti-dev` over `opti-typegen --watch` for development
- **Don't edit generated files** - `registry.ts` and `global.d.ts` are auto-generated
- **Do not commit generated files** - Add `.optimizely/` to `.gitignore`. Import `.optimizely/registry` somewhere in your app (for example `initRegistry` in the root layout) so TypeScript also loads `global.d.ts`

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
