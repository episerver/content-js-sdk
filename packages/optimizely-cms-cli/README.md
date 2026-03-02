# @optimizely/cms-cli

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-cli)](https://www.npmjs.com/package/@optimizely/cms-cli)

The official command-line tool for Optimizely CMS that enables code-first content modeling. Sync your TypeScript content type definitions to Optimizely CMS, allowing you to manage content models alongside your code with full version control.

## Features

- **ContentTypes-to-CMS sync** - Push your TypeScript definitions to Optimizely CMS
- **Code-first workflow** - Define content types in your preferred IDE with IntelliSense
- **Version control** - Manage content types alongside your application code
- **Simple CLI commands** - Intuitive interface for common tasks
- **Seamless integration** - Works perfectly with [@optimizely/cms-sdk](https://www.npmjs.com/package/@optimizely/cms-sdk)

## Installation

Install as a development dependency:

```bash
npm install -D @optimizely/cms-cli
```

Or using other package managers:

```bash
# pnpm
pnpm add -D @optimizely/cms-cli

# yarn
yarn add -D @optimizely/cms-cli

```

> **Tip:** You can also use `npx @optimizely/cms-cli` to run commands without installing the package.

## Quick Start

### 1. Configure your environment

Create a `.env` file in your project root with your CMS credentials:

```env
OPTIMIZELY_CMS_URL=https://your-cms-instance.com
OPTIMIZELY_CMS_CLIENT_ID=your-client-id
OPTIMIZELY_CMS_CLIENT_SECRET=your-client-secret
```

### 2. Define your content types

Create TypeScript definitions for your content models:

```typescript
import { contentType } from '@optimizely/cms-sdk';

export const ArticlePage = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    title: {
      displayName: 'Title',
      type: 'string',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    body: {
      displayName: 'body ',
      type: 'richText',
    },
  },
});
```

### 3. Sync to CMS

Run the CLI to push your definitions to Optimizely CMS:

```bash
# If installed as a dependency
pnpm exec optimizely-cms-cli config push ./optimizely.config.mjs

# Or using npx without installation
npx @optimizely/cms-cli config push ./optimizely.config.mjs
```

## Commands

All commands can be run using either the installed CLI or via `npx @optimizely/cms-cli`.

### Configuration Management

Sync your TypeScript content type definitions with Optimizely CMS:

```bash
# Push content types to CMS (reads ./optimizely.config.mjs from project root by default)
optimizely-cms-cli config push
# or: npx @optimizely/cms-cli config push

# Push with custom config file path
optimizely-cms-cli config push ./path/to/custom-config.mjs

# Force update (may result in data loss)
optimizely-cms-cli config push --force

# Pull content types from CMS and generate TypeScript files (prompts for options)
optimizely-cms-cli config pull

# With output directory specified
optimizely-cms-cli config pull --output ./src/content-types

# Group generated files by content type base type (page/, component/, section/, etc.)
optimizely-cms-cli config pull --output ./src/types --group

# Save raw JSON manifest without generating TypeScript files (using output redirection)
optimizely-cms-cli config pull > manifest.json

# Pipe output to other commands for processing (Unix-style)
optimizely-cms-cli config pull | grep contentType
optimizely-cms-cli config pull | head -n 50
```

> **Note:** The `config pull` command automatically detects when its output is piped or redirected and outputs raw JSON instead of running interactive prompts. This allows you to use Unix-style pipes (`|`) and redirections (`>`) to process or save the manifest data.

> **Note:** When using `--group`:
>
> - Display templates are co-located with their content types in the same file
> - Orphaned display templates (without a matching content type) are placed in the `displayTemplates/` directory
>
> See [File Organization](#file-organization) below for detailed examples.

### Authentication

Verify your CMS credentials are correctly configured:

```bash
# Test your credentials from environment variables
optimizely-cms-cli login

# Show detailed authentication output
optimizely-cms-cli login --verbose
```

### Content Type Operations

Manage individual content types:

```bash
# Delete a specific content type
optimizely-cms-cli content delete ArticlePage

# Delete with custom host
optimizely-cms-cli content delete ProductPage --host https://example.com
```

### Dangerous Operations

⚠️ **Use with extreme caution - these commands are destructive:**

```bash
# Delete ALL user-defined content types (interactive confirmation required)
optimizely-cms-cli danger delete-all-content-types
```

### Get Help

```bash
# Show all available commands
optimizely-cms-cli --help

# Show help for a specific command
optimizely-cms-cli config push --help

# Show help for a topic
optimizely-cms-cli config --help
```

## File Organization

### Pull Command Output Structure

When pulling content types from CMS, the CLI generates TypeScript files with different organization strategies:

#### Without `--group` flag (default)

```
src/content-types/
├── ArticlePage.ts
├── ProductPage.ts
├── HeroComponent.ts
└── display-templates/
    ├── ArticleDisplayTemplate.ts
    └── HeroDisplayTemplate.ts
```

#### With `--group` flag

Organizes files by content type base type (`_page`, `_component`, `_section`, etc.) and **co-locates display templates with their content types**:

```
src/types/
├── page/
│   ├── ArticlePage.ts      # Contains ArticlePageCT + ArticleDisplayTemplateDT
│   └── ProductPage.ts       # Contains ProductPageCT + ProductDisplayTemplateDT
├── component/
│   ├── HeroComponent.ts     # Contains HeroComponentCT + HeroDisplayTemplateDT
│   └── Teaser.ts            # Contains TeaserCT + TeaserDisplayTemplateDT
├── section/
│   └── ContentSection.ts    # Contains ContentSectionCT + ContentSectionDisplayTemplateDT
└── displayTemplates/        # Only created if orphaned templates exist
    └── LegacyTemplate.ts    # Display templates with no matching content type
```

**Example co-located file** ([page/ArticlePage.ts]()):

```typescript
import { contentType, displayTemplate } from '@optimizely/cms-sdk';

/**
 * Article Page
 */
export const ArticlePageCT = contentType({
  key: 'ArticlePage',
  baseType: '_page',
  properties: {
    /* ... */
  },
});

/**
 * Article Display Template
 */
export const ArticleDisplayTemplateDT = displayTemplate({
  key: 'ArticleDisplayTemplate',
  contentType: 'ArticlePage',
  isDefault: true,
});
```

**Benefits of grouping:**

- Better organization by content type category
- Related display templates are co-located with their content types
- Fewer files to manage
- Clear visibility of orphaned templates that may need attention

## Documentation

For comprehensive guides and best practices:

### Getting Started

- [Installation](../../docs/1-installation.md) - Set up your development environment
- [Setup](../../docs/2-setup.md) - Configure the SDK and CLI
- [Modelling](../../docs/3-modelling.md) - Define your content types with TypeScript

### Workflow Guides

- [Create Content](../../docs/4-create-content.md) - Add content in Optimizely CMS after syncing types
- [Fetching Content](../../docs/5-fetching.md) - Use the SDK to retrieve typed content

## Best Practices

This CLI tool works best when used alongside the [@optimizely/cms-sdk](https://www.npmjs.com/package/@optimizely/cms-sdk) for a complete type-safe development experience:

```bash
# Install both packages
npm install @optimizely/cms-sdk
npm install -D @optimizely/cms-cli
```

The typical workflow:

1. Define content types in TypeScript
2. Use the CLI to sync definitions to CMS
3. Create content in Optimizely CMS
4. Fetch and render content with the SDK

For complete setup instructions, see the [main repository README](https://github.com/episerver/content-js-sdk).

## Support

- **Community Slack** - Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **GitHub Issues** - Report bugs or request features on [GitHub](https://github.com/episerver/content-js-sdk/issues)

## License

Apache License 2.0

---

**Built by the Optimizely CMS Team** | [Documentation](../../docs/) | [GitHub](https://github.com/episerver/content-js-sdk)
