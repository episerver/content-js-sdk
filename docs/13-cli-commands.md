# CLI Commands Reference

This page provides a reference for all Optimizely CMS CLI commands.

## Installation

You can run CLI commands without installing by using `npx`:

```bash
npx @optimizely/cms-cli@latest [command]
```

Or install globally:

```bash
npm install @optimizely/cms-cli -g
optimizely-cms-cli [command]
```

Or install in your project as a dev dependency:

```bash
npm install @optimizely/cms-cli -D
npx optimizely-cms-cli [command]
```

## Command Overview

| Command | Description |
|---------|-------------|
| `config push` | Push content types from your code to CMS |
| `config pull` | Pull content types from CMS and generate TypeScript files |
| `login` | Verify authentication with CMS |
| `content delete` | Delete a specific content type |
| `danger delete-all-content-types` | Delete all user-defined content types (⚠️ destructive) |

## Configuration Commands

### `config push`

Push your TypeScript content type definitions to Optimizely CMS.

**Basic usage:**

```bash
optimizely-cms-cli config push
```

By default, reads `./optimizely.config.mjs` from your project root.

**Flags:**

- `--config <path>` - Path to config file (default: `./optimizely.config.mjs`)
- `--force` - Force update content types (⚠️ may result in data loss)
- `--host <url>` - Override CMS host URL

**Examples:**

```bash
# Push with default config
optimizely-cms-cli config push

# Push with custom config file
optimizely-cms-cli config push --config ./custom-config.mjs

# Force update (overwrites existing content types)
optimizely-cms-cli config push --force

# Push to specific CMS instance
optimizely-cms-cli config push --host https://example.cms.optimizely.com
```

> [!WARNING]
> Using `--force` will overwrite existing content types in CMS and may result in data loss if properties are removed or changed.

### `config pull`

Pull content types from CMS and generate TypeScript files.

**Basic usage:**

```bash
optimizely-cms-cli config pull
```

In interactive mode (terminal), prompts for output directory and grouping preferences. In non-interactive mode (CI/piped), outputs JSON to stdout.

**Flags:**

- `--output <path>` - Output directory for generated files
- `--group` - Group files by base type (page/, component/, section/, etc.)
- `--json` - Output manifest as JSON to stdout (useful for piping)
- `--include-read-only` - Include read-only system content types
- `--host <url>` - Override CMS host URL

**Examples:**

```bash
# Interactive mode (prompts for options)
optimizely-cms-cli config pull

# Specify output directory
optimizely-cms-cli config pull --output ./src/content-types

# Group by base type and specify output
optimizely-cms-cli config pull --output ./src/types --group

# Output as JSON
optimizely-cms-cli config pull --json

# Save JSON to file (auto-detects redirection)
optimizely-cms-cli config pull > manifest.json

# Pipe to other commands
optimizely-cms-cli config pull | jq .contentTypes
optimizely-cms-cli config pull | grep -i "Article"

# Include read-only system content types
optimizely-cms-cli config pull --include-read-only

# Combine flags
optimizely-cms-cli config pull --output ./src/types --group --include-read-only
```

**Output structure:**

Without `--group`:
```
src/content-types/
├── ArticlePage.ts
├── ProductPage.ts
├── HeroComponent.ts
└── display-templates/
    ├── ArticleDisplayTemplate.ts
    └── HeroDisplayTemplate.ts
```

With `--group`:
```
src/types/
├── page/
│   ├── ArticlePage.ts
│   └── ProductPage.ts
├── component/
│   ├── HeroComponent.ts
│   └── Teaser.ts
├── section/
│   └── ContentSection.ts
└── displayTemplates/  # Only if orphaned templates exist
    └── LegacyTemplate.ts
```

**Read-only content types:**

By default, `config pull` excludes system-generated read-only content types. Use `--include-read-only` to pull all content types including system types:

```bash
optimizely-cms-cli config pull --include-read-only
```

Read-only content types cannot be modified via the CLI or CMS REST API. This flag is useful for:

- **PaaS environments** where content types may be created from C# or .NET applications
- Auditing or understanding the full CMS content type schema
- Generating TypeScript types for content types in CMS managed by other systems like CMP

## Authentication Commands

### `login`

Verify that your CMS credentials are correctly configured.

**Basic usage:**

```bash
optimizely-cms-cli login
```

Tests authentication using credentials from environment variables (`OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET`).

**Flags:**

- `--verbose` - Show detailed authentication output
- `--host <url>` - Override CMS host URL

**Examples:**

```bash
# Basic authentication check
optimizely-cms-cli login

# Show detailed output
optimizely-cms-cli login --verbose

# Test against specific CMS instance
optimizely-cms-cli login --host https://example.cms.optimizely.com
```

**Expected output:**

```
✓ Successfully authenticated with CMS
```

If authentication fails, check your `.env` file and ensure `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET` are set correctly.

## Content Type Management

### `content delete`

Delete a specific content type from CMS.

**Basic usage:**

```bash
optimizely-cms-cli content delete <content-type-key>
```

**Flags:**

- `--host <url>` - Override CMS host URL

**Examples:**

```bash
# Delete a content type
optimizely-cms-cli content delete ArticlePage

# Delete from specific CMS instance
optimizely-cms-cli content delete ProductPage --host https://example.cms.optimizely.com
```

> [!WARNING]
> Deleting a content type will also delete all content instances of that type in CMS. This operation cannot be undone.

## Dangerous Commands

### `danger delete-all-content-types`

Delete **all** user-defined content types from CMS.

**Basic usage:**

```bash
optimizely-cms-cli danger delete-all-content-types
```

Requires interactive confirmation before executing.

**Flags:**

- `--host <url>` - Override CMS host URL

**Example:**

```bash
optimizely-cms-cli danger delete-all-content-types
```

> [!DANGER]
> This command is **extremely destructive**. It will delete ALL user-defined content types and their associated content from CMS. Use only when you need to completely reset your CMS schema. This operation cannot be undone.

## Environment Variables

The CLI uses the following environment variables for configuration:

### Authentication

- `OPTIMIZELY_CMS_CLIENT_ID` - Your CMS API client ID (required)
- `OPTIMIZELY_CMS_CLIENT_SECRET` - Your CMS API client secret (required)
- `OPTIMIZELY_CMS_URL` - Your CMS instance URL (e.g., `https://example.cms.optimizely.com`)

### API Configuration

- `OPTIMIZELY_CMS_API_URL` - Override API endpoint URL (default: `https://api.cms.optimizely.com`)
  - Use for non-production environments (e.g., `https://api.cmstest.optimizely.com`)

### Development

- `NODE_TLS_REJECT_UNAUTHORIZED` - Set to `"0"` to allow self-signed certificates (local development only)

**Example `.env` file:**

```ini
OPTIMIZELY_CMS_CLIENT_ID=your-client-id
OPTIMIZELY_CMS_CLIENT_SECRET=your-client-secret
OPTIMIZELY_CMS_URL=https://example.cms.optimizely.com
```

For non-production environments:

```ini
OPTIMIZELY_CMS_CLIENT_ID=your-client-id
OPTIMIZELY_CMS_CLIENT_SECRET=your-client-secret
OPTIMIZELY_CMS_API_URL=https://api.cmstest.optimizely.com
```

> [!WARNING]
> Never commit your `.env` file with credentials to version control. Add `.env` to your `.gitignore` file.

## Global Flags

These flags work with all commands:

- `--help` - Show help for a command
- `--version` - Show CLI version

**Examples:**

```bash
# Show all available commands
optimizely-cms-cli --help

# Show help for a specific command
optimizely-cms-cli config push --help

# Show help for a command group
optimizely-cms-cli config --help

# Show CLI version
optimizely-cms-cli --version
```

## Common Workflows

### Initial Setup

```bash
# 1. Verify authentication
optimizely-cms-cli login

# 2. Push your content types to CMS
optimizely-cms-cli config push

# 3. Create content in CMS UI
# ... (use Optimizely CMS interface)

# 4. Continue developing
```

### Syncing Changes

```bash
# After modifying content type definitions
optimizely-cms-cli config push

# Force update if you changed property types
optimizely-cms-cli config push --force
```

### Pulling Existing Schema

```bash
# Pull content types from existing CMS
optimizely-cms-cli config pull --output ./src/content-types --group

# Review and customize the generated files
# Then push to sync any changes
optimizely-cms-cli config push
```

### CI/CD Integration

```bash
# In CI environment (non-interactive)
# Automatically outputs JSON when stdout is not a TTY

# Push in CI
optimizely-cms-cli config push --config ./optimizely.config.mjs

# Pull and generate files in CI
optimizely-cms-cli config pull --output ./src/content-types --group

# Or get JSON manifest for processing
optimizely-cms-cli config pull --json > manifest.json
```

## Troubleshooting

### Authentication Errors

**Problem:** `Failed to authenticate with CMS`

**Solutions:**
- Verify `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET` are set in `.env`
- Run `optimizely-cms-cli login --verbose` to see detailed error
- Check that your API client has the correct permissions in CMS

### Connection Errors

**Problem:** `Failed to connect to CMS`

**Solutions:**
- Check `OPTIMIZELY_CMS_URL` is correct in `.env`
- For non-production environments, set `OPTIMIZELY_CMS_API_URL`
- For local development with self-signed certificates, add `NODE_TLS_REJECT_UNAUTHORIZED="0"`

### Config File Not Found

**Problem:** `Config file not found`

**Solutions:**
- Ensure `optimizely.config.mjs` exists in your project root
- Or specify the config path: `optimizely-cms-cli config push --config ./path/to/config.mjs`

### Push Conflicts

**Problem:** `Content type already exists with different properties`

**Solutions:**
- Review the differences between your local definition and CMS
- Use `--force` flag if you want to overwrite: `optimizely-cms-cli config push --force`
- Note: `--force` may result in data loss if properties are removed

## Next Steps

- [Installation](./1-installation.md) - Set up your development environment
- [Setup](./2-setup.md) - Configure the SDK and CLI
- [Modelling](./3-modelling.md) - Define your content types with TypeScript
- [Create Content](./4-create-content.md) - Add content in Optimizely CMS

---
