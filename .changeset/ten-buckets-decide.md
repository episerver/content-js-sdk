---
'@optimizely/cms-sdk': minor
---

[CMS-56227](https://optimizely-ext.atlassian.net/browse/CMS-56227): Add auth Add an `auth` option that authenticates Graph requests with an app credential
(`basic`, `hmac`), a bearer token or a custom resolver, optionally acting as a named user
via `asUser`, with responses filtered to published content by default.
