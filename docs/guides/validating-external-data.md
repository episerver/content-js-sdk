# Validate external data

When you fetch content with `getClient()`, the SDK builds the query from your content
types, so the response already matches them. When the data comes from somewhere else, such
as Apollo, urql or your own `fetch` call, nothing guarantees its shape. `toSchema()` turns
a content type into a validator you can run on that data before you trust it.

> **You will learn**
>
> - When you need to validate data
> - How to validate an item with `safeParse()`
> - How to throw on invalid data with `parse()`
> - How to reject unknown fields with strict mode
> - What the validator checks

## When you need to validate data

| Where the data comes from                       | Validate it? |
| ----------------------------------------------- | ------------ |
| `getClient()` or `GraphClient` from the SDK     | No           |
| Your own GraphQL client, such as Apollo or urql | Yes          |
| A plain `fetch` call to Graph                   | Yes          |
| A cache or file you saved earlier               | Yes          |

The validator expects one content item as Graph returns it: an object with `_id`,
`__typename` and `_metadata`, plus the content type's properties. Pass it the item itself,
not the whole GraphQL response.

## Validate an item with `safeParse()`

Import `toSchema` from `@optimizely/cms-sdk/schema` and pass it a content type:

```ts
// src/lib/articles.ts
import { contentType } from '@optimizely/cms-sdk';
import { toSchema } from '@optimizely/cms-sdk/schema';

export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  displayName: 'Article',
  properties: {
    title: { type: 'string' },
    body: { type: 'richText' },
  },
});

const ArticleSchema = toSchema(ArticleContentType);

export function readArticle(item: unknown) {
  const result = ArticleSchema.safeParse(item);

  if (!result.success) {
    console.error('Invalid article', result.errors);
    return null;
  }

  return result.data; // typed as ContentProps<typeof ArticleContentType>
}
```

`safeParse()` never throws. It returns `{ success: true, data }` when the item is valid,
or `{ success: false, errors }` when it isn't. `data` is the same object you passed in,
now typed as the content type's props.

Each entry in `errors` is a `ValidationError`:

- `path` — where the problem is, as an array of keys, for example `['body', 'html']`
- `message` — a readable description, for example `Expected string, received number`
- `expected` (optional) — the expected type, for example `'string'`
- `received` (optional) — the type that was found, for example `'number'`

The validator collects every problem in one pass, so you see all of them at once.

## Throw on invalid data with `parse()`

When invalid data should stop the request, use `parse()`. It returns the typed item, or
throws a `SchemaValidationError`:

```ts
import { SchemaValidationError, toSchema } from '@optimizely/cms-sdk/schema';
import { ArticleContentType } from '@/lib/articles';

const ArticleSchema = toSchema(ArticleContentType);

export function loadArticle(item: unknown) {
  try {
    return ArticleSchema.parse(item);
  } catch (error) {
    if (error instanceof SchemaValidationError) console.error(error.errors);

    throw error;
  }
}
```

The error's `errors` property holds the same `ValidationError` list that `safeParse()`
returns, and its message lists each problem with its path.

## Reject unknown fields with strict mode

By default, the validator ignores fields the content type doesn't define, so a response
with extra fields still passes. Turn on strict mode to report them as errors:

```ts
import { toSchema } from '@optimizely/cms-sdk/schema';
import { ArticleContentType } from '@/lib/articles';

const StrictArticleSchema = toSchema(ArticleContentType, { strict: true });
```

Strict mode applies to the top level of the item. It always allows `_id`, `_metadata`,
`__typename`, `__context` and `__composition`, plus `composition` for experiences and
`key` and `nodes` for sections.

## What the validator checks

- **Required fields.** `_id` and `__typename` must be strings and `_metadata` an object.
- **Property types.** Each property must match its type. An `integer` rejects `3.14`, and
  a `dateTime` must be a string.
- **Constraints.** `minLength`, `maxLength`, `pattern`, `enum`, `minimum`, `maximum`,
  `minItems` and `maxItems` from the property definition.
- **Nested values.** Arrays item by item, the `html` and `json` of rich text, the `key` of
  a content reference, the properties of a `component` property, and the composition nodes
  of experiences and sections.

> [!WARNING]
>
> A property that is `null` or missing always passes, even if it has `isRequired: true`.
> The validator also skips properties with `indexingType: 'disabled'`, doesn't look inside
> `json` and `binary` values, and only checks that `url` and `link` values are objects.
> Check those yourself if your code depends on them.

## Recap

- You only need `toSchema()` for data the SDK didn't fetch.
- Pass it a single content item, with `_id`, `__typename` and `_metadata`.
- `safeParse()` returns a result with `data` or `errors`. `parse()` throws a
  `SchemaValidationError`.
- `{ strict: true }` rejects top-level fields the content type doesn't define.

## Related

- [Content types](./content-types.md)
- [Property types](../reference/property-types.md)
- [Fetch content](../learn/fetch-content.md)
