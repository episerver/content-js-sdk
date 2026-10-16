---
'@optimizely/cms-sdk': minor
---

Add config({ telemetry: { componentMetrics: false } }) to turn off component metrics,
which break Next.js cacheComponents prerendering.
