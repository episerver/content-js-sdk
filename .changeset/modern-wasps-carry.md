---
'@optimizely/cms-cli': patch
---

[CMS-55749](https://optimizely-ext.atlassian.net/browse/CMS-55749): Fix `components` glob exclusions and precedence

`!dir` now excludes nested files, not only the ones directly inside it. When two patterns match content types with the same key, the one listed first in `components` wins — results used to be sorted by path, so the winner was arbitrary.
