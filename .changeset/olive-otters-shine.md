---
'@optimizely/cms-sdk': minor
---

[CMS-55409](https://optimizely-ext.atlassian.net/browse/CMS-55409): Turn DAM asset fragments on or off from `config()`

DAM fragment inclusion used to be decided entirely by schema detection, with no way to override it. The new `dam` option settles it yourself:

- `'automatic'` (default) — include DAM fragments when the Graph schema exposes DAM types. Unchanged behaviour.
- `'on'` — always include them, skipping detection.
- `'off'` — never include them, skipping detection.

```ts
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    dam: 'on', // 'automatic' | 'on' | 'off'
  },
});
```

`dam` shapes the generated query, so it is fixed for the lifetime of a client and cannot be overridden on a single request. See [Working with DAM Assets](https://github.com/episerver/content-js-sdk/blob/main/docs/11-dam-assets.md#controlling-dam-fragment-inclusion).
