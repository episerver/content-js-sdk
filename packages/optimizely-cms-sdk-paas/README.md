# @optimizely/cms-sdk-paas

Optimizely CMS 13 PaaS support for
[`@optimizely/cms-sdk`](https://www.npmjs.com/package/@optimizely/cms-sdk). The SDK
targets CMS SaaS by default; this package switches it to PaaS.

## Install

```sh
npm install @optimizely/cms-sdk @optimizely/cms-sdk-paas
```

## Usage

Pass `paas()` as the `platform` when configuring the SDK. Everything else is imported from
`@optimizely/cms-sdk` as usual.

```ts
import { config } from '@optimizely/cms-sdk';
import { paas } from '@optimizely/cms-sdk-paas';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  platform: paas(),
});
```

`getClient({ platform: paas() })` and `new GraphClient(key, { platform: paas() })` work
the same way.

See
[Use the SDK with CMS PaaS](https://github.com/episerver/content-js-sdk/blob/main/docs/guides/cms-paas.md)
for details.
