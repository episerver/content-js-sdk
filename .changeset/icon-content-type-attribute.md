---
'@optimizely/cms-sdk': minor
---

[CMS-56250](https://optimizely-ext.atlassian.net/browse/CMS-56250): Add `icon` to content types

Content types can now set the icon editors see next to them in the CMS. The field sits
next to `key`, `displayName` and `properties`, and `config push` sends it along with the
rest of the definition.

```ts
const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  icon: 'Document',
});
```

Autocomplete lists the icons the CMS ships with — `Banner`, `Document`, `Start page`,
`ZIP archive` and the rest — and any other string is accepted for a custom icon.
