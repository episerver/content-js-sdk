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
`ZIP archive` and the rest — and any other string is accepted for a custom icon. Leave
`icon` out, or set it to an empty string, for no icon.

Display template settings gained a third editor, `variant`, which shows the choices side
by side instead of in a drop-down. Like `select`, it gives the component the key of the
chosen choice:

```ts
settings: {
  look: {
    editor: 'variant',
    displayName: 'Look',
    sortOrder: 1,
    choices: {
      light: { displayName: 'Light', sortOrder: 1 },
      dark: { displayName: 'Dark', sortOrder: 2 },
    },
  },
}
```

`editor` was typed `'select' | 'checkbox' | string`, which collapses to `string`: the
known editors never appeared in autocomplete, and `ContentProps` needed `as const` on the
value to infer anything. The type now keeps the literals, so autocomplete lists them and
`as const` is no longer necessary. Existing `as const` annotations keep working.

`config pull` writes both the content type's `icon` and a setting's `variant` editor into
the generated code.
