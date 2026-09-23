---
'@optimizely/cms-sdk': major
---

[CMS-55780](https://optimizely-ext.atlassian.net/browse/CMS-55780): Rich Text properties now default to `json` only

**Breaking change:** queries used to select both `html` and `json` for every Rich Text property. They now select `json` alone, so `html` comes back `undefined` and any component rendering the raw HTML string (e.g. through `dangerouslySetInnerHTML`) renders nothing. Queries and responses shrink for everyone else.

```ts
config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    richTextFormat: 'html', // or 'both' to keep the old payload
  },
});
```

Applications rendering Rich Text with the SDK's `<RichText>` component need no change — it reads the `json` representation. See [RichText Property](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#richtext-property).
