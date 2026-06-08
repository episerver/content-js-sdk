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

Create `.env` file if it doesn't exist, with minimal required Optimizely environment variables:

```ini
# Base URL of your CMS instance
# Example: https://example.cms.optimizely.com/
OPTIMIZELY_CMS_URL=

# CLI client credentials for syncing manifest data
# Create in: CMS instance > Settings > API Keys > Create API key
OPTIMIZELY_CMS_CLIENT_ID=
OPTIMIZELY_CMS_CLIENT_SECRET=

# Content Graph authentication key
# Found in: CMS instance > Settings > API Keys
OPTIMIZELY_GRAPH_SINGLE_KEY=
```

**Important**: Remind the user to:
- Get credentials from their CMS instance: Settings → API Keys → Create API key
- Replace the placeholders with actual values
- Never commit .env to version control

**Environment-specific configuration**:
- **Production**: Use the variables above as-is. `OPTIMIZELY_CMS_URL` is required.
- **Test (cmstest)**: Remove `OPTIMIZELY_CMS_URL` and add these instead:
  - `OPTIMIZELY_CMS_API_URL=https://api.cmstest.optimizely.com`
  - `OPTIMIZELY_GRAPH_GATEWAY=https://staging.cg.optimizely.com/`

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

**If authentication fails**, the user may be using a test environment or missing required variables. Guide them to:

1. Check if they need test environment (cmstest) configuration:
   - Add `OPTIMIZELY_CMS_API_URL=https://api.cmstest.optimizely.com`
   - Add `OPTIMIZELY_GRAPH_GATEWAY=https://staging.cg.optimizely.com/`
2. Verify all required variables are set (see "All Available Environment Variables" below)
3. Retry the login command

### 7. Add Missing Environment Variables (On Request)

When the user requests to "add all missing environment variables" or "add all possible variables", or when troubleshooting connection issues, reference this complete list of available environment variables:

```ini
# Base URL of your CMS instance
# Example: https://example.cms.optimizely.com/
OPTIMIZELY_CMS_URL=

# Content Graph endpoint
# Production (default): https://cg.optimizely.com/content/v2
# Test environment: https://staging.cg.optimizely.com/
OPTIMIZELY_GRAPH_GATEWAY=

# Content Graph authentication key
# Found in: CMS instance > Settings > API Keys
OPTIMIZELY_GRAPH_SINGLE_KEY=

# CLI client credentials for syncing manifest data
# Create in: CMS instance > Settings > API Keys > Create API key
OPTIMIZELY_CMS_CLIENT_ID=
OPTIMIZELY_CMS_CLIENT_SECRET=

# Feature Experimentation credentials (optional)
OPTIMIZELY_FX_SDK_KEY=
OPTIMIZELY_FX_ACCESS_TOKEN=

# Host of your application (optional)
APPLICATION_HOST=

# Base URL for CMS REST API endpoints
# Use instead of OPTIMIZELY_CMS_URL for test environments
# Test environment: https://api.cmstest.optimizely.com
OPTIMIZELY_CMS_API_URL=

# Required when CLI connects to local CMS with self-signed certificates
# NODE_TLS_REJECT_UNAUTHORIZED="0"
```

**Variable purposes**:

*Required for all environments:*
- `OPTIMIZELY_CMS_CLIENT_ID/SECRET` - Credentials for CLI to sync content type definitions
- `OPTIMIZELY_GRAPH_SINGLE_KEY` - Authentication for fetching content via Content Graph

*Production environment:*
- `OPTIMIZELY_CMS_URL` - Your CMS instance URL (e.g., `https://example.cms.optimizely.com/`)
- `OPTIMIZELY_GRAPH_GATEWAY` - Optional, defaults to `https://cg.optimizely.com/content/v2`

*Test environment (cmstest):*
- `OPTIMIZELY_CMS_API_URL` - Required instead of OPTIMIZELY_CMS_URL, set to `https://api.cmstest.optimizely.com`
- `OPTIMIZELY_GRAPH_GATEWAY` - Required, set to `https://staging.cg.optimizely.com/`

*Optional variables:*
- `OPTIMIZELY_FX_SDK_KEY/ACCESS_TOKEN` - Feature Experimentation integration
- `APPLICATION_HOST` - Your application's public URL
- `NODE_TLS_REJECT_UNAUTHORIZED` - Disable SSL validation for local development (security risk)

## Next Steps

After setup, inform the user they can:
- Define content types using TypeScript in their components
- Sync types to CMS using `npx @optimizely/cms-cli push`
- Fetch content using the SDK's client utilities

## References

- [Installation Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/1-installation.md)
- [Setup Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/2-setup.md)
- [Modelling Guide](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md)
