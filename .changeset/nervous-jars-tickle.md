---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

Add composition properties and built-in composition configuration.

An experience used to have a single editable layout, its built-in `composition`, and no way to limit what editors could add to it. Anything else had to be a content area, which gives editors a flat list instead of a layout.

Two things are new:

- **Composition properties.** Add `type: 'composition'` to an `_experience` to create another editable layout. Each one has its own node tree, is returned by the same query, and renders with `<OptimizelyComposition>`.
- **Built-in composition configuration.** Add `composition` next to `properties` to set the layout and the allowed content of the built-in one. It is a content type field, not a property, because the CMS reserves the name `composition`. Available on `_experience` and `_section`.

```ts
const ProductPageType = contentType({
  key: 'ProductPage',
  baseType: '_experience',

  // Configures the built-in composition
  composition: {
    format: 'grid',
    allowedTypes: [HeroComponentType, '_component'],
    restrictedTypes: [LegacyBannerType],
  },

  properties: {
    title: { type: 'string' },

    // A second, separate layout
    sidebar: {
      type: 'composition',
      format: 'grid',
      displayName: 'Sidebar',
      allowedTypes: [HeroComponentType],
    },
  },
});
```

```tsx
export default function ProductPage({ content }: Props) {
  return (
    <main>
      <h1>{content.title}</h1>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
      <aside>
        <OptimizelyComposition nodes={content.sidebar?.nodes ?? []} />
      </aside>
    </main>
  );
}
```

`format` sets the editing layout: `'grid'` for rows and columns of elements, `'outline'` for a flat ordered list of sections. It is required on a composition property. On the built-in configuration it is optional, and the base type's default is used when it is left out.

`allowedTypes` and `restrictedTypes` limit what an editor can add. Leave them out to allow every composition element. Because the two layouts hold different things, the format decides which types the lists may name: a `'grid'` takes components with `compositionBehaviors: ['elementEnabled']` or the base type `_component`, an `'outline'` takes components with `compositionBehaviors: ['sectionEnabled']`, `_section` content types, or `_component`. Neither list changes the generated GraphQL query, which always selects every composition element type.

`opti-cms config push` checks the format before sending, so a typo fails locally with a clear message. `opti-cms config pull` writes both forms back into your models and imports the content types they reference.

Composition properties require Optimizely CMS SaaS (and future CMS 14), and the CMS accepts them only on `_experience` content types.
