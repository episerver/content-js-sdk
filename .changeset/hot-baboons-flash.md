---
'@optimizely/cms-cli': patch
---

[CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Improve detection of deletable types for `danger delete-all-content-types`

Only types with no `source` are user-defined and deletable. The command used to skip just `system` and `serverModel`, so it attempted types owned by other sources and failed on them.
