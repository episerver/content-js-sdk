# @optimizely/cms-sdk

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-sdk)](https://www.npmjs.com/package/@optimizely/cms-sdk)

The official JavaScript/TypeScript SDK for building headless applications with Optimizely CMS. This comprehensive library provides everything you need to fetch, render, and manage content from Optimizely CMS with full type safety and intelligent code completion.

## Features

- **Type-safe content modeling** - Full TypeScript definitions for your content types
- **Framework integration** - First-class support for React and Next.js
- **Live preview** - Real-time content editing experience
- **Rich text rendering** - Advanced rich text component with extensibility
- **DAM integration** - Seamless digital asset management

## Installation

```bash
npm install @optimizely/cms-sdk
```

Or using other package managers:

```bash
# pnpm
pnpm add @optimizely/cms-sdk

# yarn
yarn add @optimizely/cms-sdk
```

## Quick Start

```typescript
// Initialize the client
const client = new GraphClient('<YOUR_APP_SINGLE_KEY>', {
  graphUrl: 'https://your-cms-instance.com',
});

// Fetch content
const c = await client.getContentByPath(`/<SOME_URL>`);
```

## Documentation

For comprehensive guides and documentation, visit the main repository:

### Getting Started

- [Installation](../../docs/1-installation.md) - Set up your development environment
- [Setup](../../docs/2-setup.md) - Configure the SDK and CLI
- [Modelling](../../docs/3-modelling.md) - Define your content types with TypeScript

### Core Features

- [Fetching Content](../../docs/5-fetching.md) - Query and retrieve content in your app
- [Rendering (React)](../../docs/6-rendering-react.md) - Display content in React components
- [Live Preview](../../docs/7-live-preview.md) - Enable real-time content editing

### Advanced Features

- [Experience](../../docs/8-experience.md) - Work with experiences and variations
- [Display Settings](../../docs/9-display-settings.md) - Configure content display options
- [RichText Component (React)](../../docs/10-richtext-component-react.md) - Render rich text content
- [DAM Assets](../../docs/11-dam-assets.md) - Manage digital assets
- [Client Utils](../../docs/12-client-utils.md) - Utility functions and helpers

## Best Practices

This SDK works best when used with the [@optimizely/cms-cli](https://www.npmjs.com/package/@optimizely/cms-cli) package, which enables code-first content modeling by syncing your TypeScript definitions to Optimizely CMS.

```bash
npm install -D @optimizely/cms-cli
```

For complete setup instructions, see the [main repository README](https://github.com/episerver/content-js-sdk).

## Support

- **Community Slack** - Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **GitHub Issues** - Report bugs or request features on [GitHub](https://github.com/episerver/content-js-sdk/issues)

## License

Apache License 2.0

---

**Built by the Optimizely CMS Team** | [Documentation](../../docs/) | [GitHub](https://github.com/episerver/content-js-sdk)
