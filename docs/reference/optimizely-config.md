# optimizely.config.mjs

The configuration file the CLI reads. It tells `config push` where your content types are
defined, and optionally which property groups, locales, start content and applications to
create in the CMS.

```js
// optimizely.config.mjs
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

## Reference

### `buildConfig(options)`

Returns the configuration as the file's default export. `config push` reads
`./optimizely.config.mjs` unless you pass a different path.

| Option           | Type       | Required | Description                                           |
| ---------------- | ---------- | -------- | ----------------------------------------------------- |
| `components`     | `string[]` | Yes      | Glob patterns for the files that define content types |
| `propertyGroups` | `object[]` | No       | Groups that organise properties in the CMS editor     |
| `locale`         | `string[]` | No       | Locales to create or enable in the CMS                |
| `content`        | `object[]` | No       | Content items to create, usually start pages          |
| `applications`   | `object[]` | No       | Applications (sites) to create or update              |

### `components`

Glob patterns, relative to the config file. The CLI imports every matching file and
collects the content types, contracts and display templates it exports.

- Prefix a pattern with `!` to exclude matching files. Exclusions apply to every include
  pattern, wherever they appear in the list.
- An excluded directory, such as `'!./src/components/internal'`, also excludes everything
  inside it.
- At least one pattern must be an include. A list of only exclusions is an error.
- If two files define the same key, the file matched by the earlier pattern wins.

### `propertyGroups`

Each group has these fields:

| Field         | Type     | Required | Default                                    |
| ------------- | -------- | -------- | ------------------------------------------ |
| `key`         | `string` | Yes      |                                            |
| `displayName` | `string` | No       | The key with its first letter capitalised  |
| `sortOrder`   | `number` | No       | The group's position in the list, from `1` |

Assign a property to a group with its `group` field. Duplicate keys are dropped, and the
first occurrence is kept. The CMS also has built-in groups that need no configuration:
`Content`, `Scheduling`, `Settings`, `Shortcut`, `Categories` and `DynamicBlocks`.

### `locale`

IETF BCP 47 language tags, such as `'en'`, `'sv-SE'` or `'de'`. `config push` creates the
locales the CMS doesn't have yet and enables any that are disabled. It never disables or
deletes a locale.

### `content`

Content items to create in the CMS, so that an application has a start page to point at.

| Field         | Type     | Required | Description                                                        |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `key`         | `string` | Yes      | Your name for the item. An application's `entryPoint` refers to it |
| `displayName` | `string` | Yes      | The name shown in the CMS                                          |
| `contentType` | `string` | Yes      | The key of a content type that exists in the CMS                   |
| `locale`      | `string` | No       | The locale of the first version. Defaults to `'en'`                |

### `applications`

| Field                          | Type                              | Required  | Description                                                                  |
| ------------------------------ | --------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `key`                          | `string`                          | Yes       | Unique identifier of the application                                         |
| `displayName`                  | `string`                          | Yes       | The name shown in the CMS                                                    |
| `type`                         | `'website' \| 'inProcessWebsite'` | Yes       | Use `'website'` for a headless site                                          |
| `entryPoint`                   | `string`                          | To create | The start page: a `key` from `content`, or a `cms://content/<key>` reference |
| `isDefault`                    | `boolean`                         | No        | Whether this is the default application                                      |
| `hosts`                        | `object[]`                        | No        | The domains the application answers on. See below                            |
| `useApplicationSpecificAssets` | `boolean`                         | No        | Give the application its own assets folder                                   |
| `usePreviewTokens`             | `boolean`                         | No        | `'website'` only. Send preview tokens to the preview URL                     |
| `previewUrlFormats`            | `Record<string, string>`          | No        | `'website'` only. Page preview URL per `any`, base type or content type key  |
| `componentPreviewUrlFormats`   | `Record<string, string>`          | No        | `'website'` only. Same keys, for previewing one component on its own         |

When `previewUrlFormats` is left out of a new `'website'` application, it defaults to:

```js
previewUrlFormats = {
  any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
};
```

Both dictionaries take the same keys: `any` for everything without an entry of its own, a
base type, or a single content type by its key. A content type key wins over a base type,
and a base type over `any`.

`previewUrlFormats` is how a whole page is previewed. `componentPreviewUrlFormats` is how
a single component is previewed outside any page, and has no default — only the content
you give an entry gets one:

```js
componentPreviewUrlFormats: {
  // every component
  _component: '{host}/preview/component?key={key}&ver={version}&loc={locale}&ctx={context}',
  // and this one somewhere else again
  HeroComponent: '{host}/preview/hero?key={key}&ver={version}&loc={locale}&ctx={context}',
}
```

The CMS fills in `{host}`, `{key}`, `{version}`, `{locale}` and `{context}`.

`config push` rejects a `componentPreviewUrlFormats` key that names nothing previewable:
`_folder`, a contract, a display template, or a content type this project does not define.

### Opting a content type out of component previews

A base type covers every content type built on it. To leave one out, set
`componentPreview: false` on the content type itself.

Three components, one of which only makes sense inside a page:

```ts
// src/components/Hero.tsx
export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
});

// src/components/Card.tsx
export const CardContentType = contentType({
  key: 'Card',
  displayName: 'Card',
  baseType: '_component',
});

// src/components/Banner.tsx
export const BannerContentType = contentType({
  key: 'Banner',
  displayName: 'Banner',
  baseType: '_component',
  // reads from the page around it, so it is nothing on its own
  componentPreview: false,
});
```

The application asks for one preview URL covering every component:

```js
// optimizely.config.mjs
applications: [
  {
    key: 'site',
    displayName: 'Site',
    type: 'website',
    componentPreviewUrlFormats: {
      _component: '{host}/preview/component?key={key}&ver={version}&loc={locale}',
    },
  },
],
```

The CMS has no field for `componentPreview`, so `config push` resolves the dictionary
before sending it: the base type is expanded into one entry per content type, and the
opted-out one is left out. The CMS receives

```json
{
  "Hero": "{host}/preview/component?key={key}&ver={version}&loc={locale}",
  "Card": "{host}/preview/component?key={key}&ver={version}&loc={locale}"
}
```

Banner is still pushed as a content type and editors still use it — it just has no
component preview, so the CMS never offers one.

Naming it explicitly changes nothing:

```js
componentPreviewUrlFormats: {
  _component: '{host}/preview/component?key={key}',
  Banner: '{host}/preview/banner?key={key}', // ignored, and push warns
}
```

The content type wins over the config: it is the more specific statement, and it sits
with the component rather than in a file across the project.

One consequence of resolving at push time: a base type covers the content types **this
project knows when you push**. One added elsewhere against the same CMS is not covered
until someone pushes again.

[`createStandalonePreview`](./react-components.md) honours the same flag, so a request
that reaches the route some other way renders nothing rather than the component.

The route you point at receives the key of real content, so it renders through
[`getPreviewContent`](./graph-client.md), as `app/preview/page.tsx` does. The standalone
component preview is a different thing: it takes `?type=` and renders stand-in content,
so it is reached from a catalogue of your own, not from one of these entries.

Each entry in `hosts` has these fields:

| Field                | Type                                                        | Required |
| -------------------- | ----------------------------------------------------------- | -------- |
| `authority`          | `string`, such as `'localhost:3000'` or `'www.example.com'` | Yes      |
| `type`               | `'default' \| 'primary' \| 'preview' \| 'edit' \| 'media'`  | No       |
| `locale`             | `string`                                                    | No       |
| `preferredUrlScheme` | `'http' \| 'https'`                                         | No       |

### Caveats

- **`config push` never deletes anything.** A content type that you remove from your code
  stays in the CMS. Delete it with [`content delete`](./cli.md#content-delete).
- **`content` items are created only if `applications` is set.** They are created once,
  empty, at the root of the content tree. Later pushes leave existing items untouched,
  even if the config changes.
- **Applications are created once and updated after that.** An application that doesn't
  exist yet needs an `entryPoint`. An existing one is updated to match the config on every
  push.
- **A scoped push (`config push --only <keys>`) skips `locale`, `content` and
  `applications`.** It only pushes the listed types.

## Usage

### Excluding files

Exclude components that define content types you don't want in the CMS, such as test
fixtures:

```js
export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    '!./src/components/internal', // a whole directory
    '!./src/components/Header.tsx', // a single file
  ],
});
```

### Grouping properties in the editor

Declare the groups in the config, then reference them from properties:

```js
// optimizely.config.mjs
export default buildConfig({
  components: ['./src/components/**/*.tsx'],
  propertyGroups: [
    { key: 'seo', displayName: 'SEO' },
    { key: 'meta', displayName: 'Metadata' },
  ],
});
```

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    metaTitle: { type: 'string', group: 'seo' },
  },
});
```

### Creating a start page and an application

This creates a `Home` page from the `Article` content type, plus an application that
serves it on `localhost:3000`:

```js
export default buildConfig({
  components: ['./src/components/**/*.tsx'],
  content: [{ key: 'HomeContent', displayName: 'Home', contentType: 'Article' }],
  applications: [
    {
      key: 'my_app',
      displayName: 'My App',
      type: 'website',
      isDefault: true,
      entryPoint: 'HomeContent',
      hosts: [
        { authority: 'localhost:3000', type: 'primary', preferredUrlScheme: 'http' },
      ],
    },
  ],
});
```

`config push` creates the content types first, then the page, then the application.

### Adding locales

```js
export default buildConfig({
  components: ['./src/components/**/*.tsx'],
  locale: ['en', 'sv-SE', 'de'],
});
```

### Using a different config file

Pass the path as the first argument:

```sh
optimizely-cms-cli config push ./config/optimizely.staging.mjs
```

## Troubleshooting

### `Invalid configuration: "components" field must be an array`

The default export has no `components` array. Check that the file uses
`export default buildConfig({ components: [...] })`.

### `Invalid component paths: cannot have only exclusion patterns`

Every pattern in `components` starts with `!`. Add at least one pattern that includes
files.

### `Content configuration required when applications defined without entryPoint`

An application has no `entryPoint`, and there is no `content` array to create one from.
Add a `content` item and point `entryPoint` at its `key`.

### `Fields 'usePreviewTokens' and 'previewUrlFormats' are only valid for type 'website'`

Remove those fields from applications whose `type` is `'inProcessWebsite'`.

### `entry points cannot overlap`

Another application already uses that start page. Each content item can be the entry point
of only one application.
