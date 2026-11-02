# React components

The components and functions that render CMS content with React. They are split across
entry points, because some run only on the server and some only in the browser.

| Entry point                          | Exports                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@optimizely/cms-sdk/react/server`   | `initReactComponentRegistry`, `OptimizelyComponent`, `OptimizelyComposition`, `OptimizelyGridSection`, `getPreviewUtils`, `withAppContext`, the context functions, `initForms` |
| `@optimizely/cms-sdk/react/client`   | `PreviewComponent`                                                                                                                                                             |
| `@optimizely/cms-sdk/react/nextjs`   | `NextPreviewComponent`                                                                                                                                                         |
| `@optimizely/cms-sdk/react/richText` | `RichText` and its helpers. See [RichText](./rich-text-component.md)                                                                                                           |
| `@optimizely/cms-sdk/forms/react`    | Components and hooks for Optimizely Forms. See [Forms](../guides/forms.md)                                                                                                     |

## initReactComponentRegistry

```ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
```

Tells the SDK which React component renders each content type.

```ts
initReactComponentRegistry({ resolver });
```

### Reference

#### Parameters

- `resolver` — either an object or a function:
  - **An object** whose keys are content type keys. Each value is one of:
    - a component;
    - `{ default?: Component, tags: Record<string, Component> }`, a default component plus
      variants keyed by [display template](../guides/display-templates.md) tag.

    A key can also take the form `'ContentTypeKey:tag'` to register a variant on its own.
    The keys `_Row` and `_Column` register the default row and column components for
    `OptimizelyGridSection`.

  - **A function**
    `(contentType: string, options?: { tag?: string }) => Component | undefined`, called
    on every lookup. Return `undefined` when you have no component.

#### Returns

`void`.

#### Caveats

- With an object, a lookup for content type `T` and tag `t` tries these in order:
  1. The key `'T:t'`.
  2. `t` in the `tags` of key `T`.
  3. The default of key `T`: the component itself, or `default`.
- A type name ending in `Property`, such as `HeroProperty`, falls back to the key without
  the suffix, `Hero`. This applies only to the object form.
- Each call replaces the previous registry. Register everything in one call.
- Call it once, in a module that runs before any page renders, such as the root layout.
- Components for Optimizely Forms live in a registry of their own, filled by
  [`initForms`](#initforms). You can call the two in either order.

### Usage

#### Registering components

```tsx
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article from '@/components/Article';
import Tile, { SquareTile } from '@/components/Tile';
import TeaserCard from '@/components/TeaserCard';

initReactComponentRegistry({
  resolver: {
    Article,
    'Article:Teaser': TeaserCard,
    Tile: { default: Tile, tags: { Square: SquareTile } },
  },
});
```

#### Resolving components with a function

```tsx
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Article from '@/components/Article';
import TeaserCard from '@/components/TeaserCard';

initReactComponentRegistry({
  resolver: (contentType, options) => {
    if (contentType === 'Article')
      return options?.tag === 'Teaser' ? TeaserCard : Article;
    return undefined;
  },
});
```

## OptimizelyComponent

```ts
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
```

Renders a content item with the component registered for its content type.

```tsx
<OptimizelyComponent content={content} displaySettings={displaySettings} tag={tag} />
```

### Reference

#### Props

- `content` — a content item fetched with the SDK. It must have a `__typename`.
- `displaySettings` (optional) — `Record<string, string | boolean>`, passed on to your
  component.
- `tag` (optional) — the tag to look up, overriding the tag of the content's display
  template.
- `data-epi-*` attributes (optional) — in edit mode, the component is wrapped in a `<div>`
  that carries them. Outside edit mode they are dropped.

Your component receives `content` and `displaySettings` as props.

#### Returns

A promise of a React element. `OptimizelyComponent` is an async Server Component.

#### Caveats

- **Server Components only.** It is async, so a Client Component can't render it.
- The tag comes from the `tag` prop, then from the content's display template. The
  template is read from `_metadata.displayOption`, then from the composition node's
  `displayTemplateKey`. The display template must be registered with
  `initDisplayTemplateRegistry` for its tag to be found.
- The lookup tries each type in `content._metadata.types` in order, then
  `content.__typename`. See [`initReactComponentRegistry`](#initreactcomponentregistry)
  for how each type is matched.
- When no component matches, it renders a box reading **No component found for content
  type `T`** if `NODE_ENV` is `development`, and nothing otherwise.
- It throws if `content` is `null` or `undefined`, and if neither
  `initReactComponentRegistry` nor `initForms` has been called.

### Usage

#### Rendering a page

```tsx
// src/app/[...slug]/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [content] = await getClient().getContentByPath(`/${slug.join('/')}/`);

  if (!content) notFound();

  return <OptimizelyComponent content={content} />;
}
```

#### Rendering a list with a variant component

Pass `tag` to render the same content type differently in one place, such as a card in a
list. With `'Article:Teaser'` registered, the articles render with `TeaserCard`:

```tsx
// src/components/ArticleList.tsx
import { ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { ArticleContentType } from './Article';

type Props = {
  articles: ContentProps<typeof ArticleContentType>[];
};

export function ArticleList({ articles }: Props) {
  return articles.map(article => (
    <OptimizelyComponent key={article._metadata.key} content={article} tag='Teaser' />
  ));
}
```

## OptimizelyComposition

```ts
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';
```

Renders the top level of an experience's composition: its sections and section-enabled
components.

```tsx
<OptimizelyComposition nodes={nodes} ComponentWrapper={ComponentWrapper} />
```

### Reference

#### Props

- `nodes` — the composition nodes, usually `content.composition.nodes ?? []`.
- `ComponentWrapper` (optional) — a component that receives
  [`ComponentContainerProps`](#structurecontainerprops-and-componentcontainerprops) and
  wraps each component node.

#### Returns

An array of React elements.

#### Caveats

- Each node renders through `OptimizelyComponent`, with the node's display settings and
  the tag of its display template.
- Component nodes are wrapped. The default wrapper is a `<div>` with the node's preview
  attributes and `width: 100%; display: block`.
- A custom `ComponentWrapper` replaces the default one, preview attributes included.
  Spread `pa(node)` onto it yourself.
- Section nodes are not wrapped. They render as content, and the section's component
  receives the node's `key` and `nodes`, so it can render its grid.
- `composition.nodes` is optional in the type, so pass a fallback such as `[]`.

### Usage

#### Rendering an experience

```tsx
// src/components/BlankExperience.tsx
import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

export default function BlankExperience({ content }: Props) {
  return (
    <main>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </main>
  );
}
```

See [Experiences](../guides/experiences.md) for custom wrappers and mixing in the
experience's own properties.

## OptimizelyGridSection

```ts
import { OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
```

Renders the rows, columns and elements inside a section.

```tsx
<OptimizelyGridSection
  nodes={nodes}
  row={Row}
  column={Column}
  ComponentWrapper={Wrapper}
/>
```

### Reference

#### Props

- `nodes` — the section's nodes, `content.nodes`.
- `row` (optional) — a component that receives
  [`StructureContainerProps`](#structurecontainerprops-and-componentcontainerprops) and
  renders each row.
- `column` (optional) — the same, for each column.
- `ComponentWrapper` (optional) — a component that receives `ComponentContainerProps` and
  wraps each element.

#### Returns

An array of React elements.

#### Caveats

- A row or column renders with the `row` or `column` prop, then with the component
  registered as `_Row` or `_Column`, then with a built-in fallback. The fallback row is a
  flex `<div>` with a `1rem` gap, and the fallback column a `<div>` with `flex: 1`.
- Registered `_Row` and `_Column` components are looked up with the tag of the node's
  display template, so `'_Row:tag'` works.
- Structure nodes other than rows and columns render their children with no container.
- Without a `ComponentWrapper`, an element carries its preview attributes on a `<div>` in
  edit mode. With one, the wrapper is responsible for them.
- A row or column receives its contents as a single child, so containers that use
  `Children.only` or `cloneElement` keep working.

### Usage

#### Rendering a section

```tsx
// src/components/BlankSection.tsx
import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  getPreviewUtils,
  OptimizelyGridSection,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankSectionContentType>;
};

function Row({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);

  return (
    <div className='row' {...pa(node)}>
      {children}
    </div>
  );
}

export default function BlankSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section {...pa(content)}>
      <OptimizelyGridSection nodes={content.nodes} row={Row} />
    </section>
  );
}
```

## StructureContainerProps and ComponentContainerProps

```ts
import type {
  ComponentContainerProps,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';
```

The props of the `row`, `column` and `ComponentWrapper` components.

```ts
type StructureContainerProps = {
  node: ExperienceStructureNode;
  children: React.ReactNode;
  index?: number;
  displaySettings?: Record<string, string | boolean>;
};

type ComponentContainerProps = {
  node: ExperienceComponentNode;
  children: React.ReactNode;
  displaySettings?: Record<string, string | boolean>;
};
```

### Reference

#### Fields

- `node` — the composition node. Pass it to `pa()` for its preview attributes. It also has
  `key`, `displayName`, `displayTemplateKey` and the raw `displaySettings`.
- `children` — the rendered contents.
- `index` — the node's position among its siblings.
- `displaySettings` — the node's display settings, with `'true'` and `'false'` converted
  to booleans. `undefined` when the node has none.

The component types themselves are exported as `StructureContainer` and
`ComponentContainer`.

## getPreviewUtils

```ts
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
```

Returns helpers that add Visual Builder and preview support to the markup of a content
item.

```ts
const { pa, src } = getPreviewUtils(content);
```

### Reference

#### Parameters

- `content` — a content item, or a composition node.

#### Returns

An object with two functions:

- `pa(property?)` — returns the attributes that make an element selectable in edit mode.
  Spread the result onto the element.
  - With a property name string, returns `{ 'data-epi-edit': property }`.
  - With an object that has a `key`, such as a composition node or a section, returns
    `{ 'data-epi-block-id': key }`.
  - Returns `{}` outside edit mode or without an argument.
- `src(reference)` — returns the URL of an image. It accepts a content reference or a URL
  string and returns `string | undefined`. The URL carries the `preview_token` query
  parameter only when the preview was fetched with `getPreviewContent(params, { forceMediaToken: true })`.
  Otherwise, [`PreviewComponent`](#previewcomponent) adds the token to images that fail to
  load.

#### Caveats

- Edit mode and the media token come from `content.__context`, which
  `getPreviewContent()` adds to every item it returns. Content fetched any other way gets
  no attributes and no token.
- `pa()` doesn't check the property name. Use the key from the content type definition.

### Usage

#### Making properties editable

```tsx
// src/components/Hero.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const HeroContentType = contentType({
  key: 'Hero',
  displayName: 'Hero',
  baseType: '_component',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    image: { type: 'contentReference', displayName: 'Image', allowedTypes: ['_image'] },
  },
});

type Props = {
  content: ContentProps<typeof HeroContentType>;
};

export default function Hero({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);

  return (
    <section>
      <h1 {...pa('heading')}>{content.heading}</h1>
      <img {...pa('image')} src={src(content.image)} alt='' />
    </section>
  );
}
```

## PreviewComponent

```ts
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
```

Refreshes the preview when an editor saves content in the CMS. Use it on your preview
route. In Next.js, use [`NextPreviewComponent`](#nextpreviewcomponent) instead.

```tsx
<PreviewComponent onNavigate={onNavigate} refreshTimeout={50}>
  {loadingIndicator}
</PreviewComponent>
```

### Reference

#### Props

- `onNavigate` (optional) — `(url: string, isSameUrl: boolean) => void | Promise<void>`.
  Called with the preview URL of the saved content. `isSameUrl` is `true` when it is the
  current page, so you can refresh instead of navigating. Without it, the page reloads
  with `window.location.replace(url)`.
- `refreshTimeout` (optional) — milliseconds to wait, once the CMS reports a save as
  ready, before navigating. Saves that finish within the delay merge into one refresh.
  `false` navigates immediately. Default: `50`.
- `children` (optional) — shown while a refresh is pending, such as a loading indicator.
- `busy` (optional) — keeps `children` visible while `true`. Use it when your router's
  refresh returns before the new content has arrived. Default: `false`.
- `cmsUrl` (optional) — the CMS URL, usually `OPTIMIZELY_CMS_URL`. Only media on this host
  gets the preview token when it fails to load. Default: the host the communication
  injector script loads from.

#### Returns

`children` while a refresh is pending or `busy` is `true`, otherwise nothing.

#### Caveats

- It listens for the `optimizely:cms:contentSaved` event, which the CMS communication
  script dispatches. Load that script on the preview route. See
  [Live preview](../learn/live-preview.md).
- The CMS sends two events per save: one with the editor's preview token, then one when
  the change is ready to fetch. The page refreshes once, on the second, with the first
  one's URL and token. If either never arrives, it refreshes after 5 seconds anyway.
- It is a Client Component, but you can render it from a Server Component.
- When `onNavigate` returns a promise, `children` stay visible until it settles.
- **It loads unpublished media.** Media URLs are rendered without the preview token, so
  they don't change between saves. When an image or video on the CMS host fails to load,
  it loads it again with the editor's token from the latest save, or from the page URL
  before the first save. Without a known CMS host, nothing is retried.

### Usage

#### Refreshing with a custom router

```tsx
// src/app/preview/PreviewRefresher.tsx
'use client';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import { useRouter } from 'next/navigation';

export function PreviewRefresher() {
  const router = useRouter();

  return (
    <PreviewComponent
      onNavigate={(url, isSameUrl) => {
        if (isSameUrl) return router.refresh();
        const { pathname, search } = new URL(url);
        router.push(pathname + search);
      }}
    >
      <p>Updating…</p>
    </PreviewComponent>
  );
}
```

The exported `NavigateCallback` type describes `onNavigate`, and `PreviewComponentProps`
the props.

## NextPreviewComponent

```ts
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
```

A `PreviewComponent` wired to the Next.js App Router.

```tsx
<NextPreviewComponent refreshTimeout={50}>{loadingIndicator}</NextPreviewComponent>
```

### Reference

#### Props

- `refreshTimeout` (optional) — as in `PreviewComponent`. Default: `50`.
- `children` (optional) — shown while a refresh is pending.
- `cmsUrl` (optional) — as in `PreviewComponent`. Pass `process.env.OPTIMIZELY_CMS_URL`.

#### Returns

`children` while a refresh is pending, otherwise nothing.

#### Caveats

- When the saved content is on the current page, it calls `router.refresh()`, which
  re-renders the Server Components without a full reload. Otherwise it calls
  `router.push()` with the new path and `scroll: false`.
- Both run in a transition, and `children` stay visible until the new content has arrived.
- It imports `next/navigation`, so it works only in Next.js.

### Usage

#### Adding it to the preview route

```tsx
// src/app/preview/page.tsx
import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
import Script from 'next/script';

type Props = {
  searchParams: Promise<PreviewParams>;
};

export default async function PreviewPage({ searchParams }: Props) {
  const content = await getClient().getPreviewContent(await searchParams);

  return (
    <>
      <Script
        src={new URL(
          '/util/javascript/communicationinjector.js',
          process.env.OPTIMIZELY_CMS_URL,
        ).toString()}
      />
      <NextPreviewComponent cmsUrl={process.env.OPTIMIZELY_CMS_URL} />
      <OptimizelyComponent content={content} />
    </>
  );
}
```

## withAppContext

```ts
import { withAppContext } from '@optimizely/cms-sdk/react/server';
```

Wraps a page component so that it starts every request with empty request context.

```ts
export default withAppContext(Page);
```

### Reference

#### Parameters

- `Component` — the page component to wrap.

#### Returns

An async component that clears the request context, then renders `Component` with the same
props.

#### Caveats

- Context is already scoped to the request through `React.cache()`. The wrapper only
  guarantees that it starts empty.
- `getPreviewContent()` fills the context whether or not the page is wrapped.

See [Request context](../guides/request-context.md) for when to use it.

## getContext, setContext, getContextData, setContextData

```ts
import {
  getContext,
  getContextData,
  setContext,
  setContextData,
} from '@optimizely/cms-sdk/react/server';
```

Read and write data scoped to the current request, so that nested components can use it
without props.

```ts
declare function getContext(): ContextData | undefined;
declare function setContext(value: Partial<ContextData>): void;
declare function getContextData<K extends keyof ContextData>(
  key: K,
): ContextData[K] | undefined;
declare function setContextData<K extends keyof ContextData>(
  key: K,
  value: ContextData[K],
): void;
```

### Reference

#### `ContextData`

| Field            | Type      | Set by `getPreviewContent()` from      |
| ---------------- | --------- | -------------------------------------- |
| `previewToken`   | `string`  | The `preview_token` parameter          |
| `mediaToken`     | `string`  | `preview_token` with `forceMediaToken` |
| `version`        | `string`  | The `ver` parameter                    |
| `locale`         | `string`  | The `loc` parameter                    |
| `key`            | `string`  | The `key` parameter                    |
| `mode`           | `string`  | The `ctx` parameter                    |
| `type`           | `string`  | The content type of the item           |
| `currentContent` | `unknown` | Not set. Yours to use                  |

Every field is optional.

#### Caveats

- `setContext()` merges into the existing data. `setContextData()` sets one field.
- The data lives in `React.cache()`, so it is shared only within one request, in Server
  Components. Client Components don't see it.
- `RichText` adds `mediaToken` to image URLs. It is set only with `forceMediaToken`.

### Usage

#### Showing a banner in preview

```tsx
// src/components/PreviewBanner.tsx
import { getContextData } from '@optimizely/cms-sdk/react/server';

export function PreviewBanner() {
  const previewToken = getContextData('previewToken');
  const locale = getContextData('locale');

  if (!previewToken) return null;

  return <div className='preview-banner'>Preview: {locale ?? 'default locale'}</div>;
}
```

See [Request context](../guides/request-context.md) for more.

## configureAdapter, getAdapter, ReactContextAdapter

```ts
import {
  configureAdapter,
  getAdapter,
  ReactContextAdapter,
} from '@optimizely/cms-sdk/react/server';
```

Control where the context functions store their data.

### Reference

- `configureAdapter(adapter)` — sets the storage. `adapter` implements the exported
  `ContextAdapter` interface: `initializeContext`, `getData`, `setData`, `get`, `set` and
  an optional `clear`.
- `getAdapter()` — returns the current storage. Throws if none is configured.
- `ReactContextAdapter` — the default storage, built on `React.cache()`.

#### Caveats

- Importing `@optimizely/cms-sdk/react/server` configures `ReactContextAdapter`, unless
  you called `configureAdapter()` first.

## initForms

```ts
import { initForms } from '@optimizely/cms-sdk/react/server';
```

Registers the Optimizely Forms content types and the components that render them.

```ts
initForms(handlers);
```

### Reference

#### Parameters

- `handlers` — an object with any of the keys `container`, `textbox`, `textarea`,
  `number`, `range`, `url`, `choice`, `selection`, `submit` and `reset`. Each value is a
  component, or `{ default?, tags }` as in `initReactComponentRegistry`.

#### Returns

`void`.

#### Caveats

- It adds the Forms content types to the content type registry for you.
- The components go into a registry of their own, so `initForms` and
  `initReactComponentRegistry` can be called in either order. Your own registry is
  searched first.
- Calling it again adds to the earlier handlers rather than replacing them.

See [Forms](../guides/forms.md) for the components to write.

## Troubleshooting

### `The component registry is not initialized`

`OptimizelyComponent` ran before `initReactComponentRegistry`. Call it in a module that
every page imports, such as the root layout.

### I see "No component found for content type `T`"

Nothing is registered under the key `T`. Check that the resolver key matches the content
type's `key` exactly, including case.

### `OptimizelyComponent requires a valid content prop`

`content` is `null` or `undefined`, usually because the fetch found nothing. Check the
result before rendering it.

### `Context adapter not configured`

A context function ran before anything imported `@optimizely/cms-sdk/react/server`. Import
from that entry point, or call `configureAdapter()` first.
