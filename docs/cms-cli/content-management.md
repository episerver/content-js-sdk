# Content Management

The Optimizely CMS CLI provides content management capabilities for CRUD operations, bulk operations, and content automation. This guide covers content operations, scripting patterns, and content workflow automation.

## Overview

Content management in the CLI includes:
- **Content Operations**: Create, read, update, and delete content
- **Bulk Operations**: Mass content operations and data migration
- **Content Automation**: Scripted content workflows
- **Data Migration**: Moving content between environments

## Content Operations

### Content Deletion

The primary content operation currently available in the CLI:

```bash
# Delete content by key
optimizely-cms-cli content delete <content-key>

# Delete from specific environment
optimizely-cms-cli content delete 12345_67890 --host staging.cms.optimizely.com
```

#### Finding Content Keys

Content keys can be found in several ways:

**1. CMS Admin Panel:**
```
- Navigate to content in admin panel
- View content properties
- Find "Content ID" or "Key" field
```

**2. API Responses:**
```json
{
  "_metadata": {
    "key": "12345_67890",
    "url": { "default": "/articles/my-article/" },
    "types": ["Article"]
  }
}
```

**3. URL Parameters:**
```
Edit URL: https://cms.optimizely.com/edit/12345_67890
Content Key: 12345_67890
```

#### Content Deletion Examples

```bash
# Delete a specific article
optimizely-cms-cli content delete 12345_67890

# Delete from development environment
optimizely-cms-cli content delete 12345_67890 --host dev.cms.optimizely.com

# Delete with JSON output for automation
optimizely-cms-cli content delete 12345_67890 --json
```

#### Bulk Content Deletion

```bash
#!/bin/bash
# scripts/bulk-delete.sh

# List of content keys to delete
content_keys=(
  "12345_67890"
  "12345_67891" 
  "12345_67892"
  "12345_67893"
)

echo "🗑️  Bulk deleting ${#content_keys[@]} content items..."

for key in "${content_keys[@]}"; do
  echo "Deleting content: $key"
  
  if optimizely-cms-cli content delete "$key"; then
    echo "✅ Deleted: $key"
  else
    echo "❌ Failed to delete: $key"
  fi
  
  # Small delay to avoid rate limiting
  sleep 1
done

echo "🎉 Bulk deletion complete"
```

## Advanced Content Operations

While the CLI currently focuses on content type management, you can extend its functionality with custom scripts and API integrations.

### Content Querying with GraphQL

```javascript
// scripts/query-content.js
import { GraphClient } from '@episerver/cms-sdk';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY);

// Query all articles
const query = `
  query GetAllArticles {
    _Content(where: { _metadata: { types: { in: ["Article"] } } }) {
      items {
        _metadata {
          key
          url { default }
        }
        title
        publishDate
      }
    }
  }
`;

async function queryContent() {
  try {
    const result = await client.request(query);
    
    console.log(`Found ${result._Content.items.length} articles:`);
    
    result._Content.items.forEach(article => {
      console.log(`- ${article.title} (Key: ${article._metadata.key})`);
    });
    
    return result._Content.items;
  } catch (error) {
    console.error('Query failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  queryContent();
}

export { queryContent };
```

Usage:
```bash
# Set your Graph Single Key
export OPTIMIZELY_GRAPH_SINGLE_KEY=your_key_here

# Run the query
node scripts/query-content.js
```

### Content Creation via REST API

```javascript
// scripts/create-content.js
import fetch from 'node-fetch';

class ContentManager {
  constructor(cmsHost, clientId, clientSecret) {
    this.cmsHost = cmsHost;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
  }
  
  async authenticate() {
    const response = await fetch('https://api.cms.optimizely.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const data = await response.json();
    this.accessToken = data.access_token;
  }
  
  async createContent(contentData) {
    if (!this.accessToken) {
      await this.authenticate();
    }
    
    const response = await fetch(`https://api.cms.optimizely.com/preview3/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentData),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Content creation failed: ${error}`);
    }
    
    return response.json();
  }
  
  async updateContent(contentKey, contentData) {
    if (!this.accessToken) {
      await this.authenticate();
    }
    
    const response = await fetch(`https://api.cms.optimizely.com/preview3/content/${contentKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentData),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Content update failed: ${error}`);
    }
    
    return response.json();
  }
}

// Example usage
async function createSampleArticle() {
  const manager = new ContentManager(
    process.env.OPTIMIZELY_CMS_HOST,
    process.env.OPTIMIZELY_CLIENT_ID,
    process.env.OPTIMIZELY_CLIENT_SECRET
  );
  
  const articleData = {
    contentType: 'Article',
    properties: {
      title: 'Sample Article from CLI',
      content: '<p>This article was created via the CLI script.</p>',
      publishDate: new Date().toISOString(),
      featured: false
    }
  };
  
  try {
    const result = await manager.createContent(articleData);
    console.log('✅ Article created:', result.key);
    return result;
  } catch (error) {
    console.error('❌ Failed to create article:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleArticle();
}

export { ContentManager, createSampleArticle };
```

## Data Migration Scripts

### Export Content

```javascript
// scripts/export-content.js
import { GraphClient } from '@episerver/cms-sdk';
import { writeFileSync } from 'fs';

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY);

async function exportContent(contentType, outputFile) {
  console.log(`📤 Exporting ${contentType} content...`);
  
  const query = `
    query ExportContent($filter: _ContentWhereInput) {
      _Content(where: $filter) {
        items {
          _metadata {
            key
            url { default }
            types
            created
            modified
          }
          
          # Dynamic fields based on content type
          ... on ${contentType} {
            title
            content
            publishDate
            featured
            tags
          }
        }
      }
    }
  `;
  
  try {
    const result = await client.request(query, {
      filter: {
        _metadata: {
          types: { in: [contentType] }
        }
      }
    });
    
    const exportData = {
      contentType,
      exportDate: new Date().toISOString(),
      count: result._Content.items.length,
      items: result._Content.items
    };
    
    writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exported ${result._Content.items.length} ${contentType} items to ${outputFile}`);
    
    return exportData;
  } catch (error) {
    console.error(`❌ Export failed:`, error.message);
    throw error;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const contentType = process.argv[2];
  const outputFile = process.argv[3] || `${contentType.toLowerCase()}-export.json`;
  
  if (!contentType) {
    console.error('Usage: node export-content.js <ContentType> [outputFile]');
    process.exit(1);
  }
  
  exportContent(contentType, outputFile);
}

export { exportContent };
```

Usage:
```bash
# Export all articles
node scripts/export-content.js Article articles-backup.json

# Export all products
node scripts/export-content.js Product products-backup.json
```

### Import Content

```javascript
// scripts/import-content.js
import { readFileSync } from 'fs';
import { ContentManager } from './create-content.js';

async function importContent(importFile, targetEnvironment) {
  console.log(`📥 Importing content from ${importFile}...`);
  
  // Read export file
  const exportData = JSON.parse(readFileSync(importFile, 'utf8'));
  
  console.log(`Found ${exportData.count} ${exportData.contentType} items to import`);
  
  // Initialize content manager
  const manager = new ContentManager(
    targetEnvironment,
    process.env.OPTIMIZELY_CLIENT_ID,
    process.env.OPTIMIZELY_CLIENT_SECRET
  );
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of exportData.items) {
    try {
      // Transform export data to creation format
      const contentData = {
        contentType: exportData.contentType,
        properties: {
          title: item.title,
          content: item.content,
          publishDate: item.publishDate,
          featured: item.featured || false,
          tags: item.tags || []
        }
      };
      
      const result = await manager.createContent(contentData);
      console.log(`✅ Created: ${item.title} (${result.key})`);
      successCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to create: ${item.title} - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`🎉 Import complete: ${successCount} successful, ${errorCount} failed`);
  
  return { successCount, errorCount };
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const importFile = process.argv[2];
  const targetEnvironment = process.argv[3];
  
  if (!importFile || !targetEnvironment) {
    console.error('Usage: node import-content.js <importFile> <targetEnvironment>');
    console.error('Example: node import-content.js articles-backup.json staging.cms.optimizely.com');
    process.exit(1);
  }
  
  importContent(importFile, targetEnvironment);
}

export { importContent };
```

Usage:
```bash
# Import articles to staging
node scripts/import-content.js articles-backup.json staging.cms.optimizely.com

# Import products to development
node scripts/import-content.js products-backup.json dev.cms.optimizely.com
```

## Content Workflow Automation

### Content Publishing Workflow

```javascript
// scripts/content-workflow.js
import { GraphClient } from '@episerver/cms-sdk';
import { ContentManager } from './create-content.js';

class ContentWorkflow {
  constructor() {
    this.graphClient = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY);
    this.contentManager = new ContentManager(
      process.env.OPTIMIZELY_CMS_HOST,
      process.env.OPTIMIZELY_CLIENT_ID,
      process.env.OPTIMIZELY_CLIENT_SECRET
    );
  }
  
  async findDraftContent() {
    const query = `
      query FindDraftContent {
        _Content(where: { 
          _metadata: { 
            status: { eq: "Draft" },
            types: { in: ["Article", "Product"] }
          }
        }) {
          items {
            _metadata {
              key
              types
              status
            }
            title
            publishDate
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    return result._Content.items;
  }
  
  async findExpiredContent() {
    const now = new Date().toISOString();
    
    const query = `
      query FindExpiredContent {
        _Content(where: { 
          _and: [
            { _metadata: { status: { eq: "Published" } } },
            { expireDate: { lt: "${now}" } }
          ]
        }) {
          items {
            _metadata {
              key
              types
            }
            title
            expireDate
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    return result._Content.items;
  }
  
  async publishScheduledContent() {
    console.log('🔍 Finding content scheduled for publishing...');
    
    const now = new Date().toISOString();
    
    const query = `
      query FindScheduledContent {
        _Content(where: { 
          _and: [
            { _metadata: { status: { eq: "Draft" } } },
            { publishDate: { lte: "${now}" } }
          ]
        }) {
          items {
            _metadata {
              key
              types
            }
            title
            publishDate
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    const scheduledItems = result._Content.items;
    
    console.log(`Found ${scheduledItems.length} items ready for publishing`);
    
    for (const item of scheduledItems) {
      try {
        // Update content status to published
        await this.contentManager.updateContent(item._metadata.key, {
          status: 'Published'
        });
        
        console.log(`✅ Published: ${item.title}`);
      } catch (error) {
        console.error(`❌ Failed to publish: ${item.title} - ${error.message}`);
      }
    }
    
    return scheduledItems.length;
  }
  
  async unpublishExpiredContent() {
    console.log('🔍 Finding expired content...');
    
    const expiredItems = await this.findExpiredContent();
    
    console.log(`Found ${expiredItems.length} expired items`);
    
    for (const item of expiredItems) {
      try {
        // Update content status to archived
        await this.contentManager.updateContent(item._metadata.key, {
          status: 'Archived'
        });
        
        console.log(`✅ Archived: ${item.title}`);
      } catch (error) {
        console.error(`❌ Failed to archive: ${item.title} - ${error.message}`);
      }
    }
    
    return expiredItems.length;
  }
  
  async runWorkflow() {
    console.log('🚀 Starting content workflow...');
    
    try {
      const publishedCount = await this.publishScheduledContent();
      const archivedCount = await this.unpublishExpiredContent();
      
      console.log(`🎉 Workflow complete: ${publishedCount} published, ${archivedCount} archived`);
      
      return { publishedCount, archivedCount };
    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
      throw error;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const workflow = new ContentWorkflow();
  workflow.runWorkflow();
}

export { ContentWorkflow };
```

### Scheduled Content Management

```bash
#!/bin/bash
# scripts/scheduled-content.sh

echo "⏰ Running scheduled content management..."

# Set environment variables
export OPTIMIZELY_GRAPH_SINGLE_KEY="${OPTIMIZELY_GRAPH_SINGLE_KEY}"
export OPTIMIZELY_CMS_HOST="${OPTIMIZELY_CMS_HOST}"
export OPTIMIZELY_CLIENT_ID="${OPTIMIZELY_CLIENT_ID}"
export OPTIMIZELY_CLIENT_SECRET="${OPTIMIZELY_CLIENT_SECRET}"

# Run content workflow
node scripts/content-workflow.js

# Log results
echo "Content workflow completed at $(date)"
```

#### Cron Job Setup

```bash
# Add to crontab (run every hour)
0 * * * * /path/to/your/project/scripts/scheduled-content.sh >> /var/log/optimizely-content.log 2>&1

# Add to crontab (run daily at 2 AM)
0 2 * * * /path/to/your/project/scripts/scheduled-content.sh >> /var/log/optimizely-content.log 2>&1
```

## Content Validation Scripts

### Content Quality Checks

```javascript
// scripts/content-validation.js
import { GraphClient } from '@episerver/cms-sdk';

class ContentValidator {
  constructor() {
    this.graphClient = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY);
    this.issues = [];
  }
  
  async validateContent() {
    console.log('🔍 Running content validation...');
    
    await this.checkMissingTitles();
    await this.checkMissingContent();
    await this.checkFuturePublishDates();
    await this.checkDuplicateTitles();
    
    this.reportResults();
    
    return this.issues;
  }
  
  async checkMissingTitles() {
    const query = `
      query CheckMissingTitles {
        _Content(where: { 
          _and: [
            { _metadata: { types: { in: ["Article", "Product"] } } },
            { title: { eq: "" } }
          ]
        }) {
          items {
            _metadata { key, types, url { default } }
            title
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    
    result._Content.items.forEach(item => {
      this.issues.push({
        type: 'missing_title',
        severity: 'error',
        contentKey: item._metadata.key,
        contentType: item._metadata.types[0],
        url: item._metadata.url.default,
        message: 'Content missing title'
      });
    });
  }
  
  async checkMissingContent() {
    const query = `
      query CheckMissingContent {
        _Content(where: { 
          _and: [
            { _metadata: { types: { in: ["Article"] } } },
            { content: { eq: "" } }
          ]
        }) {
          items {
            _metadata { key, types, url { default } }
            title
            content
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    
    result._Content.items.forEach(item => {
      this.issues.push({
        type: 'missing_content',
        severity: 'warning',
        contentKey: item._metadata.key,
        contentType: item._metadata.types[0],
        url: item._metadata.url.default,
        title: item.title,
        message: 'Article missing content body'
      });
    });
  }
  
  async checkFuturePublishDates() {
    const now = new Date().toISOString();
    
    const query = `
      query CheckFuturePublishDates {
        _Content(where: { 
          _and: [
            { _metadata: { status: { eq: "Published" } } },
            { publishDate: { gt: "${now}" } }
          ]
        }) {
          items {
            _metadata { key, types, url { default } }
            title
            publishDate
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    
    result._Content.items.forEach(item => {
      this.issues.push({
        type: 'future_publish_date',
        severity: 'warning',
        contentKey: item._metadata.key,
        contentType: item._metadata.types[0],
        url: item._metadata.url.default,
        title: item.title,
        publishDate: item.publishDate,
        message: 'Published content has future publish date'
      });
    });
  }
  
  async checkDuplicateTitles() {
    const query = `
      query CheckDuplicateTitles {
        _Content(where: { 
          _metadata: { types: { in: ["Article", "Product"] } }
        }) {
          items {
            _metadata { key, types, url { default } }
            title
          }
        }
      }
    `;
    
    const result = await this.graphClient.request(query);
    const titleMap = new Map();
    
    // Group by title
    result._Content.items.forEach(item => {
      const title = item.title.toLowerCase().trim();
      if (!titleMap.has(title)) {
        titleMap.set(title, []);
      }
      titleMap.get(title).push(item);
    });
    
    // Find duplicates
    titleMap.forEach((items, title) => {
      if (items.length > 1) {
        items.forEach(item => {
          this.issues.push({
            type: 'duplicate_title',
            severity: 'info',
            contentKey: item._metadata.key,
            contentType: item._metadata.types[0],
            url: item._metadata.url.default,
            title: item.title,
            message: `Duplicate title found (${items.length} items with same title)`
          });
        });
      }
    });
  }
  
  reportResults() {
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const info = this.issues.filter(i => i.severity === 'info');
    
    console.log(`\n📊 Content Validation Results:`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Info: ${info.length}\n`);
    
    if (errors.length > 0) {
      console.log('❌ Errors:');
      errors.forEach(issue => {
        console.log(`   - ${issue.message} (${issue.contentKey})`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(issue => {
        console.log(`   - ${issue.message} (${issue.title})`);
      });
    }
    
    if (info.length > 0) {
      console.log('\nℹ️  Info:');
      info.forEach(issue => {
        console.log(`   - ${issue.message} (${issue.title})`);
      });
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ContentValidator();
  validator.validateContent().then(issues => {
    const errors = issues.filter(i => i.severity === 'error');
    process.exit(errors.length > 0 ? 1 : 0);
  });
}

export { ContentValidator };
```

## Package.json Scripts

Add these scripts to automate content operations:

```json
{
  "scripts": {
    "content:delete": "optimizely-cms-cli content delete",
    "content:export": "node scripts/export-content.js",
    "content:import": "node scripts/import-content.js", 
    "content:validate": "node scripts/content-validation.js",
    "content:workflow": "node scripts/content-workflow.js",
    "content:query": "node scripts/query-content.js",
    "content:backup": "npm run content:export Article articles-backup.json && npm run content:export Product products-backup.json"
  }
}
```

Usage:
```bash
# Delete specific content
npm run content:delete 12345_67890

# Export all articles
npm run content:export Article

# Validate content quality
npm run content:validate

# Run content workflow
npm run content:workflow

# Backup all content
npm run content:backup
```

## Best Practices

### Content Management Safety

1. **Always backup before bulk operations**
2. **Test scripts on development environment first**
3. **Use rate limiting to avoid API throttling**
4. **Implement proper error handling and logging**
5. **Validate content before operations**

### Automation Guidelines

1. **Use environment variables for configuration**
2. **Implement idempotent operations**
3. **Add comprehensive logging**
4. **Set up monitoring and alerts**
5. **Document all automation scripts**

### Performance Considerations

1. **Implement pagination for large datasets**
2. **Use batch operations when available**
3. **Add delays between API calls**
4. **Monitor API rate limits**
5. **Cache frequently accessed data**

---

*Content management with the CLI enables powerful automation and workflow capabilities. Use these patterns to build reliable content operations that scale with your organization's needs.*