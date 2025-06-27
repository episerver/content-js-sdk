# Configuration Management

The Optimizely CMS CLI provides powerful configuration management capabilities, allowing you to version control your content types and deploy them across environments. This guide covers push/pull workflows, manifest generation, and advanced configuration patterns.

## Overview

Configuration management in the CLI includes:
- **Push Workflows**: Deploy local content types to CMS
- **Pull Workflows**: Download current CMS configuration  
- **Manifest Generation**: Automatic transformation of content types
- **Environment Sync**: Consistent deployment across environments
- **Version Control Integration**: Content types as code

## Configuration Files

### Build Configuration (`optimizely.config.mjs`)

The build configuration tells the CLI where to find your content types and components:

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    './src/content-types/**/*.ts',
    './src/blocks/**/*.tsx'
  ]
});
```

#### Advanced Build Configuration

```javascript
import { buildConfig } from '@episerver/cms-sdk';
import { glob } from 'glob';

// Dynamic component discovery
const componentPaths = [
  ...glob.sync('./src/components/**/*.tsx'),
  ...glob.sync('./src/blocks/**/*.tsx'),
  ...glob.sync('./content-types/**/*.ts')
];

export default buildConfig({
  components: componentPaths
});
```

#### Multiple Configuration Files

For complex projects:

```javascript
// optimizely.config.mjs (main)
import { buildConfig } from '@episerver/cms-sdk';
import { getComponentPaths } from './config/components.js';

export default buildConfig({
  components: getComponentPaths()
});
```

```javascript
// config/components.js
export function getComponentPaths() {
  return [
    // Core content types
    './src/content-types/**/*.ts',
    
    // Page components
    './src/components/pages/**/*.tsx',
    
    // Block components  
    './src/components/blocks/**/*.tsx',
    
    // Layout components
    './src/components/layouts/**/*.tsx'
  ];
}
```

### Content Type Definitions

Content types are defined using the SDK:

```typescript
// src/content-types/Article.ts
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
      group: 'Content'
    },
    content: {
      type: 'richText',
      displayName: 'Content',
      group: 'Content'
    },
    publishDate: {
      type: 'dateTime',
      displayName: 'Publish Date',
      group: 'Metadata'
    }
  }
});
```

## Push Workflows

### Basic Push Operation

Deploy your local content types to the CMS:

```bash
# Basic push
optimizely-cms-cli config push optimizely.config.mjs

# The CLI will:
# 1. Parse your build configuration
# 2. Discover content type files
# 3. Generate manifest JSON
# 4. Upload to CMS
# 5. Report results
```

### Push with Safety Checks

```bash
# Dry run - see what would happen without applying changes
optimizely-cms-cli config push optimizely.config.mjs --dry-run

# Output manifest to file for inspection
optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run

# Force push (ignore data loss warnings)
optimizely-cms-cli config push optimizely.config.mjs --force
```

### Environment-Specific Push

```bash
# Development environment
optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com

# Staging environment  
optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com

# Production environment (always dry-run first!)
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --dry-run
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --force
```

### Push Workflow Examples

#### Development Workflow

```bash
#!/bin/bash
# scripts/deploy-dev.sh

echo "🚀 Deploying to Development Environment"

# Set environment
export OPTIMIZELY_CMS_HOST=dev.cms.optimizely.com

# Dry run first
echo "📋 Running dry-run check..."
if optimizely-cms-cli config push optimizely.config.mjs --dry-run; then
    echo "✅ Dry run successful"
else
    echo "❌ Dry run failed"
    exit 1
fi

# Deploy for real
echo "🔄 Deploying content types..."
optimizely-cms-cli config push optimizely.config.mjs

echo "✅ Development deployment complete"
```

#### Production Workflow

```bash
#!/bin/bash
# scripts/deploy-prod.sh

echo "🚨 PRODUCTION DEPLOYMENT"
echo "This will update production content types!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

# Set environment
export OPTIMIZELY_CMS_HOST=prod.cms.optimizely.com

# Backup current configuration
echo "📦 Backing up current configuration..."
optimizely-cms-cli config pull --output "backup-$(date +%Y%m%d-%H%M%S).json"

# Dry run with detailed output
echo "📋 Running production dry-run..."
optimizely-cms-cli config push optimizely.config.mjs --dry-run --verbose

read -p "Proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy to production
echo "🔄 Deploying to production..."
optimizely-cms-cli config push optimizely.config.mjs --force

echo "✅ Production deployment complete"
```

## Pull Workflows

### Basic Pull Operation

Download current content types from CMS:

```bash
# Pull current configuration
optimizely-cms-cli config pull --output current-config.json

# Pull from specific environment
optimizely-cms-cli config pull --output staging-config.json --host staging.cms.optimizely.com
```

### Configuration Backup

```bash
#!/bin/bash
# scripts/backup-config.sh

# Create backup directory
mkdir -p backups

# Backup from all environments
environments=("dev" "staging" "prod")

for env in "${environments[@]}"; do
    echo "📦 Backing up $env environment..."
    
    timestamp=$(date +%Y%m%d-%H%M%S)
    filename="backups/${env}-config-${timestamp}.json"
    
    optimizely-cms-cli config pull \
        --output "$filename" \
        --host "${env}.cms.optimizely.com"
    
    echo "✅ Backup saved: $filename"
done

echo "🎉 All environments backed up!"
```

### Configuration Comparison

```bash
#!/bin/bash
# scripts/compare-environments.sh

# Pull configurations
optimizely-cms-cli config pull --output dev-config.json --host dev.cms.optimizely.com
optimizely-cms-cli config pull --output prod-config.json --host prod.cms.optimizely.com

# Compare configurations
echo "📊 Comparing dev vs production configurations..."

# Use jq for JSON comparison
if command -v jq &> /dev/null; then
    echo "Content Types in Dev but not Prod:"
    jq -r '.contentTypes[].key' dev-config.json | sort > dev-types.txt
    jq -r '.contentTypes[].key' prod-config.json | sort > prod-types.txt
    comm -23 dev-types.txt prod-types.txt
    
    echo "Content Types in Prod but not Dev:"
    comm -13 dev-types.txt prod-types.txt
    
    # Cleanup
    rm dev-types.txt prod-types.txt
else
    echo "Install jq for detailed comparison: brew install jq"
fi

# Cleanup
rm dev-config.json prod-config.json
```

## Manifest Generation

The CLI automatically converts your content type definitions into CMS manifest format.

### Understanding Manifests

**Your Content Type:**
```typescript
export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {
    title: { type: 'string', required: true },
    content: { type: 'richText' }
  }
});
```

**Generated Manifest:**
```json
{
  "contentTypes": [
    {
      "key": "Article",
      "displayName": "Article",
      "baseType": "_page",
      "properties": {
        "title": {
          "type": "string",
          "required": true
        },
        "content": {
          "type": "richText"
        }
      }
    }
  ],
  "displayTemplates": []
}
```

### Manifest Inspection

```bash
# Generate manifest without uploading
optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run

# Inspect the generated manifest
cat manifest.json | jq '.'

# Count content types
cat manifest.json | jq '.contentTypes | length'

# List content type keys
cat manifest.json | jq -r '.contentTypes[].key'
```

### Custom Manifest Processing

```javascript
// scripts/process-manifest.js
import fs from 'fs';

// Read generated manifest
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Add custom processing
manifest.contentTypes.forEach(contentType => {
  // Add creation timestamp
  contentType.metadata = {
    createdAt: new Date().toISOString(),
    deployedBy: process.env.USER || 'unknown'
  };
  
  // Validate properties
  if (!contentType.properties || Object.keys(contentType.properties).length === 0) {
    console.warn(`Warning: Content type '${contentType.key}' has no properties`);
  }
});

// Save processed manifest
fs.writeFileSync('processed-manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest processed successfully');
```

## Environment Synchronization

### Multi-Environment Setup

Typical environment progression:

```
Development → Staging → Production
    ↓            ↓          ↓
Local Env    Test Env   Live Env
```

### Sync Workflows

#### Development to Staging

```bash
#!/bin/bash
# scripts/sync-dev-to-staging.sh

echo "🔄 Syncing Development to Staging"

# Backup staging first
echo "📦 Backing up staging..."
optimizely-cms-cli config pull \
    --output "staging-backup-$(date +%Y%m%d-%H%M%S).json" \
    --host staging.cms.optimizely.com

# Deploy to staging
echo "🚀 Deploying to staging..."
optimizely-cms-cli config push optimizely.config.mjs \
    --host staging.cms.optimizely.com \
    --force

echo "✅ Sync complete"
```

#### Staging to Production

```bash
#!/bin/bash
# scripts/sync-staging-to-prod.sh

echo "🚨 CRITICAL: Syncing Staging to Production"
echo "This will overwrite production content types!"

# Double confirmation
read -p "Type 'SYNC TO PRODUCTION' to confirm: " confirm
if [ "$confirm" != "SYNC TO PRODUCTION" ]; then
    echo "Sync cancelled"
    exit 0
fi

# Backup production
echo "📦 Backing up production..."
optimizely-cms-cli config pull \
    --output "prod-backup-$(date +%Y%m%d-%H%M%S).json" \
    --host prod.cms.optimizely.com

# Pull staging config
echo "📥 Downloading staging configuration..."
optimizely-cms-cli config pull \
    --output staging-config.json \
    --host staging.cms.optimizely.com

# Show what will change
echo "📋 Changes to be applied to production:"
# Add diff logic here if needed

# Final confirmation
read -p "Proceed with production deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    rm staging-config.json
    exit 0
fi

# Deploy to production
echo "🚀 Deploying to production..."
optimizely-cms-cli config push optimizely.config.mjs \
    --host prod.cms.optimizely.com \
    --force

# Cleanup
rm staging-config.json

echo "✅ Production sync complete"
```

### Configuration Drift Detection

```bash
#!/bin/bash
# scripts/detect-drift.sh

echo "🔍 Detecting configuration drift across environments"

# Pull from all environments
optimizely-cms-cli config pull --output dev.json --host dev.cms.optimizely.com
optimizely-cms-cli config pull --output staging.json --host staging.cms.optimizely.com
optimizely-cms-cli config pull --output prod.json --host prod.cms.optimizely.com

# Generate local manifest
optimizely-cms-cli config push optimizely.config.mjs --output local.json --dry-run

# Compare configurations
echo "📊 Configuration Analysis:"

files=("local.json" "dev.json" "staging.json" "prod.json")
labels=("Local" "Dev" "Staging" "Prod")

for i in "${!files[@]}"; do
    file="${files[$i]}"
    label="${labels[$i]}"
    
    if [ -f "$file" ]; then
        count=$(jq '.contentTypes | length' "$file")
        echo "$label: $count content types"
    fi
done

# Detect drift (simplified)
local_types=$(jq -r '.contentTypes[].key' local.json | sort)
prod_types=$(jq -r '.contentTypes[].key' prod.json | sort)

echo ""
echo "📈 Drift Analysis (Local vs Production):"
echo "Content types in local but not production:"
comm -23 <(echo "$local_types") <(echo "$prod_types")

echo "Content types in production but not local:"
comm -13 <(echo "$local_types") <(echo "$prod_types")

# Cleanup
rm dev.json staging.json prod.json local.json

echo "✅ Drift detection complete"
```

## Advanced Configuration Patterns

### Conditional Content Types

```typescript
// src/content-types/index.ts
import { contentType } from '@episerver/cms-sdk';

// Base content types (always deployed)
export const ArticleContentType = contentType({
  key: 'Article',
  // ... properties
});

// Environment-specific content types
export const DeveloperContentTypes = [
  contentType({
    key: 'TestContent',
    displayName: 'Test Content (Dev Only)',
    baseType: '_page',
    properties: {
      testData: { type: 'string' }
    }
  })
];

// Export based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const AllContentTypes = [
  ArticleContentType,
  ...(isDevelopment ? DeveloperContentTypes : [])
];
```

### Feature Flag Integration

```javascript
// optimizely.config.mjs
import { buildConfig } from '@episerver/cms-sdk';

// Feature flags
const features = {
  enableCommerce: process.env.FEATURE_COMMERCE === 'true',
  enableBlogs: process.env.FEATURE_BLOGS === 'true',
  enableEvents: process.env.FEATURE_EVENTS === 'true'
};

// Conditional component paths
const componentPaths = [
  './src/content-types/core/**/*.ts', // Always included
];

if (features.enableCommerce) {
  componentPaths.push('./src/content-types/commerce/**/*.ts');
}

if (features.enableBlogs) {
  componentPaths.push('./src/content-types/blog/**/*.ts');
}

if (features.enableEvents) {
  componentPaths.push('./src/content-types/events/**/*.ts');
}

export default buildConfig({
  components: componentPaths
});
```

Usage:
```bash
# Deploy with commerce features
FEATURE_COMMERCE=true optimizely-cms-cli config push optimizely.config.mjs

# Deploy basic features only
optimizely-cms-cli config push optimizely.config.mjs
```

### Configuration Validation

```javascript
// scripts/validate-config.js
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Validating configuration...');

try {
  // Generate manifest
  execSync('optimizely-cms-cli config push optimizely.config.mjs --output temp-manifest.json --dry-run', {
    stdio: 'inherit'
  });
  
  // Read and validate manifest
  const manifest = JSON.parse(readFileSync('temp-manifest.json', 'utf8'));
  
  // Validation rules
  const errors = [];
  
  // Check for content types without properties
  manifest.contentTypes.forEach(ct => {
    if (!ct.properties || Object.keys(ct.properties).length === 0) {
      errors.push(`Content type '${ct.key}' has no properties`);
    }
    
    // Check for required display names
    if (!ct.displayName) {
      errors.push(`Content type '${ct.key}' missing displayName`);
    }
    
    // Validate property structure
    Object.entries(ct.properties || {}).forEach(([propKey, prop]) => {
      if (!prop.type) {
        errors.push(`Property '${propKey}' in '${ct.key}' missing type`);
      }
    });
  });
  
  // Report results
  if (errors.length === 0) {
    console.log('✅ Configuration validation passed');
  } else {
    console.log('❌ Configuration validation failed:');
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  try {
    execSync('rm temp-manifest.json');
  } catch {}
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/content-types.yml
name: Deploy Content Types

on:
  push:
    branches: [main, develop]
    paths: 
      - 'src/content-types/**'
      - 'optimizely.config.mjs'
  
  pull_request:
    paths:
      - 'src/content-types/**'
      - 'optimizely.config.mjs'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          npm install -g @episerver/cms-cli
      
      - name: Validate configuration
        run: |
          optimizely-cms-cli config push optimizely.config.mjs --dry-run
          node scripts/validate-config.js

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: validate
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli
      
      - name: Deploy to Staging
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.STAGING_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.STAGING_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.STAGING_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config push optimizely.config.mjs --force

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: validate
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli
      
      - name: Backup Production
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.PROD_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.PROD_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.PROD_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config pull --output "backup-$(date +%Y%m%d-%H%M%S).json"
      
      - name: Deploy to Production
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.PROD_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.PROD_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.PROD_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config push optimizely.config.mjs --force
```

### Package.json Scripts

```json
{
  "scripts": {
    "cms:validate": "optimizely-cms-cli config push optimizely.config.mjs --dry-run",
    "cms:manifest": "optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run",
    "cms:push": "optimizely-cms-cli config push optimizely.config.mjs",
    "cms:push:force": "optimizely-cms-cli config push optimizely.config.mjs --force",
    "cms:pull": "optimizely-cms-cli config pull --output cms-config.json",
    "cms:backup": "optimizely-cms-cli config pull --output backup-$(date +%Y%m%d-%H%M%S).json",
    "cms:dev": "optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com",
    "cms:staging": "optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com --force",
    "cms:prod": "optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com --force",
    "predev": "npm run cms:dev",
    "predeploy": "npm run cms:validate"
  }
}
```

## Troubleshooting

### Common Issues

**Configuration parsing errors:**
```bash
# Check configuration syntax
node -c optimizely.config.mjs

# Test manifest generation
optimizely-cms-cli config push optimizely.config.mjs --output test.json --dry-run
```

**Content type not found:**
```bash
# Verify file paths in build config
# Check content type exports
# Ensure proper import statements
```

**Manifest validation errors:**
```bash
# Run dry-run first
optimizely-cms-cli config push optimizely.config.mjs --dry-run --verbose

# Check CLI output for specific validation errors
```

### Debug Configuration

```bash
# Verbose output for troubleshooting
optimizely-cms-cli config push optimizely.config.mjs --dry-run --verbose

# This shows:
# - Configuration file parsing
# - Content type discovery
# - Manifest generation steps
# - Validation results
```

---

*Configuration management is the foundation of content-first development. Use these patterns to maintain consistency across environments and enable reliable deployment workflows.*