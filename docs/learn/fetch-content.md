# Fetch content

Your site doesn't read content from the CMS directly. It reads it from **Optimizely
Graph**, a GraphQL API that the CMS publishes content to. The SDK builds the GraphQL
queries from your content types, so you don't write them by hand.

> **You will learn**
>
> - How to get a key for Graph
> - How to configure the SDK once for the whole app
> - How to fetch a page by its URL

## Get the Graph key

1. In the CMS, go to **Settings → API Keys**.
2. Under **Render Content**, copy the **Single Key**.
3. Add it to the `.env` file in your project root:

   ```ini
   OPTIMIZELY_GRAPH_SINGLE_KEY=<your single key>
   ```

The **single key** is read-only, and it returns only published content that everyone is
allowed to see. To fetch restricted content, see
[Authentication](../guides/authentication.md).

## Configure the SDK once

Create `src/lib/optimizely.ts`. You will add to this file as the tutorial goes on:

```ts
// src/lib/optimizely.ts
import { config, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { ArticleContentType } from '@/components/Article';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
});

initContentTypeRegistry([ArticleContentType]);
```

- `config()` sets up the connection to Graph, once for the whole app.
- `initContentTypeRegistry()` tells the SDK which content types exist, so it knows which
  fields to ask Graph for.

Then import the file at the top of your root layout:

```tsx
// src/app/layout.tsx
import '@/lib/optimizely';

// …the rest of the file stays as it is
```

The root layout wraps every page, so the SDK is configured before any page fetches
content.

## Fetch a page by its URL

Create `src/app/[...slug]/page.tsx`. Your project now looks like this:

```text
src/
├── app/
│   ├── [...slug]/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   └── Article.tsx
└── lib/
    └── optimizely.ts
```

Put this in `page.tsx`:

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (content.length === 0) notFound();

  return <pre>{JSON.stringify(content[0], null, 2)}</pre>;
}
```

- `[...slug]` is a catch-all route. Every URL lands here, and `/en/` arrives as
  `slug = ['en']`.
- `getClient()` returns a client that uses the settings you passed to `config()`.
- `getContentByPath()` returns an array, because the same path can exist on more than one
  site. With a single site, take the first item.

<details>
<summary><b>Deep dive:</b> Why <code>getClient()</code> and not <code>new GraphClient()</code>?</summary>

You can construct a client yourself with `new GraphClient(apiKey, options)`, and it
behaves the same. `getClient()` saves you from passing the key and options around: you
configure them once with `config()`, and every page and component gets the same client.
You can still override options for a single call with `getClient({ ... })`. See
[`config()` and `getClient()`](../reference/config.md).

</details>

## See it in the browser

Start the dev server:

```sh
npm run dev
```

Open <http://localhost:3000/en/>. You see your article as JSON: its `heading`, its `body`
and a `_metadata` object with details such as its key, locale and URL.

If you get a 404 instead, check that **Home** is published and that its **Name in URL** is
empty, as described in [Create content](./create-content.md).

## Recap

- Your site reads published content from Optimizely Graph with the **single key**.
- Configure the SDK once in `src/lib/optimizely.ts` with `config()` and
  `initContentTypeRegistry()`, and import that file in the root layout.
- `getClient().getContentByPath(path)` fetches the content at a URL.

**Next:** [Render with React →](./render-with-react.md)
