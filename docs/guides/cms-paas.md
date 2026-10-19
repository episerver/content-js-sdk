# Use the SDK with CMS PaaS

The SDK targets Optimizely CMS SaaS by default. To fetch content from an Optimizely CMS 13
PaaS instance, tell the SDK which product it is talking to. The rest of your code stays
the same.

> **You will learn**
>
> - How to configure the client for PaaS

## Configure the client for PaaS

Set the `platform` option to `'paas'` in `config()`:

```ts
// src/app/layout.tsx
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  platform: 'paas',
});
```

Every client that `getClient()` returns inherits the platform. Components, rich text,
forms and live preview are imported from `@optimizely/cms-sdk` as usual.

> [!WARNING]
>
> The SDK doesn't detect which product a Graph endpoint belongs to. Without
> `platform: 'paas'`, it builds queries for SaaS, and a query that uses a SaaS-only
> feature fails against PaaS with a GraphQL error.

## Related

- [`config()` options](../reference/config.md#top-level)
- [Fetch content](../learn/fetch-content.md)
- [CLI commands](../reference/cli.md)
