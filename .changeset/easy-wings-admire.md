---
'@optimizely/cms-cli': patch
---

[CMS-54548](https://optimizely-ext.atlassian.net/browse/CMS-54548): Always write `allowedTypes` and `restrictedTypes` on `config pull`

Empty constraint lists were dropped from the generated content types, so a pull followed by a push turned a property that allowed nothing into one that allows everything.
