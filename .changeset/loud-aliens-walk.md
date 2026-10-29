---
'@optimizely/cms-sdk': minor
---

Preview media URLs omit the preview token; the preview listener retries failed media with
it. Add `forceMediaToken` to restore.
