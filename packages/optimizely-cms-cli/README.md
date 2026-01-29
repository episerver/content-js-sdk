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
pnpm exec optimizely-cms-cli config push ./optimizely.config.mjs
```

## Common Commands

```bash
# Sync content type definitions to CMS
npx @optimizely-cms-cli config push ./optimizely.config.mjs

# Show help and available commands
npx @optimizely/cms-cli --help
```

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
