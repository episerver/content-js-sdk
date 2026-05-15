---
name: optimizely-preview
description: Set up or troubleshoot Optimizely CMS live preview in React applications. Use when the user mentions setting up live preview, preview not working, preview not showing in CMS, configuring preview, or needs help with preview setup/debugging for Optimizely. Also trigger when the user says preview is broken, can't see preview in the editor, or preview shows a blank screen.
---

# Optimizely Live Preview Setup and Troubleshooting

This skill helps you set up live preview for Optimizely CMS in React applications or troubleshoot existing preview configurations.

## Overview

Live preview allows editors to see content changes in real-time before publishing. When properly configured, editors can click "Preview" in the Optimizely CMS and see their changes instantly in your application without leaving the editor interface.

## When to Use This Skill

- Setting up live preview for the first time
- Preview doesn't show in the CMS (blank screen, errors, or nothing happens)
- Verifying preview configuration
- Debugging preview communication issues

## Step 1: Detect the Framework

Before setting up preview, detect which React framework the user is using:

1. **Check for Next.js**:
   - Look for `next.config.js` or `next.config.mjs` in the project root
   - Check if App Router: `src/app/` or `app/` directory exists
   - Check if Pages Router: `src/pages/` or `pages/` directory exists

2. **Check for TanStack Start**:
   - Check package.json for `@tanstack/react-start` dependency
   - Routes typically in `src/routes/` or `app/routes/`

3. **If unclear**: Ask the user which framework they're using

## Step 2: Set Up Preview Route

Create the preview route in the correct location based on the detected framework.

### Next.js App Router

Create `src/app/preview/page.tsx` (or `app/preview/page.tsx` if no src directory):

```tsx
import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function Page({ searchParams }: Props) {
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

export default withAppContext(Page);
```

**Key components explained**:
- `withAppContext(Page)`: Required HOC that initializes request-scoped context for preview data
- `getPreviewContent()`: Fetches the correct content version based on CMS preview parameters
- `<Script>`: Loads the communication injector from CMS for two-way communication
- `<PreviewComponent />`: Client component that handles real-time preview updates
- `<OptimizelyComponent />`: Renders the content using registered components

### Next.js Pages Router

Create `src/pages/preview.tsx` (or `pages/preview.tsx`):

```tsx
import { GraphClient, type PreviewParams } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import Script from 'next/script';
import { GetServerSideProps } from 'next';

type Props = {
  content: any;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const response = await client.getPreviewContent(
    context.query as PreviewParams,
  );

  return {
    props: {
      content: response,
    },
  };
};

function PreviewPage({ content }: Props) {
  return (
    <>
      <Script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      ></Script>
      <PreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}

export default withAppContext(PreviewPage);
```

### TanStack Start

Create `src/routes/preview.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { type PreviewParams } from "@optimizely/cms-sdk";
import { OptimizelyComponent } from "@optimizely/cms-sdk/react/server";
import { PreviewComponent } from "@optimizely/cms-sdk/react/client";
import { withAppContext } from "@optimizely/cms-sdk/react/server";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { GraphClient } from "@optimizely/cms-sdk";

type Props = {
  search: PreviewParams & {
    ver: number;
  };
};

const convertToStrings = (it: PreviewParams & {
    ver: number;
  }): PreviewParams => ({
    ...it,
    ver: String(it.ver)
  })

async function Page({ search }: Props) {
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
    graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  const stringOnlySearch = convertToStrings(search)
  const content = await client.getPreviewContent(stringOnlySearch);

  return (
    <>
      <script
        src={`${process.env.OPTIMIZELY_CMS_URL}/util/javascript/communicationinjector.js`}
      />
      <PreviewComponent />
      <OptimizelyComponent content={content} />
    </>
  );
}

const PageWithContext = withAppContext(Page);

const getPreviewPage = createServerFn().handler(
  async ({ data: { search } }: any) => {
    const Renderable = await renderServerComponent(
      <PageWithContext search={search} />,
    );
    return { Renderable };
  },
);

export const Route = createFileRoute("/preview")({
  loader: async ({ location: { search } }) => {
    const { Renderable } = await getPreviewPage({
      data: { search },
    } as any);
    return { Renderable };
  },
  component: Preview,
});

function Preview() {
  const { Renderable } = Route.useLoaderData();
  return <>{Renderable}</>;
}
```

**Key differences for TanStack Start**:
- Uses `createFileRoute` from `@tanstack/react-router`
- Uses `createServerFn` and `renderServerComponent` from `@tanstack/react-start`
- The `ver` parameter comes as a number and needs to be converted to a string
- The route is defined using TanStack Router's file-based routing system

### Other React Frameworks

For other React frameworks (Remix, Vite + React Router, etc.):

1. Create a `/preview` route using your framework's routing system
2. Extract query parameters from the URL
3. Pass them to `client.getPreviewContent()`
4. Include the communication injector script (as `<script>` or `<Script>`)
5. Render with `<PreviewComponent />` and `<OptimizelyComponent />`
6. Wrap the component with `withAppContext`

The core concepts remain the same across all frameworks - only the routing and data-fetching mechanisms differ.

## Step 3: Configure Environment Variables

Check if `.env` file exists. If not, create it. Add or verify these variables:

```bash
OPTIMIZELY_GRAPH_SINGLE_KEY=your_single_key_here
OPTIMIZELY_GRAPH_GATEWAY=https://cg.optimizely.com/content/v2
OPTIMIZELY_CMS_URL=https://your-cms-instance.optimizely.com
```

**Important notes**:
- `OPTIMIZELY_CMS_URL` should NOT have a trailing slash
- The single key and gateway URL should already exist if the user has the SDK set up
- If these don't exist, they need to get them from their Optimizely CMS instance

Update `.gitignore` to ensure `.env` is not committed:

```
.env
.env.local
```

## Step 4: Verify Preview Route Works

Test the preview route locally:

1. **Start the dev server** (if not running):
   - Next.js: `npm run dev` or `pnpm dev` or `yarn dev`
   - Remix: `npm run dev` or similar

2. **Test the route**:
   - Visit `http://localhost:3000/preview` (or whatever port the dev server uses)
   - You should see an error or blank page (this is expected without preview parameters)
   - Check browser console for any errors

3. **Common issues at this stage**:
   - Missing imports → Check all imports are correct
   - Environment variables not loading → Restart dev server after adding .env
   - Type errors → Make sure `@optimizely/cms-sdk` is installed

## Step 5: Guide CMS Configuration

The user needs to configure these settings in their Optimizely CMS instance. Provide clear instructions:

### Configure Hostname

1. Open your Optimizely CMS instance
2. Go to **Settings** → **Hostnames** tab
3. Click **Add Hostname**
4. Enter your application URL:
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Select **Use a secure connection (HTTPS)** if applicable
6. Click **Add**

### Configure Preview URL

1. Go to **Settings** → **Live Preview** tab
2. Select **Use Preview Tokens**
3. Click **Enabled** under **Preview URL format**
4. Edit the preview URL to point to your preview route:
   - For local development: `http://localhost:3000/preview`
   - For production: `https://yourdomain.com/preview`
5. Click **Save**

**The preview URL format in CMS should look like**:
```
http://localhost:3000/preview
```

The CMS will automatically append the preview parameters (preview_token, key, locale, etc.) as query parameters.

### HTTPS for Local Development

Some browsers and CMS instances may require HTTPS even for local development. If preview isn't working over HTTP:

**For Next.js**:
Update your dev script in `package.json`:
```json
"dev": "next dev --experimental-https"
```

Then use `https://localhost:3000/preview` in your CMS preview URL configuration.

**For other frameworks**:
- TanStack Start: Use `vite dev --https` or configure HTTPS in `vite.config.ts`
- Consult your framework's documentation for HTTPS configuration

## Troubleshooting: Preview Not Working

When the user says "preview isn't working" or "I don't see preview in the CMS", systematically check common issues:

### Issue 1: Preview Shows Blank Screen or Error

**Check**:
1. Open browser console when clicking preview - are there errors?
2. Check if the preview route exists and is accessible
3. Verify environment variables are set correctly
4. Check if dev server is running

**Common causes**:
- `OPTIMIZELY_CMS_URL` missing or incorrect
- Missing `withAppContext` wrapper
- Missing `<PreviewComponent />` or `<Script>` tag
- Component not registered for the content type being previewed

### Issue 2: Preview Button Doesn't Appear in CMS

**Check**:
1. Is the hostname configured in CMS?
2. Is the preview URL format enabled and configured?
3. Are preview tokens enabled?

**How to verify in CMS**:
- Go to Settings → Live Preview
- Ensure "Use Preview Tokens" is selected
- Ensure "Preview URL format" is enabled
- Ensure the URL matches your preview route

### Issue 3: Preview Opens But Doesn't Update

**Check**:
1. Is `communicationinjector.js` loading? (Check network tab)
2. Is `<PreviewComponent />` included in the preview route?
3. Are there CORS errors in console?

**Common causes**:
- `OPTIMIZELY_CMS_URL` doesn't match the actual CMS URL
- CORS blocked the injector script
- Missing `<PreviewComponent />`

### Issue 4: Preview Shows 404 or Wrong Content

**Check**:
1. Is the content type registered with a component?
2. Is `getPreviewContent()` being called with the correct parameters?
3. Check the URL parameters being sent from CMS

### Issue 5: Environment Variables Not Working

**Check**:
1. Is `.env` in the correct location (project root)?
2. Did you restart the dev server after adding/changing .env?
3. Are variable names exactly correct (case-sensitive)?

**For Next.js specifically**:
- Client-side env vars must be prefixed with `NEXT_PUBLIC_`
- BUT `OPTIMIZELY_GRAPH_SINGLE_KEY`, `OPTIMIZELY_GRAPH_GATEWAY`, and `OPTIMIZELY_CMS_URL` should NOT be public (they're used server-side only)

## Diagnostic Approach

When troubleshooting, follow this sequence:

1. **Verify preview route exists and is accessible**
   - Visit the route directly (without params)
   - Should not crash, even if it shows nothing

2. **Check environment variables**
   - Read the .env file
   - Verify all three required variables are set
   - Restart dev server

3. **Verify route implementation**
   - Has `withAppContext` wrapper
   - Has `<Script>` for communicationinjector.js
   - Has `<PreviewComponent />`
   - Has `<OptimizelyComponent />`
   - Calls `getPreviewContent()`

4. **Check CMS configuration**
   - Hostname configured
   - Preview URL format enabled
   - Preview URL points to correct route
   - Preview tokens enabled

5. **Test with browser console open**
   - Click preview in CMS
   - Watch for errors
   - Check network tab for failed requests

## Success Criteria

Preview is working when:
- Clicking "Preview" in CMS opens your application
- The content from CMS appears in the preview
- Changes in CMS update the preview in real-time
- No errors in browser console

## Additional Features: Click-to-Edit (Preview Utils)

After basic preview works, you can enhance the editor experience by adding click-to-edit functionality using `getPreviewUtils()`.

When editors hover over elements with preview attributes, they're highlighted. Clicking them jumps to the corresponding field in the CMS editor.

**Example component with preview utils**:

```tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  properties: {
    heading: { type: 'string' },
    body: { type: 'richText' },
  },
});

type AboutUsProps = {
  content: ContentProps<typeof AboutUsContentType>;
};

export default function AboutUs({ content }: AboutUsProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <section>
      <h2 {...pa('heading')}>{content.heading}</h2>
      <div {...pa('body')} className="content">
        {/* render body */}
      </div>
    </section>
  );
}
```

**Key functions**:
- `pa('propertyName')`: Spreads preview attributes onto elements to enable click-to-edit
- `src(reference)`: Resolves content reference URLs correctly in preview mode

Apply `pa()` to all content properties that editors should be able to click and edit.

## Tips for Success

1. **Always wrap the preview page with `withAppContext`** - This is required, not optional
2. **Don't skip any of the three required components** - Script, PreviewComponent, OptimizelyComponent
3. **Restart the dev server** after changing environment variables
4. **Use the exact env var names** - They're case-sensitive and must match exactly
