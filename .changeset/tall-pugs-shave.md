---
'@optimizely/cms-sdk': patch
---

Fix `getItems()` and `getPath()` ignoring CMS language fallbacks when looking up content by key.

Both operations filtered on `_metadata.locale`, which is the locale a document was *authored* in. A fallback document keeps its source locale there and announces the requested one separately, so the filter excluded every fallback and the lookup came back empty. The requested locale is now passed only as the `locale:` field argument, which is what resolves fallbacks.

```ts
// Previously returned null when `en-PH` had no own language version.
// Now returns the fallback content configured in the CMS.
await client.getItems({ key, locale: 'en-PH' });
```
