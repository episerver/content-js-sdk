# @episerver/cms-cli Documentation

The Optimizely CMS CLI is a powerful command-line tool for developers and DevOps teams to manage content types, configurations, and content operations with Optimizely CMS. It enables automated deployment workflows and seamless integration with CI/CD pipelines.

## 🌟 Key Features

- **Authentication Management**: OAuth2 integration with multiple CMS instances
- **Configuration Sync**: Push and pull content types and display templates
- **Content Operations**: Create, read, update, and delete content programmatically
- **Developer Workflow**: Integrate CMS management into your development process
- **CI/CD Ready**: Automate content type deployments and configuration sync

## 📚 Documentation Navigation

### Getting Started
- **[Getting Started](./getting-started.md)** - Installation, authentication, and first commands

### Core Features
- **[Authentication](./authentication.md)** - OAuth setup and credential management
- **[Commands Reference](./commands-reference.md)** - Complete command reference with examples
- **[Configuration Management](./configuration-management.md)** - Push/pull workflows and manifests

### Content & Operations
- **[Content Management](./content-management.md)** - Content CRUD operations and bulk management

### Advanced Usage
- **[Advanced Usage](./advanced-usage.md)** - Scripting, automation, and CI/CD integration

## 🚀 Quick Start

### 1. Installation

```bash
# Global installation
npm install @episerver/cms-cli -g

# Or run without installation
npx @episerver/cms-cli

# Verify installation
optimizely-cms-cli --version
```

### 2. Authentication

```bash
# Authenticate with your CMS instance
optimizely-cms-cli login

# The CLI will prompt for:
# - Instance URL (e.g., my-site.cms.optimizely.com)
# - Client ID (from CMS API Keys)
# - Client Secret (from CMS API Keys)
```

### 3. Basic Commands

```bash
# Push local content types to CMS
optimizely-cms-cli config push optimizely.config.mjs

# Pull current configuration from CMS
optimizely-cms-cli config pull --output current-config.json

# Delete content by key
optimizely-cms-cli content delete CONTENT_KEY

# View all available commands
optimizely-cms-cli --help
```

## 🏗️ Architecture

The CLI integrates with Optimizely CMS through multiple APIs:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Project                             │
├─────────────────────────────────────────────────────────────┤
│  Content Types  │  Build Config  │  Components             │
├─────────────────────────────────────────────────────────────┤
│                @episerver/cms-cli                           │
├─────────────────────────────────────────────────────────────┤
│  OAuth Client  │  Config Parser │  Manifest Generator      │
├─────────────────────────────────────────────────────────────┤
│           Optimizely CMS API & Content Graph                │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Command Categories

### Authentication Commands
- `login` - Authenticate with CMS instance
- Credential management across multiple instances

### Configuration Commands  
- `config push` - Upload content types and templates to CMS
- `config pull` - Download current CMS configuration

### Content Commands
- `content delete` - Remove content by key

### Developer Commands
- `danger delete-all-content-types` - Bulk operations (use with caution)

## 💡 Common Workflows

### Development Workflow

```bash
# 1. Define content types in code
cat > src/content-types/Article.ts << EOF
export const ArticleContentType = contentType({
  key: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string', required: true },
    content: { type: 'richText' }
  }
});
EOF

# 2. Create build configuration
cat > optimizely.config.mjs << EOF
import { buildConfig } from '@episerver/cms-sdk';
export default buildConfig({
  components: ['./src/components/**/*.tsx']
});
EOF

# 3. Push to CMS
optimizely-cms-cli config push optimizely.config.mjs
```

### CI/CD Integration

```yaml
# .github/workflows/deploy-content-types.yml
name: Deploy Content Types

on:
  push:
    branches: [main]
    paths: ['src/content-types/**', 'optimizely.config.mjs']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy content types
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.OPTIMIZELY_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.OPTIMIZELY_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.OPTIMIZELY_CLIENT_SECRET }}
        run: |
          echo "$OPTIMIZELY_CMS_HOST" | optimizely-cms-cli login --non-interactive
          optimizely-cms-cli config push optimizely.config.mjs --force
```

### Environment Management

```bash
# Development
optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com

# Staging
optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com

# Production (with safety checks)
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --dry-run
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com
```

## 🎯 Use Cases

### Content-First Development
Perfect for teams that want to version control their content structure and deploy it alongside code.

### Multi-Environment Deployment
Sync content types across development, staging, and production environments.

### Team Collaboration
Enable developers to work with content types in their preferred IDE while maintaining CMS integration.

### Automated Operations
Integrate content management into CI/CD pipelines for automated deployments.

## 🔧 Configuration Files

### Build Configuration (`optimizely.config.mjs`)

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    './src/blocks/**/*.tsx'
  ]
});
```

### Environment Variables

```bash
# Optional: Default CMS host to avoid --host flag
OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# Optional: Authentication credentials for CI/CD
OPTIMIZELY_CLIENT_ID=your_client_id
OPTIMIZELY_CLIENT_SECRET=your_client_secret
```

### Credential Storage

The CLI stores credentials securely in your system:

```bash
# View credential file location
optimizely-cms-cli login --verbose

# Typical locations:
# macOS: ~/Library/Preferences/optimizely/config.json
# Linux: ~/.config/optimizely/config.json  
# Windows: %APPDATA%/optimizely/config.json
```

## 🚨 Safety Features

### Dry Run Mode
Test changes without affecting CMS:
```bash
optimizely-cms-cli config push optimizely.config.mjs --dry-run
```

### Force Mode
Override safety checks (use with caution):
```bash
optimizely-cms-cli config push optimizely.config.mjs --force
```

### Data Loss Warnings
The CLI warns about operations that might cause data loss:
- Removing required properties
- Changing property types
- Deleting content types with existing content

## 🔗 Integration Examples

### Next.js Integration

```json
{
  "scripts": {
    "cms:push": "optimizely-cms-cli config push optimizely.config.mjs",
    "cms:pull": "optimizely-cms-cli config pull --output cms-config.json",
    "cms:deploy": "npm run build && npm run cms:push",
    "dev": "npm run cms:push && next dev"
  }
}
```

### Docker Integration

```dockerfile
FROM node:18-alpine

# Install CLI globally
RUN npm install -g @episerver/cms-cli

# Copy project files
COPY . /app
WORKDIR /app

# Deploy content types
RUN optimizely-cms-cli config push optimizely.config.mjs --force

# Start application
CMD ["npm", "start"]
```

### Package.json Scripts

```json
{
  "scripts": {
    "predev": "optimizely-cms-cli config push optimizely.config.mjs",
    "predeploy": "optimizely-cms-cli config push optimizely.config.mjs --force",
    "cms:sync": "optimizely-cms-cli config pull --output backup.json && optimizely-cms-cli config push optimizely.config.mjs"
  }
}
```

## 🆘 Getting Help

### Built-in Help
```bash
# General help
optimizely-cms-cli --help

# Command-specific help
optimizely-cms-cli config push --help
optimizely-cms-cli content delete --help
```

### Verbose Output
```bash
# Enable detailed logging
optimizely-cms-cli config push optimizely.config.mjs --verbose
```

### Common Issues
- **Authentication errors**: Check your Client ID and Secret in CMS API Keys
- **Permission errors**: Ensure your API key has sufficient permissions
- **Host connection**: Verify your CMS instance URL is correct and accessible

## 🔗 Next Steps

1. **[Get Started](./getting-started.md)** - Install and authenticate with your first CMS
2. **[Learn Authentication](./authentication.md)** - Master credential management
3. **[Explore Commands](./commands-reference.md)** - Discover all available commands
4. **[Automate Workflows](./advanced-usage.md)** - Integrate with CI/CD pipelines

---

*The CMS CLI empowers developers to manage Optimizely CMS with the same tools and workflows they use for code. Start with the **[Getting Started guide](./getting-started.md)** to begin automating your CMS operations!*