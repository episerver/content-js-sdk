---
'@optimizely/cms-sdk': patch
---

[CMS-55090](https://optimizely-ext.atlassian.net/browse/CMS-55090): Generate cacheable GraphQL queries

Queries now pass their filters as scalar variables instead of inline input objects, so Optimizely Graph can cache and store them. Responses come back faster; no changes needed in your application.
