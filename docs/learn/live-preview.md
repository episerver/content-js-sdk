# Live preview

Editors want to see a change on the real site before they publish it. With **live
preview**, the CMS shows your site next to the editing form and updates it every time the
editor saves. On this page you add a preview route, connect it to the CMS, and make the
page's fields clickable.

> **You will learn**
>
> - How live preview works
> - How to add a preview route
> - How to point the CMS at it
> - How to let editors click a field on the page to edit it

## How live preview works

1. An editor opens a page in the CMS.
2. The CMS loads your site's preview route in a frame, with the content's key, version and
   locale and a short-lived **preview token** in the query string.
3. Your preview route uses the token to fetch that exact draft version and renders it.
4. When the editor saves, the CMS tells the page, and the page refreshes with the new
   draft.

## Add the CMS URL to `.env`

The preview page loads a script from your CMS, so it needs the CMS address. Add it to
`.env`, without a trailing slash:

```ini
OPTIMIZELY_CMS_URL=https://<your-instance>.cms.optimizely.com
```

## Create the preview route

Create `src/app/preview/page.tsx`:

```tsx
// src/app/preview/page.tsx
import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent, withAppContext } from '@optimizely/cms-sdk/react/server';
import { NextPreviewComponent } from '@optimizely/cms-sdk/react/nextjs';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function Page({ searchParams }: Props) {
  const content = await getClient().getPreviewContent(
    (await searchParams) as PreviewParams,
  );

  return (
    <>
      <Script
        src={
          new URL(
            '/util/javascript/communicationinjector.js',
            process.env.OPTIMIZELY_CMS_URL,
          ).href
        }
      />
      <NextPreviewComponent cmsUrl={process.env.OPTIMIZELY_CMS_URL} />
      <OptimizelyComponent content={content} />
    </>
  );
}

export default withAppContext(Page);
```

Four pieces work together here:

- **`getPreviewContent()`** reads the key, version, locale and preview token from the
  query string and fetches that draft.
- **The communication injector script** comes from your CMS and lets the page and the
  editor talk to each other.
- **`<NextPreviewComponent />`** listens for saves and refreshes the page without a full
  reload. It also loads unpublished images, as described in
  [Images and videos in preview](#images-and-videos-in-preview).
- **`withAppContext`** starts the page with an empty request context.
  `getPreviewContent()` stores the preview token and locale there, so components further
  down, such as `<RichText>`, can use them without props. See
  [Request context](../guides/request-context.md).

`OptimizelyComponent` renders the content with the same components as your public pages,
so the preview looks exactly like the live site.

> [!NOTE]
>
> In a React framework other than Next.js, use `PreviewComponent` from
> `@optimizely/cms-sdk/react/client` instead of `NextPreviewComponent`, and a plain
> `<script>` tag instead of Next.js's `Script`. In Astro, wrap the content in
> [`OptimizelyPreview`](../reference/astro-components.md#optimizelypreview), which also
> loads the script.

## Point the CMS at your preview route

In the CMS, go to **Settings → Applications** and open the application you created
earlier.

1. On the **Hostnames** tab, click **Add Hostname** and enter `http://localhost:3000`.
   Click **Add**.
2. On the **Live Preview** tab, select **Use Preview Tokens**.
3. Under **Preview URL format**, click **Enabled**. A default format is added, which
   points at `{host}/preview` and passes the key, version, locale and context in the query
   string.
4. Click **Save**.

Now open **Home** in the CMS. Your site appears next to the editing form. Change the
heading, wait for the autosave, and the preview updates.

> [!TIP]
>
> If the preview frame stays blank, open your browser's developer tools. Some browsers
> block an `http://` page inside the `https://` CMS. Run the dev server over HTTPS with
> `next dev --experimental-https` and use the `https://` hostname instead.

## Images and videos in preview

Image and video URLs are rendered without the preview token, so they stay the same from
one save to the next and the browser doesn't load them again. Published media loads as
usual.

Unpublished media needs the token. When an image or video fails to load,
`NextPreviewComponent` loads it again with the token added. It adds the token only to URLs
on your CMS host, which it takes from `cmsUrl`. Without `cmsUrl`, it uses the host the
communication injector script loads from.

> [!NOTE]
>
> If your preview route renders none of `NextPreviewComponent`, `PreviewComponent` or
> `createContentSavedListener`, nothing loads unpublished media again. Pass
> `{ forceMediaToken: true }` to `getPreviewContent()` to put the token in every media URL
> instead.

## Let editors click to edit

In the preview, editors can click an element on the page to jump straight to the field
that holds its content. To enable that, mark each element with the property it shows,
using `pa()` from `getPreviewUtils()`:

```tsx
// src/components/Article.tsx
import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { RichText } from '@optimizely/cms-sdk/react/richText';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    body: { type: 'richText', displayName: 'Body' },
  },
});

type Props = {
  content: ContentProps<typeof ArticleContentType>;
};

export default function Article({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <main>
      <h1 {...pa('heading')}>{content.heading}</h1>
      <div {...pa('body')}>
        <RichText content={content.body?.json} />
      </div>
    </main>
  );
}
```

`pa('heading')` returns the attributes the CMS needs to link the element to the `heading`
property. The name must match a property of the content type. Outside the CMS editor it
returns an empty object, so the public site's HTML doesn't change.

![An article in live preview, with an editable field highlighted](https://files.readme.io/23b3c20-image.png)

## Recap

- The CMS loads your preview route with a preview token. `getPreviewContent()` uses it to
  fetch the draft.
- The preview route needs the communication injector script, `NextPreviewComponent` and
  `withAppContext`.
- Turn on preview tokens and the preview URL format in the application's settings.
- Media URLs carry no preview token. `NextPreviewComponent` adds it to media that fails to
  load.
- Spread `pa('property')` onto elements so editors can click them to edit.

You have finished the tutorial. You built a site that renders CMS content, and editors can
preview their changes as they type.

## Where to go next

- [Content types](../guides/content-types.md): more property types, validation and
  references between content
- [Experiences](../guides/experiences.md): pages that editors compose visually in Visual
  Builder
- [Display templates](../guides/display-templates.md): let editors pick a style for a
  component
- [Navigation](../guides/navigation.md): breadcrumbs and menus
