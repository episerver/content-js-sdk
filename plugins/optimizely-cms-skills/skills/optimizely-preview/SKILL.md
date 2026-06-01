---
name: optimizely-preview
description: This skill should be used when the user asks to "set up live preview", "configure preview mode", "fix preview not working", "add click-to-edit", "troubleshoot preview", "preview is broken", "can't see preview in the editor", or mentions visual editing, live preview, or on-page editing for Optimizely CMS in React applications.
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

## Troubleshooting

When preview isn't working, systematically check common issues: blank screens, missing preview button, preview not updating, 404 errors, and environment variable issues. See `references/troubleshooting.md` for comprehensive diagnostic steps and solutions.

## Click-to-Edit Features

After basic preview works, enhance the editor experience by adding click-to-edit functionality using `getPreviewUtils()`. See `references/click-to-edit.md` for detailed guidance on preview attributes, helper functions, and best practices.

## Tips for Success

1. **Always wrap the preview page with `withAppContext`** - This is required, not optional
2. **Don't skip any of the three required components** - Script, PreviewComponent, OptimizelyComponent
3. **Restart the dev server** after changing environment variables
4. **Use the exact env var names** - They're case-sensitive and must match exactly

## Additional Resources

### Reference Files

For detailed information, consult:

- **`references/troubleshooting.md`** - Comprehensive troubleshooting guide for preview issues including blank screens, missing buttons, update problems, and environment variable issues
- **`references/click-to-edit.md`** - Click-to-edit features and preview utilities including `pa()`, `src()`, best practices, and common mistakes
