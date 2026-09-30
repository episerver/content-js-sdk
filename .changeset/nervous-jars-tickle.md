---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

# Add support for custom Composition properties

Any content type can now declare properties with `type: 'composition'`. They hold the same node tree as an experience's built-in composition, are queried with the same `ICompositionNode` fragments, and render through the same `<OptimizelyComposition>` pipeline. `allowedTypes` and `restrictedTypes` restrict what editors may place in them; they do not narrow the generated query.

```ts
const ProductPageType = contentType({
  key: 'ProductPage',
  baseType: '_page',
  properties: {
    sidebar: {
      type: 'composition',
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

On an `_experience`, declaring the reserved key `composition` overrides the built-in property instead of adding a second one, which is how you restrict what the built-in composition accepts. Existing experiences are unaffected.

Requires Optimizely CMS SaaS (and future CMS 14).
