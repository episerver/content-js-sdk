---
'@optimizely/cms-sdk': minor
---

Add `getDescendants()`, which fetches every page below a given page in one request. Use it for multi-level menus and sitemaps instead of calling `getItems()` recursively, which costs one request per page.
