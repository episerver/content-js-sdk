---
'@optimizely/cms-sdk': minor
---

[CMS-55015](https://optimizely-ext.atlassian.net/browse/CMS-55015): Configurable composition depth

Experience queries fetched a fixed number of composition levels. `fragment.compositionDepth` sets how many to fetch — raise it for deeply nested compositions, lower it for smaller queries.

```ts
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    compositionDepth: 6, // default 4
  },
});
```

See [config() Parameters](https://github.com/episerver/content-js-sdk/blob/main/docs/5-fetching.md#config-parameters).
