---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

[CMS-56250](https://optimizely-ext.atlassian.net/browse/CMS-56250): Add `componentPreviewUrlFormats` to applications

A `'website'` application can now say where a single component is previewed, separately
from `previewUrlFormats`, which stays as it was and keeps previewing whole pages.

```js
applications: [
  {
    key: 'site',
    displayName: 'Site',
    type: 'website',
    componentPreviewUrlFormats: {
      // every component
      _component: '{host}/preview/component?key={key}&ver={version}&loc={locale}&ctx={context}',
      // and this one somewhere else again
      HeroComponent: '{host}/preview/hero?key={key}&ver={version}&loc={locale}&ctx={context}',
    },
  },
],
```

Both dictionaries take the same keys: `any` for everything without an entry of its own, a
base type, or a content type key. A content type key wins over a base type, and a base
type over `any`. `componentPreviewUrlFormats` has no default, so only the content you
give an entry gets a component preview.

`config push` now rejects a `componentPreviewUrlFormats` key that names nothing
previewable — `_folder`, a contract, a display template, or a content type the project
does not define — naming the offending keys rather than letting the CMS quietly ignore
them. Like `usePreviewTokens` and `previewUrlFormats`, the field itself is rejected on an
`'inProcessWebsite'` application.

The CMS API schema does not carry this field yet, so the CLI widens its own application
type until the generated schema catches up.
