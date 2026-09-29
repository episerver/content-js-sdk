---
'@optimizely/cms-sdk': patch
---

Fix `getContentByPath()` with `variation: { include: 'SOME' }`, broken since 3.0.0.

The metadata lookup declared its `$vN` variables but never sent the values, so Graph received `value: [null]` and answered `HTTP 500`. `includeOriginal` was typed but never read, so a visitor matching no variation got nothing instead of the original.
