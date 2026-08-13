---
'@optimizely/cms-sdk': patch
---

Access section properties directly on `content`

Custom properties of `_section` content types are now available flat on `content`, the same as
every other content type, instead of nested under `content.component`.