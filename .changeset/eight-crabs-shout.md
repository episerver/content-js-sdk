---
'@optimizely/cms-sdk': minor
---

[CMS-57435](https://optimizely-ext.atlassian.net/browse/CMS-57435): Return image metadata with `contentReference` properties

A reference to an image used to come back as `key` and `url` only, so alt text, photographer,
width and height needed a second query — even though the same image in a content area already
arrived complete. References to media now resolve `item` as part of the page request.

```ts
const Page = contentType({
  key: 'ArticlePage',
  baseType: '_page',
  properties: {
    heroImage: { type: 'contentReference', allowedTypes: [ImageFile] },
  },
});

const page = await client.getContent({ key });

page.heroImage?.item?.AltText; // previously required a second query
page.heroImage?.item?.imageMetadata; // { width, height }
```

Applies to references that allow media, whether by content type or by `_image`, `_video` or
`_media`. References to pages and components are unchanged.
