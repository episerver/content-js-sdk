# Quick start

The fastest way to see the SDK working is to start from a template. One command scaffolds
a site that is already wired up to Optimizely CMS, so you only need to add your
credentials.

If you would rather build everything yourself and understand each piece, skip this page
and start at [Installation](./installation.md).

> **You will learn**
>
> - How to create a project from a template
> - How to connect it to your CMS
> - How to add the SDK to a project you already have
> - How to deploy the site to Optimizely front-end hosting

## Create a project from a template

Run `create-app` and choose **Create from template** when prompted:

```sh
npx @optimizely/cms-create-app
```

It asks for a project name, a template and a package manager, then installs everything.
These templates are available:

| Template           | What you get                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `nextjs-starter`   | A minimal Next.js site. The best place to start                                             |
| `nextjs-stride`    | A full demo site with experiences, display templates and live preview ([live demo][stride]) |
| `nextjs-alloy`     | A full demo site that also uses contracts and DAM assets                                    |
| `tanstack-starter` | A minimal TanStack Start site                                                               |

[stride]: https://nextjs-sample-js-sdk.vercel.app/

To skip the prompts, pass the answers as options:

```sh
npx @optimizely/cms-create-app my-site --template nextjs-starter --pm npm
```

The source of every template lives in this repository, under
[`templates/`](../../templates/) and [`samples/`](../../samples/).

## Connect it to your CMS

The template creates a `.env` file in the project root. Fill in these values:

```ini
OPTIMIZELY_CMS_URL=https://<your-instance>.cms.optimizely.com
OPTIMIZELY_GRAPH_SINGLE_KEY=<your single key>
OPTIMIZELY_CMS_CLIENT_ID=<your client id>
OPTIMIZELY_CMS_CLIENT_SECRET=<your client secret>
```

You will find all of them in the CMS under **Settings → API Keys**.
[Connect to the CMS](./connect-to-cms.md) walks through creating the client ID and secret,
and [Fetch content](./fetch-content.md) shows where to copy the single key.

Then push the template's content types to the CMS and start the site:

```sh
npx @optimizely/cms-cli@latest config push
npm run dev
```

Besides the content types, `config push` creates a start page and an application that
serves it. Both are declared in the template's `optimizely.config.mjs`. The start page is
empty at first, so open it in the CMS, fill it in and publish it, then reload your site.

> [!NOTE]
>
> Some templates run the dev server on HTTPS or on a port other than 3000. Open the URL
> that `npm run dev` prints.

## Add the SDK to an existing project

`create-app` can also set up a project for you instead of copying a template. Run the same
command and choose one of these modes:

- **Fresh project** runs `create-next-app` or `create-start` for you, then adds the SDK.
- **Add Optimizely CMS to this project** adds the SDK to the project in the current
  directory. Run it from the project root.

Both add the packages, an `optimizely.config.mjs`, a `.env` and an initialization file at
`src/lib/optimizely.ts`. They do not edit your root layout. Import the initialization file
there yourself:

```tsx
// src/app/layout.tsx
import '@/lib/optimizely';
```

See the
[create-app README](../../packages/optimizely-cms-create-app/README.md#sdk-initialization)
for what that file contains and how to register your own components in it.

## Deploy your site

The Next.js templates are ready for Optimizely front-end hosting. They have a `deploy`
script and declare their Node.js version. Front-end hosting installs with npm or yarn, so
choose one of those as the package manager.

Add `--ci github` to get a GitHub Actions workflow that deploys on every push to `main`:

```sh
npx @optimizely/cms-create-app my-site --template nextjs-starter --pm npm --ci github
```

See [Deploy to front-end hosting](../guides/deploy-to-frontend-hosting.md) for the
credentials you need and how to connect the deployed site to the CMS.

## Recap

- `npx @optimizely/cms-create-app` creates a working site from a template.
- Add your CMS credentials to `.env`, then run `config push` to create the content types,
  a start page and an application.
- The same command can add the SDK to a new or existing project.
- The Next.js templates deploy to Optimizely front-end hosting with `--ci github` or the
  `deploy` script.

**Next:** to understand what the template set up, build the same site by hand, starting
with [Installation →](./installation.md)
