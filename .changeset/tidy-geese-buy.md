---
'@optimizely/cms-sdk': patch
---

Fix custom section properties missing from Graph responses

Properties declared on a `_section` content type came back `undefined` because the generated query never selected them. Sections inside an experience composition now carry their own properties.
