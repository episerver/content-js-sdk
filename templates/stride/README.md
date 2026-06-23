# Stride Template

> **⚠️ Work in Progress:** This template is currently under active development.

A Next.js template inspired by the [Alloy MVC Template](https://github.com/episerver/templates), showcasing composition (experiences) with the latest Optimizely CMS JavaScript SDK.

This starter template comes with pre-built components and examples for building headless applications using Optimizely's composition (experience) features, styled with Tailwind CSS and fully typed with TypeScript.

## Prerequisites

You need a CMS instance with Graph installed. Both local and SaaS instances are supported.

## Import Content

To populate your CMS with some example content:

1. Log in to your Optimizely CMS admin interface
2. Navigate to **Settings** → **Import Data**
3. Upload the `ExportedFile.episerverdata` file from this template directory
4. Select the root node as import target
5. Follow the import wizard to complete the process

This will import all the pre-configured pages, components, and content structure needed for this template.

## Configure an Application

1. Navigate to **Settings** → **Applications**
2. Create new (headless) application
3. Choose the existing start page from the imported content
4. Click **Create Application**
5. Navigate to **Hostnames**
6. Add a primary hostname with value **localhost:3000** and choose all locales
7. Save

## Run Template

Create a copy of `.env.example` and rename it to `.env`, then fill out all the environment variables.

Sync all configuration to the CMS:

```bash
npm run config:push
# or
yarn config:push
# or
pnpm config:push
# or
bun config:push
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
