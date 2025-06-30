# Modelling

In this page you will learn how to model content types for your CMS

## Step 1. Model content types

- Create a directory `src/components`. Inside that directory you will place your content types definitions.
- Create a file called `Article.tsx` inside the `src/components` directory
- Create a file `optimizely.config.mjs` in the root of your project

Your project structure will look like this:

```
.
├── src/
│   ├── app/
│   └── components/
│       └── Article.tsx
├── public
├── .env
├── optimizely.config.mjs
└── ...
```

Fill `Article.tsx` with the following content:

```ts
export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});
```

Fill `optimizely.config.mjs` with the following content

```js
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

## Step 2. Sync content types to the CMS

Run the following command:

```sh
npx @episerver/cms-cli@latest config push optimizely.config.mjs
```

## Next steps

Now you are ready to [fetch content from the CMS] (_under construction_)
