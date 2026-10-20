---
'@optimizely/cms-cli': patch
'@optimizely/cms-sdk': patch
---

[CMS-56511](https://optimizely-ext.atlassian.net/browse/CMS-56511): Reject `contentType` on `content` properties in types and `config push`, since CMS
silently drops it; use `allowedTypes`/`restrictedTypes`.
