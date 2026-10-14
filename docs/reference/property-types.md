# Property types

The `type` of a property decides what it stores, which options it accepts and the
TypeScript type that `ContentProps` gives its value. Properties appear in the `properties`
of `contentType()` and `contract()`.

```ts
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: { type: 'string', displayName: 'Heading', maxLength: 120 },
  },
});
```

| Type                                    | Stores                                         | Value in `ContentProps`              | Own options                                      |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| [`string`](#string)                     | Plain text                                     | `string`                             | `pattern`, `minLength`, `maxLength`, `enum`      |
| [`richText`](#richtext)                 | Formatted text                                 | `{ html?, json? }`                   | `editorSettings`                                 |
| [`boolean`](#boolean)                   | True or false                                  | `boolean`                            |                                                  |
| [`integer`](#integer)                   | A whole number                                 | `number`                             | `minimum`, `maximum`, `enum`                     |
| [`float`](#float)                       | A decimal number                               | `number`                             | `minimum`, `maximum`, `enum`                     |
| [`dateTime`](#datetime)                 | A date and time                                | `string` (ISO 8601)                  | `minimum`, `maximum`                             |
| [`url`](#url)                           | A web address                                  | A [URL object](#url-object)          |                                                  |
| [`link`](#link)                         | A link with text, title and target             | `{ text, title, target, url }`       |                                                  |
| [`binary`](#binary)                     | Binary data                                    | `unknown`                            |                                                  |
| [`json`](#json)                         | Any JSON value                                 | `JsonValue`                          |                                                  |
| [`content`](#content)                   | Another content item, including its properties | `{ __typename, __viewname }`         | `allowedTypes`, `restrictedTypes`                |
| [`contentReference`](#contentreference) | A reference to an item, such as an image       | `{ key, url, item }`                 | `contentType`, `allowedTypes`, `restrictedTypes` |
| [`array`](#array)                       | A list of values of one type                   | An array of the item type's value    | `items`, `minItems`, `maxItems`                  |
| [`component`](#component)               | An embedded component                          | `ContentProps` of the component type | `contentType`                                    |

## Reference

### Common options

Every property type accepts these options, in addition to its own:

| Option         | Type                                        | Description                                                                                                |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `type`         | `string`                                    | Required. One of the types on this page                                                                    |
| `displayName`  | `string`                                    | The field label in the CMS editor                                                                          |
| `description`  | `string`                                    | Help text shown with the field                                                                             |
| `isRequired`   | `boolean`                                   | Editors must enter a value before publishing                                                               |
| `isLocalized`  | `boolean`                                   | Store a separate value per locale. When not set, all locales share one value                               |
| `group`        | `string`                                    | The editor tab the field appears on: a key from `propertyGroups`, or a built-in group such as `'Settings'` |
| `sortOrder`    | `number`                                    | Position within the group. Lower numbers come first                                                        |
| `indexingType` | `'searchable' \| 'queryable' \| 'disabled'` | How Graph indexes the property. When not set, Graph uses its default                                       |
| `displayMode`  | `'available' \| 'hidden'`                   | `'hidden'` hides the field from editors. The value is still stored and fetched. Default `'available'`      |
| `format`       | `string`                                    | A CMS property format for specialised handling. Rarely needed                                              |

The built-in groups are `Content`, `Scheduling`, `Settings`, `Shortcut`, `Categories` and
`DynamicBlocks`. Declare your own in [`optimizely.config.mjs`](./optimizely-config.md).

### How values are typed

`ContentProps<typeof X>` maps each property to the type of its fetched value:

- Every property value is `T | null`, where `T` is the type listed for it below.
- Properties with `indexingType: 'disabled'` are left out, of the type and of the query.
- `ContentProps` also accepts a single property, for example
  `ContentProps<typeof ArticleContentType.properties.heading>`.

#### URL object

`url` and `link` properties, and the URLs of content references, use this shape:

```ts
type UrlValue = {
  type: string | null;
  default: string | null;
  hierarchical: string | null;
  internal: string | null;
  graph: string | null;
  base: string | null;
};
```

`default` is the URL to put in a link. The other fields are alternative forms that Graph
returns.

### `string`

Plain text.

| Option      | Type                                       | Description                                                            |
| ----------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `pattern`   | `string`                                   | A regular expression the value must match. Escape backslashes: `'\\d'` |
| `minLength` | `number`                                   | Minimum number of characters                                           |
| `maxLength` | `number`                                   | Maximum number of characters                                           |
| `enum`      | `{ value: string; displayName: string }[]` | The only values editors can choose, with the label shown for each      |

**Value:** `string`

### `richText`

Formatted text, edited in a rich text editor.

| Option           | Type                                               | Description                                  |
| ---------------- | -------------------------------------------------- | -------------------------------------------- |
| `editorSettings` | `{ preset: 'default' \| 'minimal' \| 'expanded' }` | The editor toolbar. `'default'` when not set |

**Value:**

```ts
type RichTextValue = {
  html?: string;
  json?: { type: 'richText'; children: Node[] };
};
```

Which of the two fields is fetched depends on the `fragment.richTextFormat` option of
[`config()`](./config.md), which defaults to `'json'`. Render `json` with the
[`<RichText>` component](./rich-text-component.md). See also
[Rich text](../guides/rich-text.md).

### `boolean`

True or false, shown as a checkbox. No own options.

**Value:** `boolean`

### `integer`

A whole number.

| Option    | Type                                       | Description                        |
| --------- | ------------------------------------------ | ---------------------------------- |
| `minimum` | `number`                                   | Lowest allowed value, inclusive    |
| `maximum` | `number`                                   | Highest allowed value, inclusive   |
| `enum`    | `{ value: number; displayName: string }[]` | The only values editors can choose |

**Value:** `number`

### `float`

A decimal number. Accepts the same options as [`integer`](#integer).

**Value:** `number`

### `dateTime`

A date and time.

| Option    | Type     | Description                                                        |
| --------- | -------- | ------------------------------------------------------------------ |
| `minimum` | `string` | Earliest allowed value, inclusive, as an ISO 8601 date-time string |
| `maximum` | `string` | Latest allowed value, inclusive, as an ISO 8601 date-time string   |

**Value:** `string`, an ISO 8601 date-time.

### `url`

A web address, without link text. No own options.

**Value:** a [URL object](#url-object). Use `value.default` as the address.

### `link`

A link with the attributes of an `<a>` tag: the address, link text, title and target. No
own options.

**Value:**

```ts
type LinkValue = {
  text: string | null;
  title: string | null;
  target: string | null;
  url: UrlValue;
};
```

`url` is a [URL object](#url-object). In an array of links, the CLI sets the
`LinkCollection` format for you.

### `binary`

Binary data. No own options.

**Value:** `unknown`

### `json`

Any JSON value. No own options.

**Value:** `JsonValue`, exported from `@optimizely/cms-sdk`. To give the value a specific
type, see [Typing a `json` property](#typing-a-json-property).

### `content`

Another content item. The query fetches the item's own properties, so you can render it
with its own component. An array of `content` items is a content area.

| Option            | Type               | Description                             |
| ----------------- | ------------------ | --------------------------------------- |
| `allowedTypes`    | `PermittedTypes[]` | Only these types can be selected        |
| `restrictedTypes` | `PermittedTypes[]` | Every type except these can be selected |

Declare at least one of them, with at least one entry. Each entry is one of:

- A content type, such as `ArticleContentType`.
- A [contract](../guides/contracts.md), which stands for every content type that extends
  it.
- A base type, such as `'_component'`, which stands for every content type built on it.
- `'_self'`, the content type the property belongs to.
- A content type key, such as `'Article'`.

**Value:** typed as `{ __typename: string; __viewname: string }`. At runtime the object
also has the properties of its content type. Pass it to `<OptimizelyComponent>`, which
picks the component from `__typename`.

### `contentReference`

A reference to one item, usually an image, video or file. The query fetches the item's key
and URLs, not its properties.

| Option            | Type                       | Description                                           |
| ----------------- | -------------------------- | ----------------------------------------------------- |
| `contentType`     | A content type, or its key | Exactly this type. Can't be combined with the lists   |
| `allowedTypes`    | `PermittedTypes[]`         | Only these types, as for [`content`](#content)        |
| `restrictedTypes` | `PermittedTypes[]`         | Every type except these, as for [`content`](#content) |

Declare either `contentType`, or at least one non-empty list.

**Value:**

```ts
type ContentReferenceValue = {
  key: string;
  url: UrlValue;
  item: PublicImageAsset | PublicVideoAsset | PublicRawFileAsset | null;
};
```

`item` is fetched only when DAM is enabled. It holds the asset, with a `__typename` of
`cmp_PublicImageAsset`, `cmp_PublicVideoAsset` or `cmp_PublicRawFileAsset`. See
[DAM assets](../guides/dam-assets.md).

### `array`

A list of values of one type.

| Option     | Type                                    | Description                                       |
| ---------- | --------------------------------------- | ------------------------------------------------- |
| `items`    | A property definition of any other type | Required. Describes one item. Can't be an `array` |
| `minItems` | `number`                                | Minimum number of items                           |
| `maxItems` | `number`                                | Maximum number of items                           |

Put common options such as `displayName` on the array, and type-specific options such as
`allowedTypes` or `maxLength` on `items`.

**Value:** an array of the item type's value, such as `string[]` for `string` items.

### `component`

One embedded component of a fixed type. Editors fill in its fields as part of the item
that holds it.

| Option        | Type           | Description                           |
| ------------- | -------------- | ------------------------------------- |
| `contentType` | A content type | Required. The component type to embed |

**Value:** `ContentProps<typeof T>`, where `T` is the component type.

### Caveats

- **The CLI rejects unconstrained references.** `config push` fails before uploading
  anything if a `content` or `contentReference` property, or array `items` of those types,
  has no constraint, an empty list, or `contentType` combined with a list.
- **`contentType` works only on `contentReference`.** TypeScript rejects it on `content`,
  and so does `config push`, because the CMS ignores it there.
- **Types named in `content` constraints must be registered.** The SDK builds a fragment
  for each type a `content` property accepts, and throws if one is missing from
  `initContentTypeRegistry()`.
- **An embedded component has no metadata.** The `component` value is typed with the full
  `ContentProps` of its type, but the query fetches only the component's properties, not
  `_metadata`.
- **Arrays can't be nested.** `items` can be any type except `array`.

## Usage

### Typing a value you pass to a child component

Pass a single property to `ContentProps` to type a value on its own:

```tsx
// src/components/Event.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';

export const EventContentType = contentType({
  key: 'Event',
  displayName: 'Event',
  baseType: '_page',
  properties: {
    tickets: { type: 'link', displayName: 'Tickets' },
  },
});

type TicketLinkProps = {
  link: ContentProps<typeof EventContentType.properties.tickets>;
};

export function TicketLink({ link }: TicketLinkProps) {
  return (
    <a href={link.url.default ?? undefined} target={link.target ?? undefined}>
      {link.text}
    </a>
  );
}
```

### Offering a fixed set of choices

```ts
import { contentType } from '@optimizely/cms-sdk';

export const BannerContentType = contentType({
  key: 'Banner',
  displayName: 'Banner',
  baseType: '_component',
  properties: {
    theme: {
      type: 'string',
      displayName: 'Theme',
      enum: [
        { value: 'light', displayName: 'Light' },
        { value: 'dark', displayName: 'Dark' },
      ],
    },
  },
});
```

The value is typed as `string`, not as a union of the listed values.

### Typing a `json` property

Cast the definition to `Properties.JsonProperty<T>` to type the value as `T`:

```ts
import { contentType, Properties } from '@optimizely/cms-sdk';

type CarouselSettings = { autoplay: boolean; interval: number };

export const CarouselContentType = contentType({
  key: 'Carousel',
  displayName: 'Carousel',
  baseType: '_component',
  properties: {
    settings: { type: 'json' } as Properties.JsonProperty<CarouselSettings>,
  },
});
```

`ContentProps<typeof CarouselContentType>['settings']` is now `CarouselSettings | null`.
The SDK doesn't check the fetched value against the type. To validate it, see
[Validating external data](../guides/validating-external-data.md).

### Storing a list of links

```ts
import { contentType } from '@optimizely/cms-sdk';

export const FooterContentType = contentType({
  key: 'Footer',
  displayName: 'Footer',
  baseType: '_component',
  properties: {
    links: {
      type: 'array',
      items: { type: 'link' },
      displayName: 'Links',
      maxItems: 8,
    },
  },
});
```

### Accepting images only

```ts
import { contentType } from '@optimizely/cms-sdk';

export const TeaserContentType = contentType({
  key: 'Teaser',
  displayName: 'Teaser',
  baseType: '_component',
  properties: {
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});
```

## Troubleshooting

### `config push` reports "missing type constraints"

A `content` or `contentReference` property, or the `items` of an array of them, accepts
any type. Add `allowedTypes` or `restrictedTypes`, or `contentType` on a
`contentReference`. See [Define content types](../guides/content-types.md).

### `config push` reports "empty type constraints"

`allowedTypes` or `restrictedTypes` is `[]`. List at least one type, or remove the option
and add a different constraint.

### `config push` reports "conflicting type constraints"

A `contentReference` property sets both `contentType` and a list. Keep only one.

### `config push` reports "unsupported type constraint"

A `content` property sets `contentType`. Use `allowedTypes: [TheType]` instead.

### `Fragment generation for "…" produced … inner fragments`

A `content` property without constraints resolved to more fragments than
`fragment.maxThreshold` allows (100 by default). Add `allowedTypes` or `restrictedTypes`
to the property. Raise `fragment.maxThreshold` in [`config()`](./config.md) only if the
large query is intended.

### `Content type "…" is not available in the component registry`

A `content` property accepts a type that isn't registered. Add it to the list you pass to
`initContentTypeRegistry()`.
