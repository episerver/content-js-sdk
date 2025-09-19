This is a [Next.js](https://nextjs.org) project showcasing the integration between Optimizely CMS and Optimizely Feature Experimentation.

## Getting Started

You need a Optimizely CMS instance and Optimizely Feature Experimentation instance.

### Set up environment

Create an `.env` file with the following environment variables:

```
# Saito p1
OPTIMIZELY_CMS_HOST=
OPTIMIZELY_GRAPH_SINGLE_KEY=
OPTIMIZELY_CMS_CLIENT_ID=
OPTIMIZELY_CMS_CLIENT_SECRET=
OPTIMIZELY_FX_SDK_KEY=
```

Run `npm run cms:push-config` to create the content types (defined under the directory `/src/components/`)

Run `npm run dev` to start the development server

### NPM scripts

- `npm run cms:login` to test your connection agains the Optimizely CMS
- `npm run cms:push-config` to create the content types defined here in the Optimizely CMS
