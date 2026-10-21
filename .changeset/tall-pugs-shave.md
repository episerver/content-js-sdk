---
'@optimizely/cms-sdk': patch
---

[CMS-56675](https://optimizely-ext.atlassian.net/browse/CMS-56675): Fix `getContent()`, `getItems()` and `getPath()` ignoring CMS language fallbacks when looking up content by key.

All three filtered on `_metadata.locale`, which is the locale a document was *authored* in. A fallback document keeps its source locale there and announces the requested one separately, so the filter excluded every fallback and the lookup came back empty. The requested locale is now passed only as the `locale:` field argument, which is what resolves fallbacks.

```ts
// Previously returned null when `en-PH` had no own language version.
// Now returns the fallback content configured in the CMS.
await client.getItems({ key, locale: 'en-PH' });
await client.getContent({ key, locale: 'en-PH' });
```

A locale is also canonicalized before it is sent, so a lowercase one taken from a URL segment reaches Graph as `en_US` rather than being rejected as an unknown `Locales` value.

```ts
// Previously: HTTP 400, Value "en_us" does not exist in "Locales" enum.
await client.getContent({ key, locale: 'en-us' });
```

A `contentReference`, `url` or `link` property with no value is now `null` instead of an object with every field null. Graph answers the hollow shape, which is truthy, so the usual guard passed and the element rendered empty. The inferred types already allowed `null` for any property; the response now agrees with them. Which properties those are comes from the content type, so an authored `json` payload keeps its own empty objects.

```ts
// Previously truthy: { key: null, url: { default: null, ... } }
{content.image && <img src={content.image.url.default} />}
```
