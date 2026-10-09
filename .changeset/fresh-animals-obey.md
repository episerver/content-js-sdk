---
'@optimizely/cms-cli': patch
'@optimizely/cms-sdk': patch
---

Reject `contentType` on `content` properties in types and `config push`, since CMS
silently drops it; use `allowedTypes`/`restrictedTypes`.
