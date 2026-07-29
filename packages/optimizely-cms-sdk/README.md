# @optimizely/cms-sdk

[![npm version](https://img.shields.io/npm/v/@optimizely/cms-sdk)](https://www.npmjs.com/package/@optimizely/cms-sdk)

The official JavaScript/TypeScript SDK for building headless applications with Optimizely CMS. This library provides everything you need to fetch, render, and manage content from Optimizely CMS with full type safety and intelligent code completion.

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

Full guides and documentation in the main repository:

### Getting Started

- [Installation](https://github.com/episerver/content-js-sdk/blob/main/docs/1-installation.md) - Set up your development environment
- [Setup](https://github.com/episerver/content-js-sdk/blob/main/docs/2-setup.md) - Configure the SDK and CLI
- [Modelling](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md) - Define your content types with TypeScript

### Core Features

- [Fetching Content](https://github.com/episerver/content-js-sdk/blob/main/docs/5-fetching.md) - Query and retrieve content in your app
- [Rendering (React)](https://github.com/episerver/content-js-sdk/blob/main/docs/6-rendering-react.md) - Display content in React components
- [Live Preview](https://github.com/episerver/content-js-sdk/blob/main/docs/7-live-preview.md) - Enable real-time content editing

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

### Advanced Features

- [Experience](https://github.com/episerver/content-js-sdk/blob/main/docs/8-experience.md) - Work with experiences and variations
- [Display Settings](https://github.com/episerver/content-js-sdk/blob/main/docs/9-display-settings.md) - Configure content display options
- [RichText Component (React)](https://github.com/episerver/content-js-sdk/blob/main/docs/10-richtext-component-react.md) - Render rich text content
- [DAM Assets](https://github.com/episerver/content-js-sdk/blob/main/docs/11-dam-assets.md) - Manage digital assets
- [Client Utils](https://github.com/episerver/content-js-sdk/blob/main/docs/12-client-utils.md) - Utility functions and helpers

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
