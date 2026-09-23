---
'@optimizely/cms-sdk': patch
---

[CMS-54651](https://optimizely-ext.atlassian.net/browse/CMS-54651): Fix content array resolution with multiple contracts

A content area whose allowed types implement more than one contract missed the fragments of the extra contracts, so those properties came back `undefined`.
