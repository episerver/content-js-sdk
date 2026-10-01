---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

# Add support for custom Composition properties

An `_experience` can now declare extra properties with `type: 'composition'` alongside its built-in one. They hold the same node tree, are queried with the same `ICompositionNode` fragments, and render through the same `<OptimizelyComposition>` pipeline. `allowedTypes` and `restrictedTypes` restrict what editors may place in them; they do not narrow the generated query.

```ts
const ProductPageType = contentType({
  key: 'ProductPage',
  baseType: '_experience',
  properties: {
    sidebar: {
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
      allowedTypes: ['_component'],
      maxItems: 4,
    },
  },
});
```

```tsx
<OptimizelyComposition nodes={content.sidebar?.nodes ?? []} />
```

`<OptimizelyComposition>` now renders rows and columns that sit directly under a composition property. A `format: 'grid'` property has no section level — the CMS returns `row → column → component`, and those rows carry no content type — so they previously fell through to the unknown-node placeholder instead of rendering.

On an `_experience`, declaring the reserved key `composition` overrides the built-in property instead of adding a second one, which is how you restrict what the built-in composition accepts. Existing experiences are unaffected.

`format` is mandatory and must be `'grid'` (rows and columns, like the built-in composition) or `'outline'` (a flat ordered list). The union is exported as `CompositionFormat`, derived from `COMPOSITION_FORMATS`. Both values are reserved: other property types may still declare a `format`, just not one of these. `opti-cms config push` checks both rules at runtime, so a plain JavaScript config fails locally with a clear message instead of being rejected by the CMS.

The CMS only accepts composition properties on experiences — pushing one on a page, component or section is rejected. Requires Optimizely CMS SaaS (and future CMS 14).
