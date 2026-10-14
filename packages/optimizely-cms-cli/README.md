# @optimizely/cms-cli

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-cli)](https://www.npmjs.com/package/@optimizely/cms-cli)

The official command-line tool for Optimizely CMS that enables code-first content modeling. Sync your TypeScript content type definitions to Optimizely CMS, allowing you to manage content models alongside your code with full version control.

## Features

- **ContentTypes-to-CMS sync** - Push your TypeScript definitions to Optimizely CMS
- **Code-first workflow** - Define content types in your preferred IDE with IntelliSense
- **Version control** - Manage content types alongside your application code
- **Simple CLI commands** - Intuitive interface for common tasks
- **One-command deploys** - Package and deploy Next.js or Astro sites to Optimizely front-end hosting
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
OPTIMIZELY_CMS_CLIENT_ID=your-client-id
OPTIMIZELY_CMS_CLIENT_SECRET=your-client-secret

# Optional. Defaults to https://api.cms.optimizely.com
OPTIMIZELY_CMS_API_URL=https://api.cms.optimizely.com
```

> **Note:** `OPTIMIZELY_CMS_URL` is **not** read by the CLI. It is an application-level
> variable your app uses at runtime. To point the CLI at a different instance, set
> `OPTIMIZELY_CMS_API_URL` or pass `--host`.

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

| Command | Description |
| --- | --- |
| `login` | Check that your credentials are correct |
| `config push` | Push your content types, contracts and display templates to the CMS |
| `config pull` | Generate TypeScript files from the content types in the CMS |
| `config delete` | Delete the content types defined in your project from the CMS |
| `content delete <key>` | Delete one content type from the CMS |
| `danger delete-all-content-types` | Delete every user-defined content type in the CMS |
| `deploy` | Package the project and deploy it to Optimizely front-end hosting |

Run `optimizely-cms-cli <command> --help` for the flags of a command, or see the [CLI reference](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/cli.md) for every command, flag and environment variable.

## Documentation

Guides and best practices:

### Getting Started

- [Installation](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/installation.md) - Set up a project with the SDK and CLI
- [Connect to the CMS](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/connect-to-cms.md) - Create an API key and check the connection
- [Your first content type](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/first-content-type.md) - Define a content type and push it

### Reference

- [CLI commands](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/cli.md) - Every command, flag and env var
- [`optimizely.config.mjs`](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/optimizely-config.md) - Every configuration option
- [Deploy to front-end hosting](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/deploy-to-frontend-hosting.md) - Credentials, project requirements and CI
- [Quick start](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/quick-start.md) - Scaffold a new or existing project with `create-app`
- [Agent skills](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/agent-skills.md) - AI-powered development

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

**Built by the Optimizely CMS Team** | [Documentation](https://github.com/episerver/content-js-sdk/tree/main/docs) | [GitHub](https://github.com/episerver/content-js-sdk)
