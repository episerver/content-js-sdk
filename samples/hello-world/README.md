# Next.js/Optimizely Hello world

This is the "Hello world" sample site for the headless Optimizely CMS SaaS, based on Next.js

## Features Demonstrated

- Basic content type definition and rendering
- Error handling patterns

## Pre-requirements

- An Optimizely CMS instance (like `https://<something>.cms.optimizely.com/`)
- Preview 3 API feature flag enabled

## Setup

### Autentication

Follow [this guide](https://github.com/episerver/content-js-sdk/blob/main/docs/2-setup.md) to connect your project to your CMS instance

You can test the connection running the command:

```
npm run cms:login
```

### Push content types

This project defines one content type called `Article` in [`Article.tsx`](./src/components/Article.tsx). To push the definition to the CMS run the command:

```
npm run cms:push-config
```

### Create content and create an application in the CMS

Follow [this guide to create content and an application](https://github.com/episerver/content-js-sdk/blob/main/docs/4-create-content.md)

## Run the application

Start the application with

```
npm run dev
```
