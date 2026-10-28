---
'@optimizely/cms-sdk': patch
---

Fix component metrics aborting Next.js `cacheComponents` prerenders by deferring them
until metric collection.
