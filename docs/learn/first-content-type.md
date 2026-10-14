# Your first content type

A **content type** describes the shape of a piece of content: which fields it has and what
kind of data each field holds. With this SDK you define content types in TypeScript, next
to the components that render them, and push them to Optimizely CMS with the CLI. Your
code is the source of truth.

> **You will learn**
>
> - How to define a content type
> - What its key, base type and properties do
> - How to push it to the CMS

## Define the Article content type

Create `src/components/Article.tsx`:

```tsx
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    body: { type: 'richText', displayName: 'Body' },
  },
});
```

The file ends in `.tsx` because later in the tutorial you will add the React component
that renders an article to the same file. Keeping the two together means the shape of the
data and the code that displays it change together.

## What each part means

- **`key`** identifies the content type in the CMS and in Graph. Later you will register
  the React component for articles under this same name. Treat it as permanent: changing
  it creates a new content type, it does not rename this one.
- **`displayName`** is the name editors see in the CMS.
- **`baseType`** says what kind of content this is. `_page` is a page with its own URL.
  Other base types cover reusable components, folders, media and Visual Builder
  experiences. See [Content types](../guides/content-types.md) for the full list.
- **`properties`** are the fields editors fill in. Each has a `type`. `string` is a line
  of plain text, and `richText` is formatted text with headings, lists and links. See
  [Property types](../reference/property-types.md) for every type.

## Push it to the CMS

Run `config push` from the project root:

```sh
npx @optimizely/cms-cli@latest config push
```

The CLI reads `optimizely.config.mjs`, finds `Article.tsx` through the `components`
pattern, and uploads the content types it exports. When it prints **Configuration file
uploaded**, open your CMS and go to **Settings → Content Types**. **Article** is now in
the list.

<details>
<summary><b>Deep dive:</b> What happens when you change a content type later?</summary>

Edit the definition and run `config push` again. Adding a property, or changing its
display name, is applied straight away.

Changes that could lose content, such as removing a property or changing its type, are
rejected. Rerun the command with `--force` to apply them anyway.

`config push` never deletes anything. If you remove a content type from your code, it
stays in the CMS until you delete it with `content delete`. See
[CLI commands](../reference/cli.md).

</details>

## Recap

- A content type is defined with `contentType()` and lives next to the component that
  renders it.
- `key` is permanent, `displayName` is for editors, `baseType: '_page'` makes it a
  routable page, and `properties` are its fields.
- `config push` uploads every content type matched by `components` in
  `optimizely.config.mjs`.

**Next:** [Create content →](./create-content.md)
