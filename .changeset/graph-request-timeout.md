---
'@optimizely/cms-sdk': patch
---

Add a Graph request timeout (`requestTimeout`, default 30 s) and stop the shared section-types
lookup from stalling content fetches: a lookup slower than 3 s is skipped for that call.
