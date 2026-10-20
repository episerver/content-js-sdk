# Installation

This tutorial builds a Next.js site from scratch that renders content from Optimizely CMS.
By the end, editors will be able to change a page in the CMS and see the result live on
your site. This first page sets up the project.

> **You will learn**
>
> - What you need before you start
> - How to create a Next.js project
> - How to install the SDK and run the CLI

## Before you start

You need:

- **Node.js 20** or later
- Access to an **Optimizely CMS (SaaS)** instance, with permission to create API keys

The tutorial has these steps:

1. **Installation**: create the project (this page)
2. [Connect to the CMS](./connect-to-cms.md): give the CLI access to your instance
3. [Your first content type](./first-content-type.md): define an `Article` in code and
   push it to the CMS
4. [Create content](./create-content.md): write your first article in the CMS
5. [Fetch content](./fetch-content.md): load the article from Optimizely Graph
6. [Render with React](./render-with-react.md): turn the article into a page
7. [Live preview](./live-preview.md): let editors see their changes as they type

## Create a Next.js project

The SDK works with any React framework, but this tutorial uses Next.js with the App
Router. Run:

```sh
npx create-next-app@latest
```

Answer **Yes** to these prompts, and keep the defaults for the rest:

- Would you like to use **TypeScript**?
- Would you like your code inside a **`src/` directory**?
- Would you like to use **App Router**?

Keep the default import alias, `@/*`. Later steps import from `@/components/...`.

## Install the SDK

From the project root, install the SDK:

```sh
npm install @optimizely/cms-sdk
```

The **SDK** gives you everything that runs in your app: defining content types, fetching
content and rendering it.

## Run the CLI

The **CLI** is the other half. It runs in your terminal and uploads the content types you
define in code to the CMS. You can run it with `npx` without installing anything:

```sh
npx @optimizely/cms-cli@latest
```

You should see a list of commands. You will use them in the next step.

> [!TIP]
>
> To pin the CLI version for your team, install it as a dev dependency with
> `npm install -D @optimizely/cms-cli` and run it as `npx optimizely-cms-cli`. See
> [CLI commands](../reference/cli.md#running-the-cli).

## Recap

- You created a Next.js project with TypeScript, a `src/` directory and the App Router.
- The SDK (`@optimizely/cms-sdk`) runs in your app. The CLI (`@optimizely/cms-cli`) syncs
  content types to the CMS.

**Next:** [Connect to the CMS →](./connect-to-cms.md)
