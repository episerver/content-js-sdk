---
name: optimizely-setup
description: This skill should be used when the user asks to "set up Optimizely CMS SDK", "initialize the SDK from scratch", "configure the CMS client", "add content delivery", "integrate Optimizely CMS", "start a headless CMS project with Optimizely", "install the SDK", or mentions setting up the Optimizely CMS JavaScript SDK in a new project.
---

# Setup Optimizely CMS SDK

Guide the user through setting up the Optimizely CMS JavaScript SDK in their project.

## Steps

1. **Detect package manager** - Check which package manager is used (npm, pnpm, yarn)
2. **Install packages** - Install @optimizely/cms-sdk and @optimizely/cms-cli
3. **Create .env file** - Create environment variables file with placeholders
4. **Create config file** - Create optimizely.config.mjs with basic configuration
5. **Add .env to .gitignore** - Ensure .env is not committed
6. **Verify installation** - Test the CLI connection

## Implementation

### 1. Detect Package Manager

Check for lock files to determine the package manager:

```bash
if [ -f "pnpm-lock.yaml" ]; then
  echo "pnpm"
elif [ -f "yarn.lock" ]; then
  echo "yarn"
elif [ -f "package-lock.json" ]; then
  echo "npm"
else
  echo "npm"
fi
```

### 2. Install Packages

Based on the detected package manager, install the required packages:

- **pnpm**: `pnpm add @optimizely/cms-sdk && pnpm add -D @optimizely/cms-cli`
- **yarn**: `yarn add @optimizely/cms-sdk && yarn add -D @optimizely/cms-cli`
- **npm**: `npm install @optimizely/cms-sdk && npm install -D @optimizely/cms-cli`

### 3. Create .env File

Create `.env` file if it doesn't exist, with Optimizely credentials:

```ini
OPTIMIZELY_CMS_CLIENT_ID=<your-client-id>
OPTIMIZELY_CMS_CLIENT_SECRET=<your-client-secret>
```

**Important**: Remind the user to:
- Get credentials from their CMS instance: Settings → API Keys → Create API key
- Replace the placeholders with actual values
- Never commit .env to version control

### 4. Create Configuration File

First, ask the user if they want to set up property groups to organize their content type fields in the CMS editor.

**Property groups** help organize related content type properties together (e.g., SEO fields, metadata, layout settings). They're optional but useful for keeping the CMS editor organized.

If the user wants property groups, create `optimizely.config.mjs` with example groups:

```javascript
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

If they don't need property groups, create the basic configuration:

```javascript
import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: ['./src/components/**/*.tsx'],
});
```

Adjust the `components` path based on the project structure (check if src/ exists, otherwise use appropriate path like `./components/**/*.tsx` or `./app/components/**/*.tsx`).

### 5. Add .env to .gitignore

Check if `.gitignore` exists and contains `.env`. If not, add it:

```bash
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
fi
```

### 6. Verify Installation

Guide user to test the connection:

```bash
npx @optimizely/cms-cli login
```

## Next Steps

After setup, inform the user they can:
- Define content types using TypeScript in their components
- Sync types to CMS using `npx @optimizely/cms-cli push`
- Fetch content using the SDK's client utilities

## References

- [Installation Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/1-installation.md)
- [Setup Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/2-setup.md)
- [Modelling Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md)
