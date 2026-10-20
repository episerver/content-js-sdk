# Share properties with contracts

Several content types often need the same properties, such as SEO fields on every page. A
**contract** is a reusable set of properties that content types extend, so you define
those properties once.

> **You will learn**
>
> - How to create a contract
> - How to extend one or more contracts
> - Which definition wins when property names clash
> - How to accept every content type that extends a contract
> - How contracts shape the queries the SDK generates
> - How to render content that a contract-based property returns

## Create a contract

Define a contract with `contract()`. It takes a `key`, a `displayName` and `properties`,
but no `baseType`:

```ts
// src/components/contracts/SEO.ts
import { contract } from '@optimizely/cms-sdk';

export const SEOContract = contract({
  key: 'SEO',
  displayName: 'SEO properties',
  properties: {
    metaTitle: { type: 'string', displayName: 'Meta title', maxLength: 60 },
    metaDescription: {
      type: 'string',
      displayName: 'Meta description',
      maxLength: 160,
    },
    ogImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Social sharing image',
    },
  },
});
```

Properties in a contract accept the same options as properties in a content type. See
[Define content types](./content-types.md).

Export the contract from a file that the `components` patterns in
[`optimizely.config.mjs`](../reference/optimizely-config.md) match, so that `config push`
uploads it along with your content types.

## Extend a contract

Pass the contract to a content type's `extends` option. The content type gets all of the
contract's properties, in the CMS and in `ContentProps`:

```ts
// src/components/Article.tsx
import { contentType } from '@optimizely/cms-sdk';
import { SEOContract } from './contracts/SEO';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  extends: SEOContract,
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    body: { type: 'richText', displayName: 'Body' },
  },
});
```

`ContentProps<typeof ArticleContentType>` now includes `metaTitle`, `metaDescription` and
`ogImage` alongside `heading` and `body`.

You don't need to register contracts in `initContentTypeRegistry()`. The SDK adds every
contract a registered content type extends.

### Extend several contracts

Pass an array to extend more than one:

```ts
// src/components/ProductPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { SEOContract } from './contracts/SEO';
import { TrackingContract } from './contracts/Tracking';

export const ProductPageContentType = contentType({
  key: 'ProductPage',
  displayName: 'Product page',
  baseType: '_page',
  extends: [SEOContract, TrackingContract],
  properties: {
    productName: { type: 'string', displayName: 'Product name' },
    price: { type: 'float', displayName: 'Price' },
  },
});
```

A contract can't extend another contract. To combine two, extend both from the content
type.

## Decide which definition wins

When the same property name appears more than once, `contentType()` keeps one definition:

1. A property defined on the content type itself wins over any contract.
2. Between contracts, the one further right in `extends` wins.

```ts
import { contract, contentType } from '@optimizely/cms-sdk';

const BaseContract = contract({
  key: 'Base',
  displayName: 'Base',
  properties: {
    title: { type: 'string', displayName: 'Title from Base' },
    description: { type: 'string', displayName: 'Description' },
  },
});

const OverrideContract = contract({
  key: 'Override',
  displayName: 'Override',
  properties: {
    title: { type: 'string', displayName: 'Title from Override' },
  },
});

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  extends: [BaseContract, OverrideContract],
  properties: {
    title: { type: 'string', displayName: 'Page title' },
  },
});

// LandingPageContentType.properties:
// - title: "Page title" (from the content type)
// - description: "Description" (from BaseContract)
```

The winner replaces the whole property definition. Options aren't merged, so an override
must repeat every option it still needs, such as `maxLength`.

## Accept every type that extends a contract

A contract can stand in for its content types in `allowedTypes` and `restrictedTypes`.
This property accepts any content type that extends `PublishableContract`, without listing
them:

```ts
// src/components/FeedPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { PublishableContract } from './contracts/Publishable';

export const FeedPageContentType = contentType({
  key: 'FeedPage',
  displayName: 'Feed page',
  baseType: '_page',
  properties: {
    featuredItems: {
      type: 'array',
      items: { type: 'content', allowedTypes: [PublishableContract] },
      displayName: 'Featured items',
    },
  },
});
```

If `ArticleContentType` and `NewsContentType` both extend `PublishableContract`, editors
can add either. A content type you create later that extends the contract is accepted too.

## Choose what the query fetches with `expandContracts`

For a property like `featuredItems`, the SDK has to decide which fields to ask Graph for.
The `expandContracts` option controls that:

- **`false`** (default): the query asks for the contract's properties only. It stays
  small, but each item has only the contract's fields.
- **`true`**: the query includes a fragment for every content type that extends the
  contract. Each item has all of its own fields, at the cost of a larger query.

`expandContracts` shapes every query a client generates, so you set it once in `config()`.
It can't be changed per request:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: { expandContracts: true },
});
```

To get full fields for only some types while leaving `expandContracts` off, list those
types next to the contract: `allowedTypes: [PublishableContract, ArticleContentType]`. See
[`config()`](../reference/config.md) for the option itself.

## Render contract-based content

Each item still has the `__typename` of its real content type. Pass it to
`<OptimizelyComponent>`, which renders the component registered for that type:

```tsx
// src/components/FeedPage.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PublishableContract } from './contracts/Publishable';

export const FeedPageContentType = contentType({
  key: 'FeedPage',
  displayName: 'Feed page',
  baseType: '_page',
  properties: {
    featuredItems: {
      type: 'array',
      items: { type: 'content', allowedTypes: [PublishableContract] },
    },
  },
});

type FeedPageProps = {
  content: ContentProps<typeof FeedPageContentType>;
};

export default function FeedPage({ content }: FeedPageProps) {
  return (
    <ul>
      {content.featuredItems?.map((item, index) => (
        <li key={index}>
          <OptimizelyComponent content={item} tag='card' />
        </li>
      ))}
    </ul>
  );
}
```

An article renders with the `Article` component and a news item with the `News` one. The
`tag` prop picks a variant registered for that tag, such as a compact card, and falls back
to the default component. See [React components](../reference/react-components.md).

> [!WARNING]
>
> With `expandContracts` off, the `Article` component receives only the contract's
> properties here, even though its props type lists them all. Read only contract
> properties in the component you render for this list, or turn `expandContracts` on.

## Recap

- Define shared properties once with `contract()`, and add them to content types with
  `extends`.
- Properties on the content type win over contracts, and the rightmost contract wins over
  the others.
- Use a contract in `allowedTypes` to accept every content type that extends it.
- `expandContracts` decides whether those items come back with all their fields or only
  the contract's.

## Related

- [Define content types](./content-types.md)
- [Property types reference](../reference/property-types.md)
- [`config()` reference](../reference/config.md)
- [React components](../reference/react-components.md)
