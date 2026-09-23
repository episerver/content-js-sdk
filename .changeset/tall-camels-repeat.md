---
'@optimizely/cms-sdk': patch
---

[CMS-55406](https://optimizely-ext.atlassian.net/browse/CMS-55406): Fix property inference for content types extending a contract without properties

Extending a contract that declares no properties (or an empty `properties: {}`) collapsed the content type's own properties, leaving `ContentProps` empty at the type level.
