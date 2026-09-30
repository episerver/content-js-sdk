---
'@optimizely/cms-sdk': minor
---

Add auth Add an `auth` option that authenticates Graph requests with an app credential
(`basic`, `hmac`), a bearer token or a custom resolver, optionally acting as a named user
via `asUser`, with responses filtered to published content by default.
