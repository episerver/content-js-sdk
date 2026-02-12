# Setup

In this page you will learn how to setup the CLI to connect it to your CMS instance

## Step 1. Create a API Client in the CMS

You first need to connect the CLI to the Optimizely CMS API.

1. Go to your CMS instance `https://<something>.cms.optimizely.com` &rarr; Settings &rarr; API Keys. Click "Create API key"

2. In the Create API dialog, give a name and click "Create API key"

   ![Screenshot of "Create API Key" dialog](./images/create-api-key.png)

3. You will see Client ID and Client Secret, which you will need in the next steps

   ![Screenshot of "Save your Secret" dialog](./images/save-your-secret.png)

## Step 2. Create environment variables

Create an `.env` file in the root of your project with the following content:

```ini
OPTIMIZELY_CMS_CLIENT_ID=<the client id>
OPTIMIZELY_CMS_CLIENT_SECRET=<the client secret>
```

> [!WARNING]
> Never commit your `.env` file with tokens to version control.

## Step 3. Check the connection

Use the command to check that the connection is correct:

```
npx @optimizely/cms-cli@latest login
```

## Step 4. Create configuration file

Create a file `optimizely.config.mjs` in the root of your project. This configuration tells the CLI where to find your content type definitions.

**Basic configuration:**

```js
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

Your project structure should now look like this:

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

### Components Configuration

The `components` field accepts an array of glob patterns to locate your component files. You can use multiple patterns and negation to exclude specific files or directories.

**Multiple patterns:**

```js
export default buildConfig({
  components: ['./src/components/*.tsx', './src/components/**/*.tsx'],
});
```

**Excluding specific content types:**

Use the `!` prefix to exclude specific content types from being synced to the CMS. This is useful when you have components that define content types but shouldn't be pushed to the CMS (Like test content types).

```js
export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    '!./src/components/layouts/**', // Exclude layout components
    '!./src/components/shared/**', // Exclude shared utility components
  ],
});
```

**Common exclusion patterns:**

```js
export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    '!./src/components/internal/**', // Exclude internal-only components
    '!./src/components/deprecated/**', // Exclude deprecated components
    '!./src/components/Header.tsx', // Exclude specific files
  ],
});
```

Negation patterns are processed in order, so place them after the inclusion patterns. The CLI uses these patterns to scan for content type definitions and display templates, then syncs only the matched files to your CMS instance.

**Optional: Property Groups**

Property groups help organize your content type properties in the CMS editor. Add them to your configuration if you want to group related fields together:

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

Property group configuration:

- **`key`** (required) - Unique identifier for the group
- **`displayName`** (optional) - Name shown in the CMS editor (auto-generated from key if omitted)
- **`sortOrder`** (optional) - Display order (auto-assigned based on array position if omitted)

Reference these groups in your content type properties using the `group` field.

### Non-production environment

The CLI uses the production API endpoints by default (https://api.cms.optimizely.com). If you want to use a different domain (for example https://api.cmstest.optimizely.com), configure it using the environment variable `OPTIMIZELY_CMS_API_URL`:

```ini
OPTIMIZELY_CMS_API_URL=https://api.cmstest.optimizely.com
```

[Read more about environment variables for the CLI](../packages/optimizely-cms-cli/docs/environmental-variables.md)

## Next steps

Now you are ready to start [modelling your data](./3-modelling.md).

---
