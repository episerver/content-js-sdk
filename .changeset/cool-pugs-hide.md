---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

[CMS-55078](https://optimizely-ext.atlassian.net/browse/CMS-55078): Add `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property from the editing interface. Defaults to `'available'` when not set. `optimizely-cms-cli config pull` keeps `displayMode: 'hidden'` in generated content types and omits the `'available'` default.
