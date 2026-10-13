# @optimizely/cms-sdk

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-sdk)](https://www.npmjs.com/package/@optimizely/cms-sdk)

The official JavaScript/TypeScript SDK for building headless applications with Optimizely CMS. This library provides everything you need to fetch, render, and manage content from Optimizely CMS with full type safety and intelligent code completion.

## Features

- **Type-safe content modeling** - Full TypeScript definitions for your content types
- **Framework integration** - First-class support for React and Next.js
- **Live preview** - Real-time content editing experience
- **Rich text rendering** - Advanced rich text component with extensibility
- **DAM integration** - Seamless digital asset management
- **Optimizely Forms** - Render forms, validation, multi-step flows and dependency rules
- **Runtime validation** - Validate Graph responses against your content types
- **Observability** - OpenTelemetry traces and metrics out of the box

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
import { GraphClient } from '@optimizely/cms-sdk';

// Initialize the client. `graphUrl` is the Optimizely Graph gateway, not your CMS
// instance, and defaults to https://cg.optimizely.com/content/v2 when omitted.
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

// Fetch content. `getContentByPath` returns every item published at that path.
const [content] = await client.getContentByPath('/<SOME_URL>/');
```

## Documentation

Full guides and documentation in the main repository:

### Getting Started

- [Quick start](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/quick-start.md) - Scaffold a working site from a template
- [Tutorial](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/installation.md) - Build a site step by step, from installation to live preview
- [Your first content type](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/first-content-type.md) - Define content types in TypeScript
- [Fetch content](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/fetch-content.md) - Configure the client and fetch content from Graph
- [Render with React](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/render-with-react.md) - Render content with your own components
- [Live preview](https://github.com/episerver/content-js-sdk/blob/main/docs/learn/live-preview.md) - Let editors preview changes as they type

### Schema Validation

Validate content data (e.g. GraphQL responses) against your content type definitions at runtime using `toSchema()`.

```typescript
import { toSchema, SchemaValidationError } from '@optimizely/cms-sdk/schema';
import { BlogPageCT } from './content-types/BlogPageCT';

const schema = toSchema(BlogPageCT);
```

#### `safeParse()` — validate without throwing

Returns `{ success: true, data }` or `{ success: false, errors }`. Use when you want to handle errors yourself.

```typescript
const result = schema.safeParse(graphqlResponse);

if (result.success) {
  // result.data is fully typed based on the content type definition
  console.log(result.data.title);
  console.log(result.data.p_heroImage);
} else {
  // result.errors is an array of ValidationError
  result.errors.forEach(err => {
    console.error(`[${err.path.join('.')}] ${err.message}`);
  });
}
```

#### `parse()` — validate or throw

Returns the validated data, or throws `SchemaValidationError` on failure. Use when invalid data should stop execution.

```typescript
try {
  const page = schema.parse(graphqlResponse);
  console.log(page.title);
} catch (err) {
  if (err instanceof SchemaValidationError) {
    console.error(`${err.errors.length} validation error(s)`);
    err.errors.forEach(e => console.error(e.message));
  }
}
```

#### Strict mode

By default, extra properties not defined in the content type are allowed (passthrough). Use `{ strict: true }` to reject them.

```typescript
const strictSchema = toSchema(BlogPageCT, { strict: true });

const result = strictSchema.safeParse({
  ...validData,
  unknownField: 'value', // will cause validation to fail
});
```

#### What gets validated

| Check | Example |
|---|---|
| **Required base fields** | `_id`, `__typename`, `_metadata` must be present at root |
| **Type correctness** | `p_integer` must be `number`, not `string` |
| **Constraints** | `minimum`/`maximum`, `minLength`/`maxLength`, `pattern` |
| **Enum values** | Value must be one of the allowed enum values |
| **Array bounds** | `minItems`/`maxItems` |
| **Nested structures** | richText, contentReference, component, array validated recursively |

Top-level content properties (`p_string`, `p_xhtml`, etc.) are optional — `null` or `undefined` values are skipped. Sub-fields within complex types (e.g. `html`/`json` in richText, `key` in contentReference) are also optional and only validated when present and non-null.

### Guides

- [Content types](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/content-types.md) - Properties, validation, references and containers
- [Experiences](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/experiences.md) - Pages composed in Visual Builder
- [Display templates](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/display-templates.md) - Let editors pick a style for a component
- [Rich text](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/rich-text.md) - Render and customise formatted text
- [DAM assets](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/dam-assets.md) - Responsive images, video and files
- [Navigation](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/navigation.md) - Breadcrumbs and menus with `getPath` and `getItems`
- [Forms](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/forms.md) - Render Optimizely Forms
- [Authentication](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/authentication.md) - Fetch restricted content and drafts
- [Observability](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/observability.md) - OpenTelemetry traces and metrics

### Reference

- [`config()` and `getClient()`](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/config.md) - Every client option
- [`GraphClient` methods](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/graph-client.md) - Every fetching method
- [React components](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/react-components.md) - Every React export
- [CLI commands](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/cli.md) - Every command, flag and env var
- [Migrating to 3.0](https://github.com/episerver/content-js-sdk/blob/main/docs/reference/migration-v3.md) - Breaking changes and how to update
- [Agent skills](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/agent-skills.md) - AI-powered development

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

**Built by the Optimizely CMS Team** | [Documentation](https://github.com/episerver/content-js-sdk/tree/main/docs) | [GitHub](https://github.com/episerver/content-js-sdk)
