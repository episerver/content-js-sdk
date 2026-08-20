---
'@optimizely/cms-cli': major
'@optimizely/cms-sdk': major
---

Add validations and type restrictions for properties with content and contentReference

`opti-cms config push` now stops before uploading when a `content` or `contentReference` property (or array item) is misconfigured:

- Missing constraints — declare `contentType`, or `allowedTypes`/`restrictedTypes`.
- Empty `allowedTypes`/`restrictedTypes` — list at least one content type, or remove the field.
- `contentType` combined with `allowedTypes`/`restrictedTypes` — declare only one of them.

Previously unconstrained properties were only a warning; they make the SDK generate nested GraphQL fragments for every content type.

**Migrating:** give every existing `content` and `contentReference` property a `contentType` or a non-empty `allowedTypes`/`restrictedTypes` before upgrading. Narrower constraints mean smaller queries and faster responses. See [Content Relationships](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#migrating-existing-content-types) for examples.
