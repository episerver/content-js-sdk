# Define content types

A **content type** is the schema for one kind of content, such as an article or a hero
banner. You define content types in code with `contentType()`, and the CLI uploads them to
Optimizely CMS so that editors can create content from them.

> **You will learn**
>
> - How to define a content type
> - Which base type to build on
> - Which property type to use for each kind of data
> - How to validate what editors enter
> - How to control how a property looks in the editor
> - How indexing affects what you can fetch
> - How to restrict which types a property accepts
> - How to control what can be created under a page or folder
> - How to render a property that holds different types

## Define a content type

```ts
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

- `key` identifies the content type in the CMS and in Graph. It must start with a letter
  and contain only letters, digits and underscores.
- `displayName` is the name editors see. It is required.
- `baseType` decides what kind of content this is. See the next section.
- `properties` maps each property name to its definition.

Export the content type from a file that the `components` patterns in
[`optimizely.config.mjs`](../reference/optimizely-config.md) match. The CLI only finds
exported content types. Upload them with:

```sh
optimizely-cms-cli config push
```

To type a component's props, pass the content type to `ContentProps`:
`ContentProps<typeof ArticleContentType>`.

## Choose a base type

The **base type** is what a content type is built on. It decides where the content can be
used and which extra fields it has when you fetch it.

| Base type     | Use it for                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------- |
| `_page`       | Content with its own URL, such as an article or a product page                                |
| `_experience` | A page that editors lay out in Visual Builder. See [Experiences](./experiences.md)            |
| `_component`  | A reusable piece of content placed inside other content, such as a hero or a call to action   |
| `_section`    | A section of an experience, with its own properties and a grid of rows and columns            |
| `_folder`     | A folder that organises content in the CMS. Folders are not delivered through Graph           |
| `_image`      | Images. `ContentProps` adds `_assetMetadata` (file size, MIME type, URL) and `_imageMetadata` |
| `_video`      | Videos. `ContentProps` adds `_assetMetadata`                                                  |
| `_media`      | Other files, such as PDFs. `ContentProps` adds `_assetMetadata`                               |

A **component** is a content type with base type `_component`. The CMS UI calls it a
"block".

A component can also be placed directly in an experience's layout. Add
`compositionBehaviors: ['elementEnabled']` to use it as an element, or `'sectionEnabled'`
to use it as a section. [Experiences](./experiences.md) explains both.

## Add properties

Every property has a `type`. The other options it accepts depend on that type. This
section groups the types by what you store in them. The
[property types reference](../reference/property-types.md) lists every option and the
TypeScript type each one produces.

### Text

Use `string` for plain text, such as a title, and `richText` for formatted text with
headings, links and lists:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    summary: {
      type: 'richText',
      displayName: 'Summary',
      editorSettings: { preset: 'minimal' },
    },
    body: { type: 'richText', displayName: 'Body' },
  },
});
```

`editorSettings.preset` picks the editor toolbar: `'minimal'`, `'default'` or
`'expanded'`. Render rich text with the `<RichText>` component.
[Rich text](./rich-text.md) covers it, along with the `fragment.richTextFormat` option
that decides what Graph returns.

### Numbers, dates and true/false

| Type       | Stores                            | Value when fetched   |
| ---------- | --------------------------------- | -------------------- |
| `integer`  | Whole numbers                     | `number`             |
| `float`    | Decimal numbers                   | `number`             |
| `dateTime` | A date and time                   | An ISO 8601 `string` |
| `boolean`  | A checkbox, such as "Show banner" | `boolean`            |

### Links

Use `url` for a bare address and `link` when editors also need to set the link text, title
and target. Both come back as objects, not strings: the address is in `default`.

```tsx
// src/components/Event.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';

export const EventContentType = contentType({
  key: 'Event',
  displayName: 'Event',
  baseType: '_page',
  properties: {
    website: { type: 'url', displayName: 'Website' },
    tickets: { type: 'link', displayName: 'Tickets' },
  },
});

type EventProps = {
  content: ContentProps<typeof EventContentType>;
};

export default function Event({ content }: EventProps) {
  const { website, tickets } = content;

  return (
    <p>
      <a href={website?.default ?? undefined}>Website</a>
      <a
        href={tickets?.url.default ?? undefined}
        target={tickets?.target ?? undefined}
        title={tickets?.title ?? undefined}
      >
        {tickets?.text}
      </a>
    </p>
  );
}
```

### References to other content

Two property types point at other content items. They differ in what you get back.

- **`contentReference`** points at one item, usually an image or a file. You get its `key`
  and URLs, not its properties. With DAM enabled, you also get the asset in `item`. See
  [DAM assets](./dam-assets.md).
- **`content`** includes the referenced item's own properties in the response, so you can
  render it with its own component.

```ts
// src/components/BlogPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';

export const BlogPageContentType = contentType({
  key: 'BlogPage',
  displayName: 'Blog page',
  baseType: '_page',
  properties: {
    heroImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Hero image',
    },
    featuredArticle: {
      type: 'content',
      allowedTypes: [ArticleContentType],
      displayName: 'Featured article',
    },
  },
});
```

Both types need a constraint on what they accept, such as `allowedTypes` above. See
[Restrict which types a property accepts](#restrict-which-types-a-property-accepts).

### Embedded components

A `component` property embeds one specific component type. Editors fill in its fields as
part of the page, instead of creating a separate item:

```ts
// src/components/LandingPage.tsx
import { contentType } from '@optimizely/cms-sdk';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    image: { type: 'contentReference', allowedTypes: ['_image'] },
  },
});

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    hero: { type: 'component', contentType: HeroContentType, displayName: 'Hero' },
  },
});
```

When you fetch a landing page, `hero` holds the hero's properties. To embed an Optimizely
Forms form the same way, see [Forms](./forms.md).

### Lists

An `array` holds a list of values. `items` describes one value, and accepts any property
type except another `array`:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
    },
    relatedLinks: { type: 'array', items: { type: 'link' } },
    relatedArticles: {
      type: 'array',
      items: { type: 'content', allowedTypes: ['_self'] },
    },
  },
});
```

An array of `content` items is what the CMS calls a content area: editors drop pages and
components into it. `'_self'` means "this content type", here `Article`.

### Structured data

A `json` property stores any JSON value. Use it for data that editors don't type by hand,
such as settings written by an integration.

## Validate what editors enter

The CMS enforces these rules in the editor. The SDK doesn't check fetched values against
them.

| Option                   | Applies to                     | Meaning                                      |
| ------------------------ | ------------------------------ | -------------------------------------------- |
| `isRequired`             | All types                      | A value is required before publishing        |
| `minLength`, `maxLength` | `string`                       | Number of characters                         |
| `pattern`                | `string`                       | A regular expression the value must match    |
| `minimum`, `maximum`     | `integer`, `float`, `dateTime` | Inclusive bounds. ISO strings for `dateTime` |
| `enum`                   | `string`, `integer`, `float`   | The only values editors can pick             |
| `minItems`, `maxItems`   | `array`                        | Number of items in the list                  |

```ts
// src/components/Product.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ProductContentType = contentType({
  key: 'Product',
  displayName: 'Product',
  baseType: '_page',
  properties: {
    sku: { type: 'string', isRequired: true, pattern: '^[A-Z]{3}-\\d{4}$' },
    metaTitle: { type: 'string', maxLength: 60 },
    rating: { type: 'integer', minimum: 1, maximum: 5 },
    launchDate: { type: 'dateTime', minimum: '2025-01-01T00:00:00Z' },
    size: {
      type: 'string',
      enum: [
        { value: 'small', displayName: 'Small' },
        { value: 'large', displayName: 'Large' },
      ],
    },
  },
});
```

Each `enum` entry pairs the stored `value` with the label editors see.

## Control how a property looks in the editor

These options change only the editing interface. They don't change the stored value or
what you fetch.

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    metaTitle: {
      type: 'string',
      displayName: 'Meta title',
      description: 'Shown in search results. Keep it under 60 characters.',
      group: 'seo',
      sortOrder: 1,
    },
    importId: { type: 'string', displayMode: 'hidden' },
  },
});
```

- `displayName` and `description` label the field and explain it.
- `group` puts the field on a tab. Use a group declared in `propertyGroups` in
  [`optimizely.config.mjs`](../reference/optimizely-config.md), or a built-in one such as
  `'Content'` or `'Settings'`.
- `sortOrder` orders fields within a group. Lower numbers come first.
- `displayMode: 'hidden'` hides the field from editors. Use it for values your code sets.

`isLocalized: true` gives the property a separate value in each locale. Without it, all
locales share one value.

## Control indexing

`indexingType` decides how Graph indexes a property:

- `'searchable'` — included in full-text search.
- `'queryable'` — can be filtered and sorted, but not full-text searched.
- `'disabled'` — not indexed.

If you leave it out, Graph applies its default indexing.

> [!WARNING]
>
> The SDK leaves `'disabled'` properties out of every query it generates, and out of
> `ContentProps`. Use `'disabled'` only for data your site never displays.

## Restrict which types a property accepts

`content` and `contentReference` properties can point at almost anything in the CMS. Tell
them what they may hold with one of these:

- **`allowedTypes`** — only these types.
- **`restrictedTypes`** — anything except these types.
- **`contentType`** — exactly one type. `contentReference` only.

Both lists accept content types, [contracts](./contracts.md), base types such as
`'_image'`, `'_self'` for the content type being defined, and content type keys as
strings:

```ts
// src/components/BlogPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';
import { HeroContentType } from './Hero';

export const BlogPageContentType = contentType({
  key: 'BlogPage',
  displayName: 'Blog page',
  baseType: '_page',
  properties: {
    hero: { type: 'contentReference', contentType: HeroContentType },
    featured: { type: 'content', allowedTypes: [ArticleContentType, '_self'] },
    sidebar: {
      type: 'array',
      items: { type: 'content', restrictedTypes: ['_page', '_folder'] },
    },
  },
});
```

A base type stands for every content type built on it, so `restrictedTypes: ['_page']`
excludes all page types.

### Declare exactly one form of constraint

`config push` checks every `content` and `contentReference` property, including array
`items`, before it uploads anything. Each must declare one of:

- a non-empty `allowedTypes` or `restrictedTypes` (or both), or
- a `contentType`, on `contentReference` properties only.

It rejects a property with no constraint, an empty list, or a `contentType` combined with
a list. It also rejects `contentType` on a `content` property, because the CMS would
ignore it. The CLI lists every violation, then exits without pushing.

For `content` properties the constraint also matters at runtime. The SDK generates a
GraphQL fragment for every type the property can hold, so an open property queries every
registered content type and makes each request slow.

<details>
<summary><b>Deep dive:</b> Migrating properties that have no constraint</summary>

Content types written before `config push` enforced this rule may have unconstrained
properties. TypeScript already flags a `content` property with no constraint at all, but
an empty list passes the type check and fails only at push time. Add the constraint that
matches your intent:

```ts
import { ArticleContentType } from './Article';
import { HeroContentType } from './Hero';

// Before: rejected by config push
const before = {
  featuredArticle: { type: 'content' },
  hero: { type: 'contentReference', allowedTypes: [] },
};

// After: one form of constraint per property
const after = {
  featuredArticle: { type: 'content', allowedTypes: [ArticleContentType] },
  hero: { type: 'contentReference', contentType: HeroContentType },
};
```

If a property really should accept a wide range of types, list what it can't hold in
`restrictedTypes` instead of leaving it open. To see the remaining violations without
uploading anything, run:

```sh
optimizely-cms-cli config push --dryRun
```

</details>

## Control what can be created under a container

`mayContainTypes` lists the content types editors can create as children of an item. It
applies to `_page`, `_experience`, `_folder` and `_component` content types:

```ts
// src/components/BlogPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';

export const BlogPageContentType = contentType({
  key: 'BlogPage',
  displayName: 'Blog page',
  baseType: '_page',
  mayContainTypes: [ArticleContentType, '_self'],
});

export const ArchiveFolderContentType = contentType({
  key: 'ArchiveFolder',
  displayName: 'Archive folder',
  baseType: '_folder',
  mayContainTypes: ['_self', 'Article'],
});
```

Each entry is a content type, `'_self'`, a content type key such as `'Article'`, or `'*'`
for any type. If you leave `mayContainTypes` out, `config push` sends `['*']`. It rejects
duplicate entries and keys that don't match a content type it is pushing.

## Render a property that holds different types

A `content` property can hold items of several types. Pass each item to
`<OptimizelyComponent>`, which renders the component registered for the item's type:

```tsx
// src/components/BlogPage.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

export const BlogPageContentType = contentType({
  key: 'BlogPage',
  displayName: 'Blog page',
  baseType: '_page',
  properties: {
    sidebar: {
      type: 'array',
      items: { type: 'content', allowedTypes: ['_component'] },
    },
  },
});

type BlogPageProps = {
  content: ContentProps<typeof BlogPageContentType>;
};

export default function BlogPage({ content }: BlogPageProps) {
  return (
    <aside>
      {content.sidebar?.map((item, index) => (
        <OptimizelyComponent key={index} content={item} />
      ))}
    </aside>
  );
}
```

To render the same type differently in different places, such as a card in a list, pass a
`tag`. See [React components](../reference/react-components.md) and
[Display templates](./display-templates.md).

## Recap

- Define a content type with `contentType()`, giving it a `key`, a `displayName`, a
  `baseType` and `properties`.
- Pick the property type by what it stores. `url` and `link` values are objects.
- Validation and editor options only affect the CMS. `indexingType: 'disabled'` also
  removes the property from what you fetch.
- Every `content` and `contentReference` property needs `allowedTypes`, `restrictedTypes`
  or, for `contentReference`, `contentType`.

## Related

- [Share properties with contracts](./contracts.md)
- [Property types reference](../reference/property-types.md)
- [Experiences](./experiences.md)
- [`optimizely.config.mjs`](../reference/optimizely-config.md)
