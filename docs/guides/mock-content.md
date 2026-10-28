# Fill previews with mock content

A component preview renders one component on a page of its own, before any editor has
created content for it. **Mock content** is what fills it: values derived from the content
type's own properties, so a `richText` property becomes a rich text document and a
reference to an image becomes something an `<img>` can show.

The shape always comes from your schema. What the text *says* is up to you, and that is
what `mockData` controls.

> **You will learn**
>
> - How to declare a property's own stand-in content with `mock`
> - What `mockData` accepts
> - How to supply realistic copy with faker
> - How to pin specific values per content type
> - How to build content with a factory
> - How to write your own data source

`createStandalonePreview` needs React Server Components. It returns an async server
component, and reports its size from a client component, so your framework has to render
async components on the server and understand `'use client'`. Next's App Router does; its
Pages Router and plain client-side React do not. Nothing in it imports Next itself.

## Declare it on the property

The shortest way to say what a preview shows is to write it beside the property it fills:

```ts
export const HeadingComponent = contentType({
  key: 'HeadingElement',
  baseType: '_component',
  displayName: 'Heading',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      mock: 'Built for the long run',
    },
  },
});
```

Nothing else to wire, and nothing to keep in sync: rename the property and the mock moves
with it.

- **Typed to the property.** A `string` property takes a string, a `boolean` takes a
  boolean, an `integer` takes a number. The wrong type is a compile error.
- **Never reaches the CMS.** `config push` strips `mock` before sending the content type,
  so it stays out of your content model.
- **Applies wherever the type appears.** A mock on `Author` fills it inside a
  `TeaserCard`, not only when `Author` is previewed on its own.
- **Rich text takes a string.** It becomes a one-paragraph document, exactly as written,
  rather than the padded placeholder a generated paragraph gets.

Pass a function when a fixed value is too dull, or when the value has to be computed:

```ts
properties: {
  published: { type: 'dateTime', mock: () => new Date().toISOString() },
}
```

A property with no `mock` is still generated from the schema, so partial coverage is
fine — mock the fields that matter and leave the rest.

The rest of this page is what fills everything else. They stack, most specific last:

```text
the schema          every property gets something
  ↓ replaced by
faker               realistic text, for properties with no mock
  ↓ replaced by
mock                what a property says about itself
  ↓ replaced by
mockData            what the preview page passes
```

## Preview without any mock data

Pass nothing and every property names itself:

```tsx
// app/preview/component/page.tsx
import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';

export default createStandalonePreview({ defaultLocale: 'en' });
```

A `Headline` property reads "Headline". That tells you which field is which, but it shows
you nothing about how real copy wraps, so the layout you see is not the layout you ship.

## Use faker for realistic copy

Install [`@faker-js/faker`](https://fakerjs.dev) and pass it in:

```tsx
import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';
import { faker } from '@faker-js/faker';

export default createStandalonePreview({ defaultLocale: 'en', mockData: faker });
```

Faker is never imported by the SDK. You pass it, so it loads only in the module that
serves the preview and never reaches your own pages.

Text is chosen from what each property is called:

| Property name contains        | What you get           |
| ----------------------------- | ---------------------- |
| `mail`                        | An email address       |
| `url`, `href`, `link`, `slug`, `website`, `domain` | A URL |
| `price`, `amount`, `cost`, `total` | A price           |
| `author`, `person`, `customer`, `name` | A person's name |
| `body`, `description`, `summary`, `intro`, `excerpt`, `content`, `text` | A paragraph |
| `title`, `heading`, `headline`, `label`, `caption`, `cta`, `button`, `eyebrow` | A short product-like phrase |
| anything else                 | Three words            |

A `string` property with a `maxLength` above 120 gets a paragraph whatever it is called,
since a field that long is meant for sentences.

Faker is seeded from the content type's key, so a component looks the same on every
reload. A preview that reshuffles its text each time you refresh is hard to compare
against a design.

## Override from the preview page

A `mock` on the property is where values belong. Pass them to the page instead when they
are not the component's to decide — overriding what a shared component library declares,
or standing up one preview with particular content:

```tsx
export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: {
    HeroSection: { Headline: 'Set it. Sweat it. Send it.' },
    PriceTable: { Currency: 'SEK' },
  },
});
```

The merge is shallow, so a field is either yours or generated, never half of each.
Overrides apply wherever that content type appears, including nested inside another
component, and they win over a `mock` written on the property.

## Build content with a factory

Pass a function for full control. It receives the content type and what the schema
produced, so you can add to it, replace it, or hand it straight back:

```tsx
export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: (contentType, generated) => {
    if (contentType.key === 'ProductCard') {
      return { ...generated, Price: '249.00', Currency: 'USD' };
    }

    return generated; // or `undefined`, which means the same
  },
});
```

The factory runs for every content type the preview builds, nested ones included.

## Write your own data source

`mockData` recognises a text source **by shape, not by identity**. Anything with the
methods below is accepted, so a product catalogue, a fixtures file or an internal content
API can fill previews with no faker dependency at all.

### The contract

```ts
type FakerLike = {
  seed(value: number): unknown;
  lorem: { words(count?: number): string; paragraph(): string };
  person: { fullName(): string };
  internet: { email(): string; url(): string };
  commerce: { productName(): string; price(): string };
  number: { int(options: { min: number; max: number }): number };
  date: { past(options: { refDate: string }): Date };
};
```

Every member is required. Which one is called depends on what the property is named:

| Called for | Member |
| ---------- | ------ |
| A name containing `mail` | `internet.email()` |
| `url`, `href`, `link`, `slug`, `website`, `domain` | `internet.url()` |
| `price`, `amount`, `cost`, `total` | `commerce.price()` |
| `author`, `person`, `customer`, `name` | `person.fullName()` |
| `body`, `description`, `summary`, … , or any string over 120 characters | `lorem.paragraph()` |
| `title`, `heading`, `headline`, `label`, `caption`, `cta`, `button`, `eyebrow` | `commerce.productName()` |
| Any other string, and rich text | `lorem.words(3)` |
| `integer` and `float` without a `minimum` | `number.int({ min, max })` |
| `dateTime` | `date.past({ refDate })` |

### A worked example

This source reads from a list of real products. `seed()` picks which one, so each content
type gets a different product and keeps it:

```ts
import type { FakerLike } from '@optimizely/cms-sdk';

const products = [
  {
    title: 'Trail Runner 2',
    tags: ['trail', 'lightweight', 'waterproof'],
    description: 'A lightweight shoe for wet ground and long days.',
    price: '149.00',
    reviewer: 'Ada Lovelace',
    contact: 'reviews@example.com',
    permalink: 'https://example.com/trail-runner-2',
    stock: 42,
    releasedAt: '2024-03-01T09:00:00Z',
  },
  // …more products
];

/** Which product this content type is showing. Set by `seed`. */
let current = products[0];

const catalogue: FakerLike = {
  // Called once per content type, before anything else, with a number derived
  // from its key. The same key always produces the same number.
  seed(value) {
    current = products[value % products.length];
  },

  lorem: {
    words: (count = 3) => current.tags.slice(0, count).join(' '),
    paragraph: () => current.description,
  },
  person: { fullName: () => current.reviewer },
  internet: {
    email: () => current.contact,
    url: () => current.permalink,
  },
  commerce: {
    productName: () => current.title,
    price: () => current.price,
  },
  number: {
    int: ({ min, max }) => Math.min(Math.max(current.stock, min), max),
  },
  date: { past: () => new Date(current.releasedAt) },
};
```

Then pass it where you would have passed faker:

```tsx
export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: catalogue,
});
```

### Two rules that keep previews stable

- **Be deterministic.** `seed()` runs once per content type with a number derived from its
  key. Return the same values for the same seed and a component looks identical on every
  reload, which is what makes a preview worth comparing against a design.
- **Never read the clock.** `date.past()` is handed a `refDate` for exactly this reason.
  Returning `new Date()` makes the content change every second.

Respect `min` and `max` in `number.int` — they come from the property's own `minimum` and
`maximum`, and a value outside them is not content the CMS would accept.

### When a text source is not enough

A source is asked only for *text of a kind*. It is not told which content type or which
property it is filling, so it cannot answer "the headline for a hero" differently from
"the headline for a card".

When you need that, use a factory. It receives the content type, so you can look values up
per field, and calling `generateMockContent` inside it keeps the schema-shaped base:

```tsx
import { createStandalonePreview } from '@optimizely/cms-sdk/react/standalone';
import { generateMockContent } from '@optimizely/cms-sdk';

const byField: Record<string, Record<string, unknown>> = {
  HeadingElement: { heading: 'Set it. Sweat it. Send it.' },
  ButtonElement: { label: 'Shop now' },
};

export default createStandalonePreview({
  defaultLocale: 'en',
  mockData: contentType => ({
    // The generated base, with your source filling the text…
    ...generateMockContent(contentType, { mockData: catalogue }),
    // …and specific fields pinned on top.
    ...byField[contentType.key],
  }),
});
```

The inner call uses the source rather than the factory, so there is no recursion. This is
also how you combine a source with pinned values: `mockData` takes one of the three
shapes, not several, so the factory is where they meet.

## Generate content without a preview page

`generateMockContent()` is exported on its own, for a visual test, a screenshot job, or a
storybook-style tool:

```ts
import { generateMockContent } from '@optimizely/cms-sdk';
import { faker } from '@faker-js/faker';
import { HeroSection } from '../components/Hero';

const content = generateMockContent(HeroSection, { mockData: faker });
```

It returns content shaped the way Graph returns it, so `OptimizelyComponent` renders it
with no CMS round trip.

## What is generated for each property type

| Property type      | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `string`           | Text, chosen as described above                               |
| `richText`         | A rich text document with one paragraph                       |
| `url`              | A content URL pointing at `/example`                          |
| `link`             | Text, title, target and a content URL                         |
| `contentReference` | A reference; media references point at an inline placeholder image |
| `content`          | The first allowed type, generated in turn                     |
| `component`        | The nested content type, generated in turn                    |
| `array`            | Two items, or `minItems`, capped at `maxItems`                |
| `integer`, `float` | `minimum` when set, otherwise a number within `maximum`        |
| `dateTime`         | A fixed instant, so it never changes between renders          |
| `boolean`          | `true`                                                         |
| `json`             | `{}`                                                           |
| An `enum`          | The first value, whatever the type                             |

Nested components and references are followed three levels deep, then left `null`. A
section or experience gets an empty composition: which components an editor would place
inside it is a guess, so the container renders its own chrome and nothing else.

**Related:**

- [Component previews](./component-previews.md): the page this content is rendered on
- [Content types](./content-types.md): the schema the stand-in content is built from
