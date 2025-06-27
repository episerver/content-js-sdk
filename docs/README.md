# Optimizely CMS JavaScript Tools Documentation

Welcome to the comprehensive documentation for Optimizely CMS JavaScript tools. This documentation covers two main packages that work together to provide a complete solution for building modern web applications with Optimizely CMS.

## 📦 Packages Overview

### [@episerver/cms-sdk](./cms-sdk/)

The core JavaScript SDK that provides:

- **Content Type System**: Define and manage CMS content types with TypeScript
- **GraphQL Integration**: Automatically generate queries and fetch content
- **React Components**: Server and client-side components for seamless CMS integration
- **Type Safety**: Full TypeScript support with automatic type inference

### [@episerver/cms-cli](./cms-cli/)

A powerful CLI tool for developers and DevOps teams:

- **Configuration Management**: Push/pull content types and configurations
- **Authentication**: OAuth2 integration with multiple CMS instances
- **Content Operations**: CRUD operations and bulk content management
- **CI/CD Integration**: Automate deployments and configuration sync

## 🚀 Quick Start

### Prerequisites

- Node.js (latest LTS version)
- Access to an Optimizely CMS instance
- GitHub Package Registry access (see [Installation Guide](https://github.com/episerver/content-js-sdk#installation))

### 1. Install the SDK

```bash
# Install the SDK in your project
npm install @episerver/cms-sdk

# For React projects, also install React peer dependency
npm install react@^19.0.0
```

### 2. Install the CLI (Optional)

```bash
# Install globally
npm install @episerver/cms-cli -g

# Or run without installation
npx @episerver/cms-cli
```

### 3. Basic Usage

#### Define Content Types

```typescript
import { contentType } from '@episerver/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string', required: true },
    content: { type: 'richText' },
    publishDate: { type: 'dateTime' }
  }
});
```

#### Fetch and Render Content

```typescript
import { GraphClient } from '@episerver/cms-sdk';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
const content = await client.fetchContent('/articles/my-article/');

return <OptimizelyComponent opti={content} />;
```

#### CLI Configuration Management

```bash
# Authenticate with your CMS
optimizely-cms-cli login

# Push local content types to CMS
optimizely-cms-cli config push optimizely.config.mjs

# Pull current configuration from CMS
optimizely-cms-cli config pull --output current-config.json
```

## 📚 Documentation Structure

### CMS SDK Documentation

- **[Getting Started](./cms-sdk/getting-started.md)** - Installation, setup, and first content type
- **[Content Types](./cms-sdk/content-types.md)** - Comprehensive guide to defining content types
- **[GraphQL Integration](./cms-sdk/graphql-integration.md)** - Fetching and querying content
- **[React Integration](./cms-sdk/react-integration.md)** - Server and client components
- **[Configuration](./cms-sdk/configuration.md)** - Build configuration and environment setup
- **[API Reference](./cms-sdk/api-reference.md)** - Complete API documentation
- **[Advanced Usage](./cms-sdk/advanced-usage.md)** - Performance tips and best practices

### CMS CLI Documentation

- **[Getting Started](./cms-cli/getting-started.md)** - Installation and authentication
- **[Authentication](./cms-cli/authentication.md)** - OAuth setup and credential management
- **[Commands Reference](./cms-cli/commands-reference.md)** - Complete command reference
- **[Configuration Management](./cms-cli/configuration-management.md)** - Push/pull workflows
- **[Content Management](./cms-cli/content-management.md)** - Content operations
- **[Advanced Usage](./cms-cli/advanced-usage.md)** - Scripting and automation

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  Content Types  │  GraphQL Queries    │
├─────────────────────────────────────────────────────────────┤
│                @episerver/cms-sdk                           │
├─────────────────────────────────────────────────────────────┤
│                Optimizely Content Graph                     │
└─────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────┐
│                @episerver/cms-cli                           │
├─────────────────────────────────────────────────────────────┤
│         Configuration Management & Content Operations       │
├─────────────────────────────────────────────────────────────┤
│                 Optimizely CMS API                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Use Cases

### Content-First Development

- Define content types in code with full TypeScript support
- Automatically generate GraphQL queries
- Deploy content types alongside application code

### Headless CMS Integration

- Fetch content via GraphQL with automatic type inference
- Render content with React components
- Handle preview and edit modes seamlessly

### DevOps and Automation

- Sync content types between environments
- Automate content operations
- Integrate with CI/CD pipelines

## 🔗 Related Resources

- **[GitHub Repository](https://github.com/episerver/content-js-sdk)** - Source code and issues
- **[Sample Applications](../samples/)** - Complete working examples
- **[Optimizely Documentation](https://docs.optimizely.com)** - Official CMS documentation
- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute to this project

## 💡 Need Help?

- Check the **[Troubleshooting sections](./cms-sdk/advanced-usage.md#troubleshooting)** in each package's documentation
- Review the **[sample applications](../samples/)** for working examples
- **[Open an issue](https://github.com/episerver/content-js-sdk/issues)** on GitHub for bug reports or feature requests

---

*This documentation is for developers building modern web applications with Optimizely CMS. For general CMS usage, please refer to the [official Optimizely documentation](https://[docs.optimizely.com](https://docs.developers.optimizely.com/)).*
