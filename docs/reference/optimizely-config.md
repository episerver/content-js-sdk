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
| `previewUrlFormats`            | `Record<string, string>`          | No        | `'website'` only. Preview URL per base type or content type key              |

When `previewUrlFormats` is left out of a new `'website'` application, it defaults to:

```js
previewUrlFormats = {
  any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
};
```

Each entry in `hosts` has these fields:

| Field                | Type                                                        | Required |
| -------------------- | ----------------------------------------------------------- | -------- |
| `authority`          | `string`, such as `'localhost:3000'` or `'www.example.com'` | Yes      |
| `type`               | `'default' \| 'primary' \| 'preview' \| 'edit' \| 'media'`  | No       |
| `locale`             | `string`                                                    | No       |
| `preferredUrlScheme` | `'http' \| 'https'`                                         | No       |

### Caveats

- **`config push` never deletes anything.** A content type that you remove from your code
  stays in the CMS. Delete it with
  [`content delete`](../13-cli-commands.md#content-delete).
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
export const ArticleContentType = contentType({
  key: 'Article',
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
