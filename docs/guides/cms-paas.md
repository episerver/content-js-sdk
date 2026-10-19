# Use the SDK with CMS PaaS

The SDK targets Optimizely CMS SaaS by default. To fetch content from an Optimizely CMS 13
PaaS instance, install `@optimizely/cms-sdk-paas` and tell the SDK which product it is
talking to. The rest of your code stays the same.

> **You will learn**
>
> - How to install the PaaS package
> - How to configure the client for PaaS
> - What differs from SaaS

## Install the PaaS package

```sh
npm install @optimizely/cms-sdk @optimizely/cms-sdk-paas
```

The two packages are released together. Keep their versions identical: the PaaS package
names the exact SDK version it works with as a peer dependency.

## Configure the client for PaaS

Pass `paas()` as the `platform` option to `config()`:

```ts
// src/app/layout.tsx
import { config } from '@optimizely/cms-sdk';
import { paas } from '@optimizely/cms-sdk-paas';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  platform: paas(),
});
```

Every client that `getClient()` returns inherits the platform. Components, rich text,
forms and live preview are imported from `@optimizely/cms-sdk` as usual.

> [!WARNING]
>
> The SDK doesn't detect which product a Graph endpoint belongs to. Without
> `platform: paas()`, it builds queries for SaaS, and a query that uses a SaaS-only
> feature fails against PaaS with a GraphQL error.

## Related

- [`config()` options](../reference/config.md#top-level)
- [Fetch content](../learn/fetch-content.md)
- [CLI commands](../reference/cli.md)
