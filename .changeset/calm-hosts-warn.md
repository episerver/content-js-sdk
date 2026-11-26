---
'@optimizely/cms-sdk': patch
---

Normalize `query.host` before matching it in Graph (bare host gets `https://`; case, path and
trailing slash are dropped), and log one warning per host when a path lookup with a host finds
nothing.
