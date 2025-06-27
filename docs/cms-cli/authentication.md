# Authentication

The Optimizely CMS CLI uses OAuth2 Client Credentials flow for secure authentication with your CMS instances. This guide covers authentication setup, credential management, and security best practices.

## Overview

The CLI authentication system supports:
- **OAuth2 Client Credentials Flow**: Industry-standard authentication
- **Multiple Instance Management**: Work with dev, staging, and production environments
- **Secure Storage**: Credentials stored in system-specific secure locations
- **CI/CD Integration**: Environment variable support for automation

## Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CMS CLI       │    │  Optimizely     │    │   Your CMS      │
│                 │    │  API Gateway    │    │   Instance      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Client Credentials │                       │
         ├──────────────────────→│                       │
         │                       │ 2. Validate & Token  │
         │                       ├──────────────────────→│
         │                       │ 3. Access Token      │
         │ 4. Access Token       │←──────────────────────┤
         │←──────────────────────┤                       │
         │ 5. API Calls + Token  │                       │
         ├──────────────────────────────────────────────→│
```

## CMS API Key Setup

### 1. Access CMS Admin Panel

Navigate to your Optimizely CMS instance and log in as an administrator:

```
https://your-site.cms.optimizely.com/
```

### 2. Create API Key

1. **Navigate to API Keys**:
   - Go to **Settings** → **API Keys**
   - Click **"Create API Key"**

2. **Configure API Key**:
   - **Name**: Give it a descriptive name (e.g., "CLI Development Key")
   - **Description**: Document its purpose
   - **Authentication Type**: Select **"Client Credentials"**

3. **Set Permissions**:
   
   **Required Scopes for CLI:**
   ```
   ✓ Content Management API
   ✓ Content Types API  
   ✓ Configuration API
   ✓ Content Delivery API (for read operations)
   ```

   **Optional Scopes (for extended functionality):**
   ```
   ✓ User Management API (if managing users)
   ✓ Analytics API (if accessing analytics)
   ✓ Commerce API (if using commerce features)
   ```

4. **Create and Save Credentials**:
   - Click **"Create API Key"**
   - **Copy Client ID** immediately
   - **Copy Client Secret** immediately (shown only once!)
   - Store both securely

### 3. API Key Best Practices

#### Environment-Specific Keys

Create separate API keys for each environment:

```
Development Key:
- Name: "CLI Development - [Your Name]"
- Permissions: Full access for development
- Rotation: Monthly

Staging Key:
- Name: "CLI Staging - Deployment"
- Permissions: Content Types + Configuration
- Rotation: Quarterly

Production Key:
- Name: "CLI Production - Deployment"
- Permissions: Minimal required (Content Types only)
- Rotation: Quarterly with change management
```

#### Permission Principles

Follow the principle of least privilege:

```
Development Environment:
✓ Content Management API    (create test content)
✓ Content Types API         (deploy content types)
✓ Configuration API         (full configuration access)
✓ Content Delivery API      (read content)

Production Environment:
✓ Content Types API         (deploy content types only)
✓ Configuration API         (configuration updates only)
✗ Content Management API    (prevent accidental content changes)
```

## CLI Authentication

### Interactive Login

The primary way to authenticate with the CLI:

```bash
# Start authentication
optimizely-cms-cli login

# CLI will prompt for:
# 1. Instance URL
# 2. Client ID  
# 3. Client Secret
```

#### Example Session

```bash
$ optimizely-cms-cli login

? Enter the instance URL (<<something>>.cms.optimizely.com) › 
my-site.cms.optimizely.com

? Enter Client ID › 
abc123def456ghi789

? Enter Client Secret › 
[hidden - type your client secret]

⠋ Checking your credentials...
✓ You are now logged in! Your credentials are stored in /Users/username/.config/optimizely/config.json
```

#### URL Format Options

The CLI accepts various URL formats:

```bash
# Recommended format
my-site.cms.optimizely.com

# Also accepted
https://my-site.cms.optimizely.com
https://my-site.cms.optimizely.com/

# Custom domains (if configured)
cms.mycompany.com
```

### Multiple Instance Management

The CLI can manage credentials for multiple CMS instances:

```bash
# Login to development environment
optimizely-cms-cli login
# Enter: dev.cms.optimizely.com + dev credentials

# Login to staging environment
optimizely-cms-cli login  
# Enter: staging.cms.optimizely.com + staging credentials

# Login to production environment
optimizely-cms-cli login
# Enter: prod.cms.optimizely.com + production credentials
```

#### Using Specific Instances

```bash
# Use development environment
optimizely-cms-cli config push optimizely.config.mjs --host dev.cms.optimizely.com

# Use staging environment
optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com

# Use production environment
optimizely-cms-cli config push optimizely.config.mjs --host prod.cms.optimizely.com
```

#### Default Instance Selection

If you have multiple instances configured, the CLI will:

1. **Use --host flag** if provided
2. **Use OPTIMIZELY_CMS_HOST environment variable** if set
3. **Use single configured instance** if only one exists
4. **Prompt for selection** if multiple instances exist

```bash
# Set default instance
export OPTIMIZELY_CMS_HOST=dev.cms.optimizely.com

# Commands will use dev by default
optimizely-cms-cli config push optimizely.config.mjs
```

### Credential Storage

#### Storage Locations

Credentials are stored securely in platform-specific locations:

**macOS:**
```bash
~/Library/Preferences/optimizely/config.json
```

**Linux:**
```bash
~/.config/optimizely/config.json
```

**Windows:**
```bash
%APPDATA%/optimizely/config.json
```

#### Storage Format

```json
{
  "cms": {
    "https://dev.cms.optimizely.com/": {
      "clientId": "abc123def456",
      "clientSecret": "secret_value_here"
    },
    "https://prod.cms.optimizely.com/": {
      "clientId": "xyz789uvw012", 
      "clientSecret": "different_secret_here"
    }
  }
}
```

#### Credential Security

- **File Permissions**: Automatically set to user-read-only (600)
- **Encryption**: Stored as plain text (secure file permissions relied upon)
- **Access**: Only accessible by the user who created them

#### View Credential Location

```bash
# Show where credentials are stored
optimizely-cms-cli login --verbose

# Output includes:
# Credentials file: /Users/username/.config/optimizely/config.json
```

## CI/CD Authentication

For automated environments like GitHub Actions, Jenkins, etc.

### Environment Variables

Set these in your CI/CD environment:

```bash
# Required for authentication
OPTIMIZELY_CLIENT_ID=your_client_id_here
OPTIMIZELY_CLIENT_SECRET=your_client_secret_here

# Required for targeting correct instance  
OPTIMIZELY_CMS_HOST=your-site.cms.optimizely.com
```

### GitHub Actions Example

```yaml
# .github/workflows/deploy-content-types.yml
name: Deploy Content Types

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli
      
      - name: Deploy Content Types
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.OPTIMIZELY_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.OPTIMIZELY_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.OPTIMIZELY_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config push optimizely.config.mjs --force
```

### Secret Management

Store credentials securely in your CI/CD platform:

**GitHub Secrets:**
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `OPTIMIZELY_CMS_HOST`
   - `OPTIMIZELY_CLIENT_ID`
   - `OPTIMIZELY_CLIENT_SECRET`

**Jenkins Credentials:**
```groovy
pipeline {
    environment {
        OPTIMIZELY_CREDENTIALS = credentials('optimizely-credentials')
        OPTIMIZELY_CMS_HOST = 'my-site.cms.optimizely.com'
    }
    stages {
        stage('Deploy') {
            steps {
                sh 'optimizely-cms-cli config push optimizely.config.mjs'
            }
        }
    }
}
```

**Azure DevOps:**
```yaml
variables:
- group: optimizely-credentials

steps:
- script: |
    export OPTIMIZELY_CLIENT_ID=$(OPTIMIZELY_CLIENT_ID)
    export OPTIMIZELY_CLIENT_SECRET=$(OPTIMIZELY_CLIENT_SECRET)
    export OPTIMIZELY_CMS_HOST=$(OPTIMIZELY_CMS_HOST)
    optimizely-cms-cli config push optimizely.config.mjs
```

### Non-Interactive Authentication

For CI/CD environments, credentials from environment variables are used automatically:

```bash
# These environment variables enable automatic authentication:
OPTIMIZELY_CLIENT_ID=abc123
OPTIMIZELY_CLIENT_SECRET=secret123
OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# Commands work without login:
optimizely-cms-cli config push optimizely.config.mjs
optimizely-cms-cli config pull --output backup.json
```

## Credential Management

### Viewing Stored Credentials

```bash
# List configured instances (without showing secrets)
optimizely-cms-cli login --verbose

# Manually inspect credential file (use caution)
cat ~/.config/optimizely/config.json  # Linux/macOS
type %APPDATA%\optimizely\config.json  # Windows
```

### Updating Credentials

```bash
# Re-authenticate with existing instance (overwrites)
optimizely-cms-cli login
# Enter same instance URL with new credentials

# CLI will prompt:
# "Credentials found for my-site.cms.optimizely.com. Do you want to override them?"
# Answer: Yes
```

### Removing Credentials

```bash
# Remove all stored credentials
rm ~/.config/optimizely/config.json        # Linux/macOS
del %APPDATA%\optimizely\config.json       # Windows

# Or remove specific instance by editing the JSON file
```

### Credential Rotation

Best practice for regular credential rotation:

```bash
#!/bin/bash
# rotate-credentials.sh

# 1. Create new API key in CMS
echo "1. Create new API key in CMS admin panel"
echo "2. Copy new Client ID and Secret"
read -p "Press Enter when ready..."

# 2. Update CLI credentials
optimizely-cms-cli login

# 3. Test new credentials
optimizely-cms-cli config pull --output test.json

# 4. Delete test file
rm test.json

echo "Credential rotation complete!"
```

## Security Best Practices

### Development Environment

```bash
# ✅ Good practices
# Use personal API keys for development
# Rotate credentials monthly
# Never commit credentials to version control
# Use .env files for local testing (but don't commit them)

# ❌ Avoid
# Sharing personal API keys
# Using production keys for development
# Storing credentials in code
```

### Production Environment

```bash
# ✅ Good practices
# Use dedicated service account API keys
# Implement credential rotation schedule
# Monitor API key usage
# Use minimum required permissions
# Store credentials in secure secret management

# ❌ Avoid
# Using personal credentials in production
# Overprivileged API keys
# Long-lived credentials without rotation
# Storing credentials in plain text files
```

### API Key Monitoring

Monitor your API key usage:

1. **CMS Admin Panel**:
   - Check **Settings** → **API Keys** → **Usage Statistics**
   - Monitor for unusual activity

2. **Logging**:
   ```bash
   # Enable verbose logging to monitor API calls
   optimizely-cms-cli config push optimizely.config.mjs --verbose
   ```

3. **Alerts**:
   - Set up alerts for failed authentication attempts
   - Monitor for unexpected API usage patterns

## Troubleshooting Authentication

### Common Issues

#### "Authentication Failed"

```bash
❌ Error 401 Unauthorized (authentication_failed)
Detail: Invalid or expired credentials
```

**Solutions:**
1. Verify Client ID and Secret are correct
2. Check API key hasn't been revoked
3. Re-authenticate: `optimizely-cms-cli login`

#### "Insufficient Permissions"

```bash
❌ Error 403 Forbidden (insufficient_permissions)
Detail: API key lacks required permissions
```

**Solutions:**
1. Check API key permissions in CMS admin
2. Add required scopes to API key
3. Use different API key with correct permissions

#### "Cannot Connect to Host"

```bash
❌ Error: Cannot connect to my-site.cms.optimizely.com
```

**Solutions:**
1. Verify CMS instance URL is correct
2. Check network connectivity
3. Confirm instance is accessible from your location
4. Try different URL format

#### "Multiple Credentials Found"

```bash
❌ Error: More than one credentials detected. 
Provide the --host flag or set OPTIMIZELY_CMS_HOST environment variable
```

**Solutions:**
1. Use `--host` flag: `optimizely-cms-cli config push file.mjs --host my-site.cms.optimizely.com`
2. Set environment variable: `export OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com`

### Debug Authentication

```bash
# Test authentication with verbose output
optimizely-cms-cli config pull --output test.json --verbose

# This will show:
# - Credential file location
# - Authentication token request
# - API response details
# - Any authentication errors
```

### Manual Credential Testing

```bash
# Test credentials manually with curl
curl -X POST "https://api.cms.optimizely.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"

# Successful response:
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Reset Authentication

```bash
# Complete authentication reset
rm ~/.config/optimizely/config.json
optimizely-cms-cli login

# Or reset specific instance
optimizely-cms-cli login
# Choose same instance and enter new credentials
```

## Advanced Authentication Patterns

### Multi-Tenant Setup

For agencies managing multiple clients:

```bash
# Client A
export OPTIMIZELY_CMS_HOST=clienta.cms.optimizely.com
optimizely-cms-cli login
optimizely-cms-cli config push optimizely.config.mjs

# Client B  
export OPTIMIZELY_CMS_HOST=clientb.cms.optimizely.com
optimizely-cms-cli login
optimizely-cms-cli config push optimizely.config.mjs
```

### Environment-Specific Scripts

```bash
# scripts/deploy-dev.sh
#!/bin/bash
export OPTIMIZELY_CMS_HOST=dev.cms.optimizely.com
optimizely-cms-cli config push optimizely.config.mjs

# scripts/deploy-prod.sh
#!/bin/bash
export OPTIMIZELY_CMS_HOST=prod.cms.optimizely.com
optimizely-cms-cli config push optimizely.config.mjs --force
```

### Docker Authentication

```dockerfile
# Dockerfile with CLI authentication
FROM node:18-alpine

# Install CLI
RUN npm install -g @episerver/cms-cli

# Set environment variables
ENV OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# Copy project files
COPY . /app
WORKDIR /app

# Deploy on container start
CMD ["optimizely-cms-cli", "config", "push", "optimizely.config.mjs"]
```

---

*Proper authentication setup is crucial for secure CLI operations. Follow the security best practices and use environment-specific credentials to maintain a secure and reliable deployment pipeline.*