# Commands Reference

Complete reference for all Optimizely CMS CLI commands, flags, and options.

## Command Structure

```bash
optimizely-cms-cli <command> [subcommand] [arguments] [flags]
```

All commands support these global flags:
- `--help` - Show command help
- `--json` - Output results in JSON format
- `--host <url>` - Specify CMS instance URL

## Authentication Commands

### `login`

Authenticate with an Optimizely CMS instance using OAuth2 client credentials.

```bash
optimizely-cms-cli login [flags]
```

#### Examples

```bash
# Interactive login
optimizely-cms-cli login

# Show credential file location
optimizely-cms-cli login --verbose

# Non-interactive login (for CI/CD)
echo -e "my-site.cms.optimizely.com\nclient_id\nclient_secret" | optimizely-cms-cli login
```

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--verbose` | Show detailed output including credential file path | `false` |

#### Interactive Prompts

1. **Instance URL**: Enter your CMS instance URL (e.g., `my-site.cms.optimizely.com`)
2. **Client ID**: Enter the Client ID from your CMS API Key
3. **Client Secret**: Enter the Client Secret from your CMS API Key

#### Output

```bash
✓ Checking your credentials...
✓ You are now logged in! Your credentials are stored in /path/to/config.json
```

#### Authentication Storage

Credentials are stored securely in:
- **macOS**: `~/Library/Preferences/optimizely/config.json`
- **Linux**: `~/.config/optimizely/config.json`
- **Windows**: `%APPDATA%/optimizely/config.json`

#### Multiple Instance Support

The CLI supports authentication with multiple CMS instances:

```bash
# Login to development instance
optimizely-cms-cli login
# Enter dev.cms.optimizely.com

# Login to production instance  
optimizely-cms-cli login
# Enter prod.cms.optimizely.com

# Use specific instance
optimizely-cms-cli config push file.mjs --host dev.cms.optimizely.com
```

## Configuration Commands

### `config push`

Upload content types and display templates from your local configuration to the CMS.

```bash
optimizely-cms-cli config push <file> [flags]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `file` | Path to configuration file (typically `optimizely.config.mjs`) | Yes |

#### Examples

```bash
# Basic push
optimizely-cms-cli config push optimizely.config.mjs

# Dry run (test without applying changes)
optimizely-cms-cli config push optimizely.config.mjs --dry-run

# Force push (ignore data loss warnings)
optimizely-cms-cli config push optimizely.config.mjs --force

# Push to specific instance
optimizely-cms-cli config push optimizely.config.mjs --host staging.cms.optimizely.com

# Save generated manifest for inspection
optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run
```

#### Flags

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `--host` | `string` | CMS instance URL | Auto-detected from credentials |
| `--output` | `string` | Save generated manifest to file | None |
| `--dry-run` | `boolean` | Test changes without applying them | `false` |
| `--force` | `boolean` | Force updates ignoring data loss warnings | `false` |

#### Output

**Successful Push:**
```bash
✓ Uploading configuration file
✓ Configuration file uploaded

Outcomes:
- Content type 'Article' created successfully
- Content type 'Product' updated successfully
- Display template 'ProductDetail' created successfully

Warnings:
- Property 'oldField' in 'Article' will be removed (data loss possible)

Errors:
- None
```

**Dry Run Output:**
```bash
[DRY RUN] Would upload configuration file
[DRY RUN] Configuration validation successful

Planned Changes:
- CREATE content type 'Article'
- UPDATE content type 'Product' 
- DELETE property 'deprecatedField' from 'Product' (data loss warning)
```

**Force Mode Warning:**
```bash
⚠️  --force is used! This forces content type updates, which may result in data loss
✓ Uploading configuration file
✓ Configuration file uploaded
```

#### Error Handling

Common errors and solutions:

**Invalid Configuration:**
```bash
❌ Error: Configuration file parsing failed
Error: Invalid content type definition in 'Article'
Detail: Property 'title' is missing required 'type' field
```

**Authentication Error:**
```bash
❌ Error 401 Unauthorized (authentication_failed)
Detail: Invalid or expired credentials
Solution: Run 'optimizely-cms-cli login' to re-authenticate
```

**Permission Error:**
```bash
❌ Error 403 Forbidden (insufficient_permissions)
Detail: API key lacks content type management permissions
Solution: Update API key permissions in CMS admin panel
```

**Data Loss Warning (without --force):**
```bash
❌ Error 400 Bad Request (data_loss_warning)
Detail: Removing property 'importantField' would cause data loss
Solution: Use --force flag if you're sure about this change
```

### `config pull`

Download current content types and display templates from the CMS to a local file.

```bash
optimizely-cms-cli config pull [flags]
```

#### Examples

```bash
# Pull to default output
optimizely-cms-cli config pull --output current-config.json

# Pull from specific instance
optimizely-cms-cli config pull --output backup.json --host prod.cms.optimizely.com

# Pull and format JSON nicely
optimizely-cms-cli config pull --output formatted-config.json
```

#### Flags

| Flag | Type | Description | Required |
|------|------|-------------|----------|
| `--output` | `string` | Output file path | Yes |
| `--host` | `string` | CMS instance URL | No |

#### Output

**Successful Pull:**
```bash
✓ Downloading configuration file
Configuration saved to 'current-config.json'
```

**Output File Format:**
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
          "required": true,
          "displayName": "Title"
        }
      }
    }
  ],
  "displayTemplates": [
    {
      "key": "ArticleDetail",
      "displayName": "Article Detail View",
      "contentTypes": ["Article"]
    }
  ]
}
```

#### Error Handling

**No Content:**
```bash
❌ Error: The server did not respond with any content
Solution: Check CMS instance URL and authentication
```

**Write Permission Error:**
```bash
❌ Error: Permission denied writing to 'config.json'
Solution: Check file permissions or choose different output path
```

## Content Commands

### `content delete`

Delete content by its unique key.

```bash
optimizely-cms-cli content delete <key> [flags]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `key` | Unique content key/identifier | Yes |

#### Examples

```bash
# Delete content by key
optimizely-cms-cli content delete 12345_67890

# Delete from specific instance
optimizely-cms-cli content delete 12345_67890 --host staging.cms.optimizely.com

# Get content key from CMS admin panel or API
```

#### Flags

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `--host` | `string` | CMS instance URL | Auto-detected |

#### Output

**Successful Deletion:**
```bash
Success! Content deleted.
```

**Content Not Found:**
```bash
❌ Error 404 Not Found
Detail: Content with key '12345_67890' not found
```

**Permission Error:**
```bash
❌ Error 403 Forbidden
Detail: Insufficient permissions to delete content
```

#### Finding Content Keys

Content keys can be found in:
1. **CMS Admin Panel**: View content properties
2. **API Responses**: `_metadata.key` field
3. **URL Parameters**: Often in edit URLs

Example key formats:
- `12345_67890` (numeric format)
- `article-slug-2024` (string format)
- `guid-format-here` (GUID format)

## Danger Commands

⚠️ **Warning**: These commands perform destructive operations. Use with extreme caution.

### `danger delete-all-content-types`

Delete ALL content types from the CMS instance. This is irreversible and will cause significant data loss.

```bash
optimizely-cms-cli danger delete-all-content-types [flags]
```

#### Examples

```bash
# Delete all content types (will prompt for confirmation)
optimizely-cms-cli danger delete-all-content-types

# Force deletion without confirmation (DANGEROUS)
optimizely-cms-cli danger delete-all-content-types --force

# Target specific instance
optimizely-cms-cli danger delete-all-content-types --host dev.cms.optimizely.com
```

#### Flags

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `--force` | `boolean` | Skip confirmation prompts | `false` |
| `--host` | `string` | CMS instance URL | Auto-detected |

#### Safety Prompts

Without `--force`, the command will prompt for confirmation:

```bash
⚠️  WARNING: This will delete ALL content types from your CMS instance!
⚠️  This action is IRREVERSIBLE and will cause DATA LOSS!

CMS Instance: my-site.cms.optimizely.com
Content Types Found: 15

Type 'DELETE ALL CONTENT TYPES' to confirm: ___
```

#### Output

**Successful Deletion:**
```bash
✓ Deleting all content types...
✓ Deleted 15 content types successfully

Content types deleted:
- Article
- Product  
- Category
- Author
[... etc]
```

**Cancellation:**
```bash
Operation cancelled by user.
```

#### Use Cases

This command is primarily useful for:
- **Development Environment Reset**: Clean slate for testing
- **Migration Scenarios**: Clearing before bulk import
- **CI/CD Pipeline Cleanup**: Automated environment teardown

**Never use this on production environments!**

## Global Flags

All commands support these global options:

### `--help`

Show command-specific help and usage information.

```bash
# General help
optimizely-cms-cli --help

# Command-specific help
optimizely-cms-cli config push --help
optimizely-cms-cli login --help
```

### `--json`

Output command results in JSON format for scripting and automation.

```bash
# JSON output for programmatic use
optimizely-cms-cli config pull --output temp.json --json

# Example JSON output:
{
  "success": true,
  "message": "Configuration downloaded successfully",
  "outputFile": "temp.json",
  "contentTypesCount": 5,
  "displayTemplatesCount": 3
}
```

### `--host`

Specify which CMS instance to use for the command.

```bash
# Use specific host
optimizely-cms-cli config push file.mjs --host staging.cms.optimizely.com

# Override default host from credentials
optimizely-cms-cli content delete 12345 --host dev.cms.optimizely.com
```

Host format options:
- `my-site.cms.optimizely.com` (recommended)
- `https://my-site.cms.optimizely.com` (also works)
- Environment variable: `OPTIMIZELY_CMS_HOST`

## Environment Variables

Set these environment variables to configure default behavior:

### `OPTIMIZELY_CMS_HOST`

Default CMS instance URL to avoid specifying `--host` repeatedly.

```bash
# Set default host
export OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# Now commands use this host by default
optimizely-cms-cli config push optimizely.config.mjs
```

### CI/CD Authentication

For automated environments, you can set authentication credentials:

```bash
# Set in CI/CD environment (not recommended for development)
export OPTIMIZELY_CLIENT_ID=your_client_id
export OPTIMIZELY_CLIENT_SECRET=your_client_secret
export OPTIMIZELY_CMS_HOST=my-site.cms.optimizely.com

# Commands will use these credentials automatically
optimizely-cms-cli config push optimizely.config.mjs
```

⚠️ **Security Note**: Only use credential environment variables in secure CI/CD environments. For local development, use the interactive `login` command.

## Exit Codes

The CLI uses standard exit codes for automation and scripting:

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Command completed successfully |
| `1` | General Error | Command failed due to error |
| `2` | Authentication Error | Invalid or expired credentials |
| `3` | Permission Error | Insufficient permissions |
| `4` | Not Found Error | Requested resource not found |
| `5` | Configuration Error | Invalid configuration or syntax error |

### Scripting Examples

```bash
#!/bin/bash

# Deploy with error handling
if optimizely-cms-cli config push optimizely.config.mjs; then
    echo "✓ Deployment successful"
else
    exit_code=$?
    case $exit_code in
        2) echo "❌ Authentication failed - run 'optimizely-cms-cli login'" ;;
        3) echo "❌ Permission denied - check API key permissions" ;;
        5) echo "❌ Configuration error - check optimizely.config.mjs" ;;
        *) echo "❌ Deployment failed with exit code $exit_code" ;;
    esac
    exit $exit_code
fi
```

## Command Aliases

Some commands have shorter aliases for convenience:

```bash
# These are equivalent:
optimizely-cms-cli config push file.mjs
cms-cli config push file.mjs  # Shorter alias

# Most common operations:
cms-cli login
cms-cli config push optimizely.config.mjs
cms-cli config pull --output backup.json
```

## Troubleshooting Commands

### Debug Output

Enable verbose logging for troubleshooting:

```bash
# Enable verbose output
optimizely-cms-cli config push optimizely.config.mjs --verbose

# This shows:
# - Configuration file parsing details
# - API request/response details
# - Authentication token information
# - Detailed error messages
```

### Configuration Testing

```bash
# Test configuration without uploading
optimizely-cms-cli config push optimizely.config.mjs --dry-run --verbose

# Pull current config to compare
optimizely-cms-cli config pull --output current.json

# Generate manifest without uploading
optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run
```

### Authentication Testing

```bash
# Test authentication
optimizely-cms-cli config pull --output test.json

# If this works, authentication is valid
# If this fails, run: optimizely-cms-cli login
```

---

*This reference covers all available CLI commands. For practical workflows and automation examples, see the [Advanced Usage guide](./advanced-usage.md).*