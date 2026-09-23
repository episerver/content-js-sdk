---
'@optimizely/cms-cli': minor
---

[CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Add `optimizely-cms-cli config delete`

Deletes from the CMS only the content types declared in your project configuration, after a confirmation prompt — unlike `danger delete-all-content-types`, which removes every user-defined type.

```sh
optimizely-cms-cli config delete             # ./optimizely.config.mjs
optimizely-cms-cli config delete ./custom-config.mjs
```
