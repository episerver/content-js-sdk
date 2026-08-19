---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

Add `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property from the editing interface. Defaults to `'available'` when not set. `opti-cms config pull` keeps `displayMode: 'hidden'` in generated content types and omits the `'available'` default.
