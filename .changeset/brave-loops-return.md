---
'@optimizely/cms-sdk': patch
---

[CMS-49490](https://optimizely-ext.atlassian.net/browse/CMS-49490): Return nested content for self-referencing content types

A content type that can contain itself, directly or through another type, came back with its
nested items empty: they had a `__typename` and no other fields. The generated query left out
the fragment spread wherever a type referred back to itself, and because each fragment is
shared across the query, the data went missing everywhere that type appeared — not only at the
point where it looped.

```ts
const Category = contentType({
  key: 'Category',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    children: { type: 'array', items: { type: 'content', allowedTypes: ['_self'] } },
  },
});

const category = await client.getContent({ key });

category.children?.[0]?.title; // previously undefined
```

Queries now include the spread again, as they did in 2.x, producing cyclic fragments.
Optimizely Graph
[supports these](https://docs.optimizely.com/graph/docs/recursive-queries#circular-referenced-queries-cyclic-fragments)
and resolves them as deep as the content goes, stopping when an item repeats.

Cyclic fragments are not valid under the strict GraphQL specification, so tools that validate
queries, such as graphql-js, reject them. This does not affect the SDK's own client, which
sends queries without validating them.
