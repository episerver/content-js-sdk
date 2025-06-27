# Getting Started with @episerver/cms-cli

This guide will walk you through installing the Optimizely CMS CLI, setting up authentication, and performing your first content type deployment.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (latest LTS version recommended)
- **An Optimizely CMS instance** with administrator access
- **API Key permissions** in your CMS instance
- **GitHub Package Registry access** (see [Authentication Setup](#github-package-registry-authentication))

## Installation

### 1. GitHub Package Registry Authentication

The CLI is published to GitHub Package Registry. Set up authentication first:

1. **Create a Personal Access Token**:
   - Go to [GitHub Settings > Developer settings > Personal access tokens (classic)](https://github.com/settings/tokens)
   - Generate a new token with `read:packages` scope
   - **Authorize for Optimizely organization**: Click "Configure SSO" and authorize for Episerver/Optimizely

2. **Configure NPM**:
   Create or update `~/.npmrc` with:
   ```
   @episerver:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
   ```

### 2. Install the CLI

Choose your preferred installation method:

#### Global Installation (Recommended)

```bash
# Install globally for system-wide access
npm install @episerver/cms-cli -g

# Verify installation
optimizely-cms-cli --version

# View available commands
optimizely-cms-cli --help
```

#### Run Without Installation

```bash
# Use npx to run without installing
npx @episerver/cms-cli --help

# Or use other package managers
yarn dlx @episerver/cms-cli --help
pnpm dlx @episerver/cms-cli --help
```

#### Project-Local Installation

```bash
# Install as dev dependency
npm install @episerver/cms-cli --save-dev

# Run via package.json scripts
npm run cms-cli --help
```

## CMS API Key Setup

### 1. Create API Key in CMS

1. **Access CMS Admin Panel**:
   - Navigate to your CMS instance (e.g., `https://your-site.cms.optimizely.com`)
   - Log in with administrator credentials

2. **Create API Key**:
   - Go to **Settings** > **API Keys**
   - Click **"Create API Key"**
   - Choose **"Client Credentials"** flow
   - Set appropriate scopes (recommend all CMS scopes for full functionality)
   - Click **"Create"**

3. **Note Credentials**:
   - **Client ID**: Copy and save securely
   - **Client Secret**: Copy and save securely (shown only once)

### 2. Required Permissions

Ensure your API key has these permissions:
- **Content Management**: For content operations
- **Content Types**: For content type management
- **Configuration**: For system configuration access

## Authentication

### 1. Interactive Login

```bash
# Start authentication process
optimizely-cms-cli login

# The CLI will prompt for:
# - Instance URL: your-site.cms.optimizely.com
# - Client ID: [your client ID]
# - Client Secret: [your client secret]
```

Example session:
```
$ optimizely-cms-cli login
? Enter the instance URL (<<something>>.cms.optimizely.com) › my-site.cms.optimizely.com
? Enter Client ID › abc123def456
? Enter Client Secret › [hidden]

✓ Checking your credentials...
✓ You are now logged in! Your credentials are stored in /Users/username/.config/optimizely/config.json
```

### 2. Multiple Instance Management

```bash
# Login to different instances
optimizely-cms-cli login
# Enter dev-site.cms.optimizely.com

optimizely-cms-cli login  
# Enter staging-site.cms.optimizely.com

optimizely-cms-cli login
# Enter prod-site.cms.optimizely.com

# Use specific instance with --host flag
optimizely-cms-cli config push optimizely.config.mjs --host dev-site.cms.optimizely.com
```

### 3. Verify Authentication

```bash
# Test authentication with a simple pull command
optimizely-cms-cli config pull --output test-config.json

# If successful, you'll see:
✓ Downloading configuration file
# Configuration file saved to test-config.json
```

## Your First Content Type Deployment

Let's create and deploy a simple content type to demonstrate the CLI workflow.

### 1. Set Up Project Structure

```bash
# Create a new project directory
mkdir my-optimizely-project
cd my-optimizely-project

# Initialize package.json
npm init -y

# Install the SDK (for content type definitions)
npm install @episerver/cms-sdk
```

### 2. Create Content Type Definition

Create `src/content-types/Article.ts`:

```typescript
import { contentType } from '@episerver/cms-sdk';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      required: true,
      displayName: 'Article Title',
      maxLength: 100,
      group: 'Content'
    },
    
    excerpt: {
      type: 'string',
      displayName: 'Excerpt',
      description: 'Brief summary of the article',
      maxLength: 200,
      group: 'Content'
    },
    
    content: {
      type: 'richText',
      displayName: 'Content',
      required: true,
      group: 'Content'
    },
    
    publishDate: {
      type: 'dateTime',
      displayName: 'Publish Date',
      required: true,
      group: 'Metadata'
    },
    
    author: {
      type: 'string',
      displayName: 'Author Name',
      group: 'Metadata'
    },
    
    featured: {
      type: 'boolean',
      displayName: 'Featured Article',
      description: 'Mark this article as featured',
      group: 'Metadata'
    },
    
    tags: {
      type: 'array',
      items: { type: 'string' },
      displayName: 'Tags',
      group: 'Categorization'
    }
  }
});
```

### 3. Create Build Configuration

Create `optimizely.config.mjs` in project root:

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    './src/content-types/**/*.ts'
  ]
});
```

### 4. Deploy Content Type

```bash
# Deploy to CMS (dry run first to see what will happen)
optimizely-cms-cli config push optimizely.config.mjs --dry-run

# If dry run looks good, deploy for real
optimizely-cms-cli config push optimizely.config.mjs
```

Expected output:
```
✓ Uploading configuration file
✓ Configuration file uploaded

Outcomes:
- Content type 'Article' created successfully
- 7 properties configured
- Groups 'Content', 'Metadata', 'Categorization' created
```

### 5. Verify in CMS

1. **Log into your CMS admin panel**
2. **Navigate to Content Types**
3. **Find your new "Article" content type**
4. **Verify all properties are configured correctly**

### 6. Create Test Content

1. **In CMS, create new content**
2. **Select "Article" as content type**
3. **Fill in the properties**
4. **Publish the content**

## Common CLI Operations

### Configuration Management

```bash
# Pull current CMS configuration to a file
optimizely-cms-cli config pull --output current-config.json

# Push local configuration to CMS
optimizely-cms-cli config push optimizely.config.mjs

# Push with force (ignores data loss warnings)
optimizely-cms-cli config push optimizely.config.mjs --force

# Test changes without applying them
optimizely-cms-cli config push optimizely.config.mjs --dry-run
```

### Content Operations

```bash
# Delete content by key
optimizely-cms-cli content delete CONTENT_KEY_HERE

# View command help
optimizely-cms-cli content delete --help
```

### Authentication Management

```bash
# Login to new instance
optimizely-cms-cli login

# View credential file location
optimizely-cms-cli login --verbose

# Use specific host for commands
optimizely-cms-cli config push optimizely.config.mjs --host my-other-site.cms.optimizely.com
```

## Environment Variables

Set these for automated workflows:

```bash
# Default CMS host (avoids --host flag)
export OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# For CI/CD authentication (not recommended for development)
export OPTIMIZELY_CLIENT_ID=your_client_id
export OPTIMIZELY_CLIENT_SECRET=your_client_secret
```

## Package.json Scripts

Add these helpful scripts to your `package.json`:

```json
{
  "scripts": {
    "cms:push": "optimizely-cms-cli config push optimizely.config.mjs",
    "cms:push:force": "optimizely-cms-cli config push optimizely.config.mjs --force",
    "cms:pull": "optimizely-cms-cli config pull --output cms-backup.json",
    "cms:dry-run": "optimizely-cms-cli config push optimizely.config.mjs --dry-run",
    "predev": "npm run cms:push",
    "predeploy": "npm run cms:push:force"
  }
}
```

Usage:
```bash
# Deploy content types
npm run cms:push

# Test deployment
npm run cms:dry-run

# Backup current CMS config
npm run cms:pull
```

## Working with Multiple Environments

### Environment-Specific Configs

```bash
# Development
optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com

# Staging  
optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com

# Production (always dry-run first!)
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --dry-run
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --force
```

### Environment Scripts

```json
{
  "scripts": {
    "cms:dev": "optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com",
    "cms:staging": "optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com",
    "cms:prod:check": "optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --dry-run",
    "cms:prod:deploy": "optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --force"
  }
}
```

## Troubleshooting

### Common Issues

**"Authentication failed"**:
- Verify Client ID and Secret are correct
- Check that API key hasn't expired
- Ensure API key has sufficient permissions

**"Cannot connect to host"**:
- Verify CMS instance URL is correct
- Check network connectivity
- Ensure instance is accessible from your location

**"Command not found"**:
- Verify CLI is installed globally: `npm list -g @episerver/cms-cli`
- Check PATH includes global npm bin: `npm config get prefix`
- Try using full path: `$(npm config get prefix)/bin/optimizely-cms-cli`

**"Configuration parsing error"**:
- Check `optimizely.config.mjs` syntax
- Verify all imports are correct
- Ensure content type definitions are valid

### Debug Mode

Enable verbose logging:

```bash
# Verbose output for debugging
optimizely-cms-cli config push optimizely.config.mjs --verbose

# This will show:
# - Credential file location
# - API request details
# - Configuration parsing steps
# - Upload progress
```

### Credential File Location

Find your stored credentials:

```bash
# Show credential file path
optimizely-cms-cli login --verbose

# Common locations:
# macOS: ~/Library/Preferences/optimizely/config.json
# Linux: ~/.config/optimizely/config.json
# Windows: %APPDATA%/optimizely/config.json
```

### Reset Authentication

```bash
# Remove credential file to start fresh
rm ~/.config/optimizely/config.json  # Linux/macOS
del %APPDATA%\optimizely\config.json  # Windows

# Login again
optimizely-cms-cli login
```

## Next Steps

Congratulations! You've successfully set up the Optimizely CMS CLI and deployed your first content type. Here's what you can explore next:

1. **[Learn Authentication](./authentication.md)** - Master multi-instance and credential management
2. **[Explore Commands](./commands-reference.md)** - Discover all available CLI commands
3. **[Configuration Management](./configuration-management.md)** - Advanced push/pull workflows
4. **[Content Management](./content-management.md)** - Content operations and bulk management
5. **[Advanced Usage](./advanced-usage.md)** - CI/CD integration and automation

## Best Practices

### Development Workflow
1. **Always test with --dry-run first**
2. **Use version control for content type definitions**
3. **Maintain separate API keys for each environment**
4. **Include CMS operations in your npm scripts**

### Security
1. **Never commit API credentials to version control**
2. **Use environment variables for CI/CD**
3. **Regularly rotate API keys**
4. **Use minimum required permissions for API keys**

### Team Collaboration
1. **Share `optimizely.config.mjs` in version control**
2. **Document content type changes in commit messages**
3. **Use consistent naming conventions**
4. **Coordinate deployments between team members**

---

*You're now ready to integrate Optimizely CMS management into your development workflow! The CLI will help you maintain consistency across environments and enable true content-first development.*