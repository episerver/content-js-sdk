This is a [Next.js](https://nextjs.org) project showcasing the integration between [Optimizely Content Management System (CMS)](https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/overview-saas) and [Optimizely Feature Experimentation](https://docs.developers.optimizely.com/feature-experimentation/docs/introduction).

## Features Demonstrated

- Using Optimizely Feature Experimentation (FX) with the CMS
- Rendering variations of pages and experiences using `@optimizely/optimizely-sdk`
- Integration between CMS content variations and FX feature flags

## Getting Started

You need a Optimizely CMS instance and Optimizely Feature Experimentation instance.

### Set up environment

Create an `.env` file with the following content. You will learn how to get the values for the variables in the next steps.

```
OPTIMIZELY_CMS_URL=
OPTIMIZELY_GRAPH_SINGLE_KEY=
OPTIMIZELY_CMS_CLIENT_ID=
OPTIMIZELY_CMS_CLIENT_SECRET=

OPTIMIZELY_FX_SDK_KEY=
OPTIMIZELY_FX_ACCESS_TOKEN=
```

### CMS credentials

1. Put the URL of your CMS as the `OPTIMIZELY_CMS_URL` variable. For example `https://app-1234.cms.optimizely.com/`
2. Go to your CMS instance &rarr; Settings &rarr; API Keys.
3. Under **Render Content**, the _Single Key_ variable, is the variable `OPTIMIZELY_GRAPH_SINGLE_KEY`
4. In the same page, under **Manage Content**, click "Create API key".
5. In the Create API dialog, give a name and click "Create API key"
6. You will see Client ID and Client Secret. Those are the values for `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET` variables respectively.

### Feature Experimentation credentials

In the Feature Experimentation app.

1. Go to Settings &rarr; Environmnents.
2. The SDK Key for your environment is the variable `OPTIMIZELY_FX_SDK_KEY`.

> [!Note]
> If the environment is _secured_, you will need an access token. Create it in the app and set it as the `OPTIMIZELY_FX_ACCESS_TOKEN` environment variable

## Push the content types model to the CMS

1. Run `npm run cms:login` to test your connection against the Optimizely CMS
2. Run `npm run cms:push-config` to create the content types defined under `src/components` to the Optimizely CMS.

## Create variations in Feature Experimentation and CMS

This sample site assumes:

- There is a page under `/en/landing` that is running an experiment (i.e., different visitors will get different versions of the page)
- The existance of a feature flag with the key `tv_genre` (the `tv_genre` contains the rules about which user will get which version)
- Variations in Feature Experimentation have the same name as variations in CMS.

To reproduce it:

1. In Feature Experimentation, create a feature flag with key `tv_genre`. [Read the Feature Experimentation documentation](https://support.optimizely.com/hc/en-us/articles/38906082664077-Manage-flags) to be familiar with flags.
2. In Feature Experimentation, create variations for the flag. [Read the Feature Experimentation docs to learn more about flag variations](https://support.optimizely.com/hc/en-us/articles/38676757193485-Create-flag-variations).

   For example, create the variations `k_drama`, `action` and `sports`

3. In CMS, create a page with the content type `BlankExperience` with URL `landing`.
4. In CMS, create variations for that page. You should use the names you used in FX to create variations in the CMS.

   In this example, create the variations `k_drama`, `action` and `sports`

## Test your site

1. Run `npm run dev` to start the app
2. Go to `https://localhost:3000/en/landing`. You should see a variation of the page.
3. Open the inspector, locate the cookies and remove the cookie `user_id`.
4. Refresh the page. You might see a different page variation (depending on the variation rules you have defined)

## Learn more about this sample site

- Inspect the file [`/src/lib.fx.ts`](./src/lib/fx.ts) to see the code that uses the Feature Experimentation SDK
- Inspect the file [`/src/app/en/[...slug]/page.tsx`](./src/app/en/[...slug]/page.tsx) to learn how to fetch a specific variation from your CMS

## Further reading

- [Optimizely Feature Experimentation JavaScript SDK](https://docs.developers.optimizely.com/feature-experimentation/docs/javascript-sdk)
- [Create content variations in the Optimizely CMS](https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/create-content-variation)
