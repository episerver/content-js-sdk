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
import { contentType } from '@optimizely/cms-sdk';

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
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

### Optional: Define Property Groups

Property groups help organize your content type properties in the CMS editor. You can define custom property groups in your config file:

```js
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
  propertyGroups: [
    {
      key: 'seo',
      displayName: 'SEO',
      sortOrder: 1,
    },
    {
      key: 'meta',
      displayName: 'Metadata',
      sortOrder: 2,
    },
  ],
});
```

Each property group has:

- `key` (required): A unique identifier for the group
- `displayName` (optional): The name shown in the CMS editor. If not provided, it's auto-generated from the key
- `sortOrder` (optional): Controls the display order. If not provided, it's auto-assigned based on array position

You can then reference these groups in your content type properties using the `group` field.

## Step 2. Sync content types to the CMS

Run the following command:

```sh
npx @optimizely/cms-cli@latest config push optimizely.config.mjs
```

## Next steps

Now you are ready to [create content in the CMS to fetch it later](./4-create-content.md)
