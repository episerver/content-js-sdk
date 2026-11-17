This is a [Next.js](https://nextjs.org) project that shows Incremental Static Regeneration
(ISR) on Optimizely front-end hosting with
[`@optimizely/cms-hosting`](../../packages/optimizely-cms-hosting). When you publish a
page in the CMS, the site shows the change within seconds, without a rebuild.

## How it works

Four files connect the project to the hosting platform:

| File                                     | What it does                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `cache-handler.mjs` and `next.config.ts` | Store the ISR cache in the platform's Redis, so every instance serves and refreshes the same pages |
| `src/instrumentation.ts`                 | Registers an Optimizely Graph webhook when the server starts                                       |
| `src/app/hooks/graph/route.ts`           | Receives the webhook and refreshes the published page in the cache and the CDN                     |

## Setup

### 1. Create content

Go to your CMS and create a page.

### 2. Deploy the project

Deploy the project to Optimizely front-end hosting with `optimizely-cms-cli deploy`. See
[Deploy to Front-end Hosting](../../docs/guides/deploy-to-frontend-hosting.md). Copy the
project out of this monorepo first: it needs its own `package-lock.json`, and published
versions instead of `workspace:*`.

The platform sets every variable the project needs, including the Redis connection, the
webhook credentials and the CDN purge API. You do not set any of them.

### 3. Create an application

Go to your CMS &rarr; Settings &rarr; Applications. Click "Create application". In the
dialog:

- In _Application Name_ write "webhooks_test"
- Under _choose start page_ choose "from existing" and choose the page you created in
  step 1.

Click create application and, in the list of applications, click the application you just
created and go to "Hostnames". Click "Add Hostname". In the dialog:

- In _Hostname_ write the hostname that `deploy` printed, for example
  `myproject9abc1t001.dxcloud.episerver.net`.
- Check the "Use a secure connection (HTTPS)" checkbox
- In _Locale_ choose All

### 4. Test the cache

Go to `<your site>/en`. You will see a page with the message:

```
This page is generated and cached: 2025-10-03T12:42:40.453Z. 15 seconds ago
```

Refresh the page. You will see that the date is the same and that the seconds counter has
_not_ restarted.

### 5. Publish a change

Go to your CMS, make changes to the page `/en/` you created previously and publish them.

Go to `<your site>/en`. Within a few seconds, you will see a different date and the
counter has restarted.

## Running somewhere else

Without the platform variables, the project still builds and runs:

- Each instance caches pages in its own memory instead of Redis.
- No webhook is registered, and the CDN is not purged.

To try the webhook on another host, give the site a public URL (`localhost` cannot receive
webhooks; use a tunnel like [ngrok](https://ngrok.com)) and set the variables listed in
`.env.in`.

> [!NOTE]
>
> `npm run dev` does not cache pages, because Next.js disables the cache in dev mode. Use
> `npm run build` and `npm start`.
