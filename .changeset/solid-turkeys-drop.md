---
'@optimizely/cms-hosting': patch
---

Fix Next.js cache handler invalidation on Next 16.3.8+ by stamping tags instead of
deleting keys; revalidateTag now works.
