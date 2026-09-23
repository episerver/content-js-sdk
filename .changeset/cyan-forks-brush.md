---
'@optimizely/cms-sdk': patch
'@optimizely/cms-cli': patch
---

[CMS-54769](https://optimizely-ext.atlassian.net/browse/CMS-54769): Handle the `'*'` wildcard in `allowedTypes`

`allowedTypes: ['*']` means "any content type". Queries treated `'*'` as a content type key and resolved nothing; `optimizely-cms-cli config push` sent it to the CMS, which rejects it. The wildcard now expands to every registered type when querying and is stripped when pushing.
