---
'@optimizely/cms-sdk': patch
---

[CMS-54844](https://optimizely-ext.atlassian.net/browse/CMS-54844): Access section properties directly on `content`

Custom properties of `_section` content types are now available flat on `content`, the same as
every other content type, instead of nested under `content.component`.
