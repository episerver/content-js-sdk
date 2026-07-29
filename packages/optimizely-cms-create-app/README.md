# @optimizely/cms-create-app

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-create-app)](https://www.npmjs.com/package/@optimizely/cms-create-app)

Create Optimizely CMS applications with one command. Scaffolds a fully configured project with the SDK, CLI, and all the boilerplate you need to start building.

## Features

- **Template mode** - Create a project from a pre-configured starter template
- **Fresh mode** - Run `create-next-app` or `create-start`, then add Optimizely automatically
- **Scaffold mode** - Add Optimizely CMS to an existing Next.js or TanStack Start project

## Usage

```bash
npx @optimizely/cms-create-app
```

The interactive CLI will guide you through selecting a mode, project name, template, and package manager.

### Create from template

```bash
npx @optimizely/cms-create-app my-app --template nextjs-starter --pm pnpm
```

### Create a fresh project

```bash
npx @optimizely/cms-create-app my-app
# Select "Fresh project"
# Select a framework (Next.js or TanStack Start)
```

### Scaffold an existing project

```bash
cd my-existing-project
npx @optimizely/cms-create-app
# Select "Add Optimizely CMS to this project"
```

## Templates

| Template | Description |
|----------|-------------|
| `nextjs-starter` | Minimal Next.js + Optimizely CMS |
| `nextjs-stride` | Full demo site with Tailwind |
| `nextjs-alloy` | Full demo site with Tailwind |
| `tanstack-starter` | TanStack Start + Optimizely CMS |

## CLI Options

| Option | Description |
|--------|-------------|
| `--template <name>` | Template to use (`nextjs-starter`, `nextjs-stride`, `nextjs-alloy`, `tanstack-starter`) |
| `--pm <manager>` | Package manager (`npm`, `pnpm`, `yarn`) |
| `--skip-install` | Skip dependency installation |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## SDK Initialization

When using **fresh** or **scaffold** mode, the CLI adds packages and config files to your project but does not modify your `layout.tsx`. You need to initialize the SDK yourself.

### Step 1. Create an initialization file

Create `src/lib/optimizely.ts`:

```typescript
import { config, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || '',
});

initContentTypeRegistry([
  // Add your content types here, e.g.:
  // ArticleContentType,
]);

initReactComponentRegistry({
  resolver: {
    // Map content types to React components here, e.g.:
    // Article,
  },
});

initDisplayTemplateRegistry([
  // Add display templates here if needed
]);
```

### Step 2. Import in your root layout

Add the import to `src/app/layout.tsx`:

```typescript
import '@/lib/optimizely';
```

This runs the initialization code once when the app starts. The SDK stores the configuration in memory, so all subsequent calls to `getClient()` and component rendering will use it.

### Step 3. Register components as you build

When you create a new content type and component, add them to `src/lib/optimizely.ts`:

```typescript
import Article, { ArticleContentType } from '@/components/Article';
import Hero, { HeroContentType } from '@/components/Hero';

initContentTypeRegistry([
  ArticleContentType,
  HeroContentType,
]);

initReactComponentRegistry({
  resolver: {
    Article,
    Hero,
  },
});
```

> [!NOTE]
> Template mode projects (e.g., `nextjs-starter`) already include this initialization in `layout.tsx` with all components pre-registered. This section only applies to fresh and scaffold modes.

## What scaffold adds to your project

| File | Purpose |
|------|---------|
| `@optimizely/cms-sdk` | SDK for fetching and rendering CMS content |
| `@optimizely/cms-cli` | CLI for syncing content types to CMS |
| `optimizely.config.mjs` | Configuration for the CLI |
| `.env` | Environment variables (API keys, CMS credentials) |
| `[...slug]/page.tsx` | Catch-all route for rendering CMS pages |
| `opti-push` script | Shortcut for `optimizely-cms-cli manifest push` |

## Support

- **Community Slack** - Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **GitHub Issues** - Report bugs or request features on [GitHub](https://github.com/episerver/content-js-sdk/issues)

## License

Apache License 2.0

---

**Built by the Optimizely CMS Team** | [Documentation](https://github.com/episerver/content-js-sdk/tree/main/docs) | [GitHub](https://github.com/episerver/content-js-sdk)
