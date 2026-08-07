---
'@optimizely/cms-sdk': patch
---

Normalize graphUrl to auto-append /content/v2 when missing, fixing 404 errors when using
OPTIMIZELY_GRAPH_GATEWAY environment variable
