# Live Preview (with React)

Live preview allows editors to see their content changes in real-time before publishing. When an editor makes changes in the Optimizely CMS, they can instantly preview how those changes will look on your site without leaving the editor interface. This guide walks you through setting up live preview for your Next.js application using the Optimizely CMS SDK.

## Prerequisites

Before you begin, make sure you have:

- A React framework application set up with the Optimizely CMS SDK (in this example, we'll use Next.js)
- Content types defined and components created for them
- Access to your Optimizely CMS instance URL
- Your Optimizely Graph credentials (single key and gateway URL)

## Step 1. Create a Preview Route

First, create a dedicated route for handling preview requests. In Next.js, create a new file at `src/app/preview/page.tsx`. This will create a `/preview` route in your application:

```tsx
import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const response = await client.getPreviewContent(
    (await searchParams) as PreviewParams,
  );

  return (
    <>
      <Script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <OptimizelyComponent content={response} />
    </>
  );
}
```

Let's break down what's happening here:

### GraphClient Setup

```tsx
const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});
```

Initialize the GraphClient with your credentials. These should be stored in your environment variables for security.

### Fetching Preview Content

```tsx
const response = await client.getPreviewContent(
  (await searchParams) as PreviewParams,
);
```

The `getPreviewContent` method handles all the complexity of fetching the right content version based on the preview parameters sent from the CMS. These parameters are automatically included in the URL when an editor clicks "Preview" in the CMS.

### Rendering Preview Content

```tsx
return (
  <>
    <Script
      src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
    ></Script>
    <PreviewComponent />
    <OptimizelyComponent content={response} />
  </>
);
```

Three key components work together here:

1. **`<Script>`** - Loads the communication injector script from your CMS. This enables two-way communication between the preview window and the CMS editor interface. Note that this uses Next.js's `Script` component - if you're using a different framework, use standard `<script>` tags instead.

2. **`<PreviewComponent/>`** - A client component that handles the real-time preview updates. When an editor makes changes in the CMS, this component receives those updates and triggers a re-render.

3. **`<OptimizelyComponent/>`** - Renders the actual content using the component you've registered for that content type.

## Step 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
OPTIMIZELY_GRAPH_SINGLE_KEY=your_single_key_here
OPTIMIZELY_GRAPH_GATEWAY=https://cg.optimizely.com/content/v2
OPTIMIZELY_CMS_URL=https://your-cms-instance.optimizely.com
```

Replace the values with your actual:

- **OPTIMIZELY_GRAPH_SINGLE_KEY**: Your Content Graph single key
- **OPTIMIZELY_GRAPH_GATEWAY**: Your Content Graph gateway URL (default shown above)
- **OPTIMIZELY_CMS_URL**: Your Optimizely CMS instance URL (without trailing slash)

> [!IMPORTANT]
> Never commit your `.env.local` file to version control. Add it to your `.gitignore` to keep your credentials secure.

## Step 3. Configure Hostname and Preview in CMS

Configure your application hostname and preview settings in the CMS:

### Add Hostname

1. Open your application and go to the **Hostnames** tab
2. Click **Add Hostname** and enter your application URL:
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. Select **Use a secure connection (HTTPS)** if applicable
4. Click **Add**

### Configure Preview URL

1. Go to the **Live Preview** tab
2. Select **Use Preview Tokens**
3. Click **Enabled** under **Preview URL format**
4. A default format is added automatically - edit or add rows for specific content types
5. Update the preview URL to point to your preview route:
   - For local development: `http://localhost:3000/preview`
   - For production: `https://yourdomain.com/preview`
6. Click **Save**

> [!TIP]
> You can configure different preview URLs for multiple environments (local, staging, production) to test content across different deployment stages.

### Using Preview in Other Frameworks

While this guide focuses on Next.js, the SDK supports preview in other React-based frameworks. The core concepts remain the same:

1. Create a preview route that accepts query parameters
2. Use `GraphClient.getPreviewContent()` to fetch the content
3. Include the communication injector script
4. Render with `PreviewComponent` and `OptimizelyComponent`

The specific implementation details will vary based on your framework's routing and server-side rendering capabilities.

## Next Steps

With live preview configured, editors can see their changes instantly before publishing, improving the content editing workflow and reducing errors.

To enhance the preview experience further, consider exploring the **Using Preview Utils in Components** section below to enable on-page editing capabilities.

## Using Preview Utils in Components

To implement on-page editing functionality in your code, you need to add preview attributes to your HTML or JSX elements using the `getPreviewUtils` utility. These attributes enable the click-to-edit behavior that allows content editors to navigate directly from the preview to the corresponding field in the CMS editor.

![Live Preview with preview utils](https://files.readme.io/23b3c20-image.png)

### Understanding Preview Attributes (`pa`)

The `pa` function (short for "preview attributes") enables visual editing in the CMS. When editors hover over elements with these attributes, they're highlighted to show they're editable. Clicking them jumps directly to the corresponding field in the CMS editor.

### Complete Example

Here's a complete component that demonstrates both `pa` for preview attributes and `src` for resolving content references:

```tsx
import { contentType, damAssets, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  properties: {
    heading: { type: 'string' },
    body: { type: 'richText' },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
  },
});

type AboutUsProps = {
  content: ContentProps<typeof AboutUsContentType>;
};

export default function AboutUs({ content }: AboutUsProps) {
  const { pa, src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);

  return (
    <section className="about-us">
      {content.image && (
        <div className="about-us-image">
          <img
            {...pa('image')}
            src={src(content.image)}
            srcSet={getSrcset(content.image)}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt={getAlt(content.image, 'About us image')}
          />
        </div>
      )}
      <h2 {...pa('heading')}>{content.heading}</h2>
      <div {...pa('body')} className="about-us-content">
        <RichText content={content.body?.json} />
      </div>
    </section>
  );
}
```

**Key functions:**

- **`pa('propertyName')`** - Spreads preview attributes onto elements to enable on-page editing. Use this for all content properties (text, rich text, images, etc.). The property name must match your content type definition.
- **`src(reference)`** - Resolves content reference URLs correctly in both preview and published states.

> [!NOTE]
> Apply `pa()` to all content properties to enable the full on-page editing experience. This allows editors to click elements in the preview and jump directly to the corresponding field in the CMS.
