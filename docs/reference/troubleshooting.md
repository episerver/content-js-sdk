# Troubleshooting

Common problems with the SDK and the CLI, grouped by area. Each entry starts from what you
see, explains the cause, and shows the fix. Error messages are quoted as the SDK and the
CLI print them, so you can search this page for the text you got.

- [CLI and `config push`](#cli-and-config-push)
- [Fetching content](#fetching-content)
- [Rendering](#rendering)
- [Live preview](#live-preview)
- [Forms](#forms)
- [Observability](#observability)

## CLI and `config push`

Errors about the config file itself, such as `"components" field must be an array` or
problems with `applications`, are listed in
[`optimizely.config.mjs`](./optimizely-config.md).

### `Credentials not provided`

**Cause:** `OPTIMIZELY_CMS_CLIENT_ID` or `OPTIMIZELY_CMS_CLIENT_SECRET` isn't set. The CLI
reads `.env` only from the directory you run it in.

**Fix:** Run the CLI from the folder that contains `.env`, and check that both variables
are in it:

```ini
OPTIMIZELY_CMS_CLIENT_ID=<your client id>
OPTIMIZELY_CMS_CLIENT_SECRET=<your client secret>
```

### `The client credentials are invalid`

**Cause:** The CMS rejected the client ID or secret. They may be incomplete, wrapped in
quotes or spaces, or belong to another instance.

**Fix:** Copy both values again from **Settings → API Keys**, or create a new key. Then
check with:

```sh
optimizely-cms-cli login --verbose
```

`login` prints `Your credentials are correct` when they work.

### `Something went wrong when trying to fetch token. Please try again`

**Cause:** The URL the CLI called for a token didn't answer like a CMS. Usually `--host`
or `OPTIMIZELY_CMS_API_URL` points at the wrong place. An address that doesn't resolve at
all fails with `fetch failed` instead.

**Fix:** Remove `OPTIMIZELY_CMS_API_URL` to use the default,
`https://api.cms.optimizely.com`, or set it to the API for your environment, such as
`https://api.cmstest.optimizely.com`. Include the scheme. See
[Environment variables](./cli.md#environment-variables).

### `Node is not accepting the self-signed certificates by default`

**Cause:** You are pushing to a local CMS with a self-signed certificate.

**Fix:** Add `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env`. Use it only against a local
instance, never in CI or production.

### `Configuration file not found: <path>`

**Cause:** There is no `optimizely.config.mjs` in the current directory, or the path you
passed doesn't exist.

**Fix:** Run the command from your project root, or pass the path:

```sh
optimizely-cms-cli config push ./config/optimizely.config.mjs
```

### `Invalid content type configuration (N issues found)`

**Cause:** A `content` or `contentReference` property, or an array of them, has no type
constraint, an empty `allowedTypes` or `restrictedTypes`, both `contentType` and a list,
or `contentType` on a `content` property. The CLI stops before uploading anything.

**Fix:** Give each listed property exactly one constraint:

```ts
// src/components/LandingPage.tsx
import { contentType } from '@optimizely/cms-sdk';
import { TeaserContentType } from './Teaser';

export const LandingPageContentType = contentType({
  key: 'LandingPage',
  displayName: 'Landing page',
  baseType: '_page',
  properties: {
    mainContent: { type: 'content', allowedTypes: [TeaserContentType] },
  },
});
```

Run `optimizely-cms-cli config push --dryRun` to list every remaining issue without
uploading. See [Content types](../guides/content-types.md).

### `Unknown keys in --only: <keys>`

**Cause:** A key passed to `--only` matches no content type, contract or display template
in your config. Keys are case-sensitive.

**Fix:** Use the `key` from each definition, separated by commas:
`--only Hero,LandingPage`.

### The push fails with `Use the '--force' flag to apply the changes anyway.`

**Cause:** The change can lose data, such as removing a property or changing its type, so
the CMS refused it.

**Fix:** If losing that data is acceptable, push again with `--force`. Add `--only` to
limit it to the type you changed:

```sh
optimizely-cms-cli config push --only Hero --force
```

### A content type I removed from my code is still in the CMS

**Cause:** `config push` only adds and updates types. It never deletes one.

**Fix:** Delete it with `optimizely-cms-cli content delete <key>`. See
[CLI](./cli.md#content-delete).

### `Cannot delete: Content type is in use`

**Cause:** Content of that type exists in the CMS. `config delete` and
`danger delete-all-content-types` report the same thing as
`This type cannot be deleted because content instances of this type exist.`

**Fix:** Delete the content items in the CMS first, then run the command again.

### `config pull` prints JSON instead of writing files

**Cause:** Standard output isn't a terminal, for example in CI or when the output is piped
or redirected. In that case `config pull` always prints JSON.

**Fix:** Run it in an interactive terminal to generate TypeScript files. See
[`config pull`](./cli.md#config-pull).

## Fetching content

### `The Graph client is not configured. Call config() in the application entry point.`

**Cause:** `getClient()` ran before `config()`, or `config()` runs in a module that this
code path never imports.

**Fix:** Call `config()` in a module that runs before any fetch, such as your root layout,
and import it from every entry point that fetches content. See
[Fetch content](../learn/fetch-content.md).

### `Invalid Optimizely Graph API key: key must be a non-empty string.`

**Cause:** The variable passed as `apiKey`, usually `OPTIMIZELY_GRAPH_SINGLE_KEY`, is
empty where `config()` runs.

**Fix:** Add it to your app's `.env` and restart the dev server. Call `config()` on the
server only: in most frameworks, variables without a public prefix aren't available in the
browser.

### `getContentByPath()` returns an empty array

**Cause:** No published content matches the path. Common reasons:

- The content isn't published. The single key only sees published content.
- The path doesn't match the URL in the CMS.
- `query.host` is set, and doesn't match the application's host exactly, including the
  scheme.

**Fix:** Check the URL of the page in the CMS, and that it is published. Then remove
`query.host` to rule it out. Handle the empty case so that your route returns a 404
instead of failing:

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [content] = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (!content) notFound();

  return <OptimizelyComponent content={content} />;
}
```

### I get content from the wrong site

**Cause:** Several applications in the CMS have a page at the same path, and the query
doesn't say which one to use.

**Fix:** Set `query.host` to your application's host, including the scheme:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  query: {
    host: 'https://www.example.com',
  },
});
```

You can also pass `host` to a single `getContentByPath()` call. See
[`config()`](./config.md).

### `GraphFragmentThresholdError: Fragment generation for "<type>" produced <n> inner fragments`

**Cause:** A content area accepts so many content types that the generated query would
exceed `fragment.maxThreshold`, which defaults to `100`.

**Fix:** Narrow the property with `allowedTypes` or `restrictedTypes`. If the large query
is intentional, raise the limit:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  fragment: {
    maxThreshold: 150,
  },
});
```

### `Content type "<type>" is not available in the component registry`

**Cause:** Graph returned content of a type that the SDK doesn't know, so it can't build a
query for it. Despite the wording, this is about the content type registry, not your React
components.

**Fix:** Add the content type to `initContentTypeRegistry()`. `config pull` can generate a
`registry.ts` that registers every type in the CMS. See
[Fetch content](../learn/fetch-content.md).

### ``Error when calling `fetch`. Ensure the Graph URL is correct or try again later.``

**Cause:** The SDK couldn't reach Graph. `graphUrl` is wrong, or the network is down.

**Fix:** Remove `graphUrl` to use the default, or set it to the Graph gateway for your
environment.

## Rendering

### The page shows `No component found for content type <type>`, or nothing at all

**Cause:** No React component is registered under that content type's key. In development
the SDK shows this message in place of the component. In production it renders nothing.

**Fix:** Register a component under the content type's `key`:

```tsx
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article from '@/components/Article';

initReactComponentRegistry({
  resolver: {
    Article,
  },
});
```

See [Render with React](../learn/render-with-react.md).

### `The component registry is not initialized.`

**Cause:** `<OptimizelyComponent>` ran before `initReactComponentRegistry()`.

**Fix:** Call `initReactComponentRegistry()` in your entry point, next to `config()`.

### `OptimizelyComponent requires a valid content prop. Received null or undefined.`

**Cause:** The fetch found nothing, and the empty result was passed on, for example
`content[0]` of an empty array.

**Fix:** Check the result before rendering. See
[`getContentByPath()` returns an empty array](#getcontentbypath-returns-an-empty-array).

### Rich text renders nothing

**Cause:** The component reads a representation that wasn't fetched. The SDK fetches only
`json` by default, so `html` is `undefined`.

**Fix:** Render the `json` field with `<RichText>`:

```tsx
// src/components/Article.tsx
import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    body: { type: 'richText' },
  },
});

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  return <RichText content={content.body?.json} />;
}
```

If you need the HTML string, set `fragment.richTextFormat` to `'html'` or `'both'`. See
[Rich text](../guides/rich-text.md).

## Live preview

### The preview doesn't update when an editor saves

**Cause:** One of the pieces that carry the update is missing:

- The communication injector script isn't loaded. It sends the save events from the CMS to
  your page.
- The preview route doesn't render `<PreviewComponent>` or `<NextPreviewComponent>`, which
  listen for those events.

**Fix:** Render both on your preview route. In Next.js, use `<NextPreviewComponent>`,
which refreshes the Server Components instead of reloading the page. See
[Live preview](../learn/live-preview.md).

### `Invalid URL` when the preview route loads

**Cause:** The preview route builds the communication injector URL from
`OPTIMIZELY_CMS_URL`, and that variable isn't set in your app's environment. The CLI
doesn't use this variable, so a working CLI setup doesn't mean it is set.

**Fix:** Add your CMS URL to the app's `.env` and restart the dev server:

```ini
OPTIMIZELY_CMS_URL=https://<your-instance>.cms.optimizely.com
```

### The CMS shows an error page or the wrong page in preview

**Cause:** The application's preview URL doesn't point at your preview route, or its host
doesn't match where your app runs.

**Fix:** In the CMS, open your application. On **Hostnames**, check the host, such as
`localhost:3000`. On **Live Preview**, enable **Use Preview Tokens** and point the preview
URL at your route, such as `http://localhost:3000/preview`. If the config file creates the
application, set `previewUrlFormats` there instead. See
[`optimizely.config.mjs`](./optimizely-config.md).

### `Content with key '<key>' could not be found. Verify it exists in the CMS.`

**Cause:** `getPreviewContent()` couldn't find the version the CMS asked for. Usually the
preview URL carries no `preview_token`, so drafts aren't visible, or the app's Graph key
belongs to another instance.

**Fix:** Enable **Use Preview Tokens** on the application, and check that the app's
`OPTIMIZELY_GRAPH_SINGLE_KEY` comes from the same CMS.

### Click-to-edit outlines don't appear

**Cause:** `pa()` adds the editing attributes only to content fetched with
`getPreviewContent()` while the CMS is in edit mode. Content fetched any other way, or
viewed in preview mode, gets none.

**Fix:** Fetch the page on your preview route with `getPreviewContent()`, and pass the
`content` your component received to `getPreviewUtils()`. See
[Live preview](../learn/live-preview.md).

## Forms

Forms have their own troubleshooting table, covering fields that don't render, validation
and rules that never fire, and submissions that fail. See [Forms](../guides/forms.md).

## Observability

### No spans appear

**Cause:** No OpenTelemetry SDK is registered. The SDK depends only on
`@opentelemetry/api`, so its spans do nothing until your app starts a tracer provider and
an exporter.

**Fix:** Start the OpenTelemetry SDK before your app serves requests, for example in
Next.js's `instrumentation.ts`, and check that its exporter points where you are looking.
See [Observability](../guides/observability.md).

### Some requests have no `optimizely.query.create` or `optimizely.fragment.create` spans

**Cause:** This is expected. The SDK caches generated queries and fragments, and emits
these spans only when it generates them, not when it reuses a cached one.

**Fix:** None needed. To track cache use, add your own spans around the calls.

### ``Next.js encountered the unstable value `Date.now()` while prerendering``

The page returns a 500, and the log also shows `NEXT_STATIC_GEN_BAILOUT`, with
`getComponent` in the stack.

**Cause:** Next.js `cacheComponents` is on and an OpenTelemetry meter provider is
registered. `OptimizelyComponent` records the `optimizely.component.*` metrics while
Next.js prerenders the static shell, and the OpenTelemetry metrics SDK reads `Date.now()`
for each measurement, which aborts the prerender.

**Fix:** Turn the component metrics off with
`config({ …, telemetry: { componentMetrics: false } })`. See
[Observability](../guides/observability.md#turn-off-component-metrics-for-nextjs-cache-components).
