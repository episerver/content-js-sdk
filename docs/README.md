# Optimizely CMS JavaScript SDK

The SDK lets you build a site on Optimizely CMS (SaaS) with TypeScript and React. You
define your content types in code, push them to the CMS, and render the content editors
create with your own components, including a live preview while they edit.

## How it fits together

```text
        your code                            Optimizely
┌────────────────────────┐   config push   ┌─────────────┐
│ content types          │ ──────────────▶ │     CMS     │  editors write
│ React components       │                 └──────┬──────┘  and publish
└────────────────────────┘                        │
            ▲                                     ▼
            │       getClient()            ┌─────────────┐
            └───────────────────────────── │    Graph    │
                                           └─────────────┘
```

1. **Content types** describe your content. You write them in TypeScript, and the **CLI**
   pushes them to the CMS.
2. Editors create and publish content in the **CMS**. It is published to **Optimizely
   Graph**.
3. Your app fetches content from Graph with the **SDK**, and renders each piece with the
   component registered for its content type.

## Get started

Choose one:

- **[Quick start](./learn/quick-start.md):** scaffold a working site from a template in a
  few minutes.
- **[Tutorial](./learn/installation.md):** build a site step by step and learn how each
  piece works.

## Learn

A step-by-step tutorial. Each page builds on the one before.

| Step | Page                                                     | You will                                     |
| ---- | -------------------------------------------------------- | -------------------------------------------- |
| 1    | [Installation](./learn/installation.md)                  | Create a Next.js project and install the SDK |
| 2    | [Connect to the CMS](./learn/connect-to-cms.md)          | Give the CLI access to your CMS              |
| 3    | [Your first content type](./learn/first-content-type.md) | Define an `Article` and push it to the CMS   |
| 4    | [Create content](./learn/create-content.md)              | Write and publish your first article         |
| 5    | [Fetch content](./learn/fetch-content.md)                | Load the article from Graph                  |
| 6    | [Render with React](./learn/render-with-react.md)        | Turn the article into a page                 |
| 7    | [Live preview](./learn/live-preview.md)                  | Let editors see their changes as they type   |

## Guides

Standalone pages, one topic each. Read them in any order.

### Modelling content

- [Content types](./guides/content-types.md): properties, validation, references and
  containers
- [Contracts](./guides/contracts.md): share sets of properties between content types
- [Display templates](./guides/display-templates.md): let editors pick a style for a
  component

### Building pages

- [Experiences](./guides/experiences.md): pages composed in Visual Builder
- [Rich text](./guides/rich-text.md): render and customise formatted text
- [DAM assets](./guides/dam-assets.md): responsive images, video and files
- [Forms](./guides/forms.md): render Optimizely Forms
- [Navigation](./guides/navigation.md): breadcrumbs and menus
- [Taxonomy](./guides/taxonomy.md): read and resolve categories

### Fetching content

- [Authentication](./guides/authentication.md): fetch restricted content and drafts
- [Request context](./guides/request-context.md): share per-request data with components
- [Validating external data](./guides/validating-external-data.md): check data from other
  GraphQL clients

### Beyond the basics

- [Deploy to front-end hosting](./guides/deploy-to-frontend-hosting.md): put the site live
  on Optimizely with one command or from CI
- [The framework-agnostic core](./guides/framework-agnostic-core.md): render without
  React, or build a binding
- [Observability](./guides/observability.md): OpenTelemetry traces and metrics
- [Agent skills](./guides/agent-skills.md): teach AI coding agents to use the SDK

## Reference

Exact signatures and every option.

- [`config()` and `getClient()`](./reference/config.md)
- [`GraphClient` methods](./reference/graph-client.md)
- [`optimizely.config.mjs`](./reference/optimizely-config.md)
- [Property types](./reference/property-types.md)
- [React components](./reference/react-components.md)
- [`RichText` component](./reference/rich-text-component.md)
- [CLI commands](./reference/cli.md)
- [Migrating to 3.0](./reference/migration-v3.md)
- [Troubleshooting](./reference/troubleshooting.md)

## Contributing to the docs

See [Writing the docs](./STYLE.md) for how pages are organised and written.
