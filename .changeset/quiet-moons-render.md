---
'@optimizely/cms-sdk': patch
---

[CMS-58473](https://optimizely-ext.atlassian.net/browse/CMS-58473): Stop showing the "No component found for content type" box for Graph base types.

Graph answers with a base type such as `_Content` when an item's own type is missing from its schema. The message named that base type and suggested registering a component for it, which was never the real fix. Content resolving to a base type now renders nothing, and every other unregistered content type still shows the fallback in development.

To render something in its place, register a component for the base type:

```ts
initReactComponentRegistry({
  resolver: {
    _Content: EmptyContent,
  },
});
```
