---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

Add support for custom composition properties, so an experience can hold more than one editable layout.

An `_experience` can now declare extra properties with `type: 'composition'` alongside its built-in one. Each holds its own node tree, is fetched by the same query, and renders through `<OptimizelyComposition>`:

```ts
const ProductPageType = contentType({
  key: 'ProductPage',
  baseType: '_experience',
  properties: {
    sidebar: {
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
    },
  },
});
```

```tsx
<OptimizelyComposition nodes={content.sidebar?.nodes ?? []} />
```

`format` is required: `'grid'` lays the property out in rows and columns like the built-in composition, `'outline'` as a flat ordered list. `opti-cms config push` checks it before the request, so a missing or unknown format fails locally with a clear message.

`allowedTypes` and `restrictedTypes` are optional — declare them to limit what an editor may place in the property, omit them to allow every composition element.

```ts
sidebar: {
  type: 'composition',
  format: 'grid',
  allowedTypes: [HeroComponentType, '_component'],
},
```
