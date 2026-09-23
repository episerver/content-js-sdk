---
'@optimizely/cms-sdk': major
---

[CMS-55301](https://optimizely-ext.atlassian.net/browse/CMS-55301): Remove the `'standard'` Rich Text editor preset

**Breaking change:** `'standard'` was never a preset the CMS understood, so `RICHTEXT_PRESET` is now `'default' | 'expanded' | 'minimal'`. Content types that ask for it stop type-checking.

```ts
// Before
summary: { type: 'richText', editorSettings: { preset: 'standard' } }

// After
summary: { type: 'richText', editorSettings: { preset: 'default' } }
```

**Migrating:** replace `preset: 'standard'` with `'default'`. See [RichText Property](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#richtext-property).
