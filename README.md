<div align="center">

# Optimizely CMS JavaScript Tools

### The official JavaScript SDK for building headless applications with Optimizely CMS

[![Status](https://img.shields.io/badge/status-stable-green.svg)]()
[![npm version - SDK](https://img.shields.io/npm/v/@optimizely/cms-sdk)](https://www.npmjs.com/package/@optimizely/cms-sdk)
[![npm version - CLI](https://img.shields.io/npm/v/@optimizely/cms-cli)](https://www.npmjs.com/package/@optimizely/cms-cli)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Support](#support)

</div>

---

## Overview

The official JavaScript SDK and CLI from Optimizely CMS. Build headless applications with a code-first approach, full TypeScript support, intelligent code completion, and an intuitive developer experience.

## What's Included

### 🚀 SDK - Content Delivery & Management

A comprehensive JavaScript/TypeScript library for fetching, rendering, and managing content from Optimizely CMS in your applications.

**Key Capabilities:**

- Type-safe content modeling with full TypeScript definitions
- First-class React and Next.js integration
- Real-time live preview and editing
- Advanced rich text rendering with extensibility
- Seamless digital asset management (DAM)

### ⚙️ CLI - Type Definition Sync

A command-line tool that syncs your TypeScript content type definitions to Optimizely CMS, enabling code-first content modeling.

**Key Capabilities:**

- Push TypeScript definitions to Optimizely CMS
- Simple, intuitive command-line interface
- Streamlined developer workflow

> **Framework Support:** While the SDK is designed to be framework-agnostic, this version currently includes first-class support for React and Next.js. Support for additional frameworks is coming soon.

## Prerequisites

Before you begin, ensure you have the following:

| Requirement         | Version       | Notes                           |
| ------------------- | ------------- | ------------------------------- |
| **Node.js**         | 22+           | [Download](https://nodejs.org/) |
| **Git**             | Latest        | Version control                 |
| **Package Manager** | npm/pnpm/yarn | npm comes with Node.js          |
| **Optimizely CMS**  | Latest        | Access to a CMS instance        |

## Quick Start

Get up and running in minutes:

```bash
# Install the SDK
npm install @optimizely/cms-sdk

# Install the CLI (for type syncing)
npm install -D @optimizely/cms-cli
```

For a complete walkthrough from scratch, see the [Documentation](#documentation) section below.

## Documentation

Comprehensive step-by-step guides to build your headless application:

| Step | Guide                                                               | Description                               |
| ---- | ------------------------------------------------------------------- | ----------------------------------------- |
| 1    | [Installation](./docs/1-installation.md)                            | Set up your development environment       |
| 2    | [Setup](./docs/2-setup.md)                                          | Configure the SDK and CLI                 |
| 3    | [Modelling](./docs/3-modelling.md)                                  | Define your content types with TypeScript |
| 4    | [Create Content](./docs/4-create-content.md)                        | Add content in Optimizely CMS             |
| 5    | [Fetching Content](./docs/5-fetching.md)                            | Query and retrieve content in your app    |
| 6    | [Rendering (React)](./docs/6-rendering-react.md)                    | Display content in React components       |
| 7    | [Live Preview](./docs/7-live-preview.md)                            | Enable real-time content editing          |
| 8    | [Experience](./docs/8-experience.md)                                | Work with experiences and variations      |
| 9    | [Display Settings](./docs/9-display-settings.md)                    | Configure content display options         |
| 10   | [RichText Component (React)](./docs/10-richtext-component-react.md) | Render rich text content                  |
| 11   | [DAM Assets](./docs/11-dam-assets.md)                               | Manage digital assets                     |
| 12   | [Client Utils](./docs/12-client-utils.md)                           | Utility functions and helpers             |

## Community & Support

We're here to help you succeed with Optimizely CMS:

### 💬 Get Help

- **Community Slack** - Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J) for real-time discussions
- **GitHub Issues** - Report bugs or request features on [GitHub](https://github.com/episerver/content-js-sdk/issues)
- **Documentation** - Browse our [documentation and guides](https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/install-javascript-sdk).

### Contributing

The easiest way to contribute is to join in with the discussions on GitHub issues or create new issues with questions, suggestions or any other feedback. If you want to contribute code or documentation, you are more than welcome to create pull-requests, but make sure that you read the [contribution](./CONTRIBUTING.md) page first.

### 📝 License

This project is licensed under the Apache License 2.0.

---

<div align="center">

**Built by the Optimizely CMS Team**

[Website](https://www.optimizely.com/) • [Documentation](https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/install-javascript-sdk) • [GitHub](https://github.com/episerver/content-js-sdk)

</div>
