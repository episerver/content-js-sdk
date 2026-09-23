---
'@optimizely/cms-cli': major
'@optimizely/cms-sdk': major
---

[CMS-54832](https://optimizely-ext.atlassian.net/browse/CMS-54832): Add validations and type restrictions for properties with content and contentReference

`optimizely-cms-cli config push` now stops before uploading when a `content` or `contentReference` property (or array item) is misconfigured:

- Missing constraints — declare `contentType`, or `allowedTypes`/`restrictedTypes`.
- Empty `allowedTypes`/`restrictedTypes` — list at least one content type, or remove the field.
- `contentType` combined with `allowedTypes`/`restrictedTypes` — declare only one of them.

**Breaking change:** these were warnings before, so a content model that pushed cleanly on the previous version can now be rejected outright. Unconstrained properties make the SDK generate nested GraphQL fragments for every registered content type.

```ts
// Rejected
properties: {
  mainContent: { type: 'content' },                    // missing type constraints
  gallery: { type: 'content', allowedTypes: [] },      // empty type constraints
  hero: { type: 'contentReference', contentType: ImageCT, allowedTypes: [ImageCT] },
}

// Accepted
properties: {
  mainContent: { type: 'content', allowedTypes: [TeaserCT] },
  gallery: { type: 'content', restrictedTypes: [FolderCT] },
  hero: { type: 'contentReference', contentType: ImageCT },
}
```

**Migrating:** give every existing `content` and `contentReference` property a `contentType` or a non-empty `allowedTypes`/`restrictedTypes` before upgrading. Narrower constraints mean smaller queries and faster responses. See [Content Relationships](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#migrating-existing-content-types) for examples.
