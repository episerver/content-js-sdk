---
'@optimizely/cms-sdk': major
---

[CMS-56023](https://optimizely-ext.atlassian.net/browse/CMS-56023): config() options regrouped into fragment and query

**Breaking change:** options that used to sit flat on `config()` now live in one of two groups, so any call still passing them at the top level silently loses them. `fragment` holds the settings that shape the generated GraphQL query and are fixed for the client's lifetime; `query` holds the per-request defaults you can still override on a single call.

```ts
// Before
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  richTextFormat: 'json',
  compositionDepth: 4,
  expandContracts: true,
  maxFragmentThreshold: 100,
  dam: 'automatic',
  cache: true,
  slot: 'Current',
  host: process.env.APPLICATION_HOST,
});

// After
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    richTextFormat: 'json',
    compositionDepth: 4,
    expandContracts: true,
    maxThreshold: 100, // renamed from maxFragmentThreshold
    dam: 'automatic',
  },
  query: {
    cache: true,
    slot: 'Current',
    host: process.env.APPLICATION_HOST,
  },
});
```

`typeFilter` moves into `fragment` too. TypeScript flags anything left at the top level.

`dam` is no longer accepted on individual requests — it shapes the generated query, so it is fixed for the lifetime of a client. `cache`, `stored`, `slot` and `host` are still per-request overrides. See [config() Parameters](https://github.com/episerver/content-js-sdk/blob/main/docs/5-fetching.md#config-parameters).
