# Modelling

In this page you will learn how to model content types for your CMS

## Step 1. Model content types

1. Create a directory `src/components`. Inside that directory you will place your content types definitions
2. Create a file called `Article.tsx` inside `src/components` with the following content:

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

## Step 2. Create a config file

Create a `optimizely.config.mjs` file in the root of your project with the following content:

```js
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

## Step 3. Sync content types to the CMS

Run the following command:

```sh
optimizely-cms-cli config push optimizely.config.mjs
```

## Next steps

Now you are ready to [fetch content from the CMS] (_under construction_)
