# Advanced Usage

This guide covers advanced CLI patterns, scripting techniques, CI/CD integration, and automation strategies for production environments.

## Scripting and Automation

### Advanced Bash Scripting

#### Multi-Environment Deployment Script

```bash
#!/bin/bash
# scripts/deploy-all-environments.sh

set -e  # Exit on any error

# Configuration
ENVIRONMENTS=("dev" "staging" "prod")
CONFIG_FILE="optimizely.config.mjs"
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to deploy to a single environment
deploy_environment() {
    local env=$1
    local host="${env}.cms.optimizely.com"
    
    log "Starting deployment to $env environment"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup current configuration
    log "Backing up $env configuration..."
    if optimizely-cms-cli config pull \
        --output "$BACKUP_DIR/${env}-backup.json" \
        --host "$host"; then
        success "Backup created: $BACKUP_DIR/${env}-backup.json"
    else
        error "Failed to backup $env configuration"
        return 1
    fi
    
    # Dry run first
    log "Running dry-run for $env..."
    if optimizely-cms-cli config push "$CONFIG_FILE" \
        --host "$host" \
        --dry-run; then
        success "Dry-run passed for $env"
    else
        error "Dry-run failed for $env"
        return 1
    fi
    
    # Ask for confirmation for production
    if [ "$env" = "prod" ]; then
        warning "PRODUCTION DEPLOYMENT!"
        read -p "Are you absolutely sure? Type 'DEPLOY TO PRODUCTION': " confirm
        if [ "$confirm" != "DEPLOY TO PRODUCTION" ]; then
            warning "Production deployment cancelled"
            return 1
        fi
    fi
    
    # Deploy for real
    log "Deploying to $env..."
    if optimizely-cms-cli config push "$CONFIG_FILE" \
        --host "$host" \
        --force; then
        success "Successfully deployed to $env"
        return 0
    else
        error "Failed to deploy to $env"
        return 1
    fi
}

# Function to validate prerequisites
validate_prerequisites() {
    log "Validating prerequisites..."
    
    # Check if CLI is installed
    if ! command -v optimizely-cms-cli &> /dev/null; then
        error "optimizely-cms-cli is not installed"
        exit 1
    fi
    
    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Configuration file $CONFIG_FILE not found"
        exit 1
    fi
    
    # Validate config file
    if ! optimizely-cms-cli config push "$CONFIG_FILE" --dry-run &> /dev/null; then
        error "Configuration file validation failed"
        exit 1
    fi
    
    success "Prerequisites validated"
}

# Function to deploy to all environments
deploy_all() {
    local failed_environments=()
    
    for env in "${ENVIRONMENTS[@]}"; do
        if deploy_environment "$env"; then
            success "✅ $env deployment successful"
        else
            error "❌ $env deployment failed"
            failed_environments+=("$env")
        fi
        
        # Wait between deployments
        if [ "$env" != "${ENVIRONMENTS[-1]}" ]; then
            log "Waiting 30 seconds before next deployment..."
            sleep 30
        fi
    done
    
    # Summary
    log "Deployment Summary:"
    for env in "${ENVIRONMENTS[@]}"; do
        if [[ " ${failed_environments[@]} " =~ " ${env} " ]]; then
            error "$env: FAILED"
        else
            success "$env: SUCCESS"
        fi
    done
    
    if [ ${#failed_environments[@]} -eq 0 ]; then
        success "All deployments successful! 🎉"
        return 0
    else
        error "${#failed_environments[@]} deployment(s) failed"
        return 1
    fi
}

# Main execution
main() {
    log "Starting multi-environment deployment"
    
    validate_prerequisites
    
    # Parse command line arguments
    case "${1:-all}" in
        "all")
            deploy_all
            ;;
        "dev"|"staging"|"prod")
            deploy_environment "$1"
            ;;
        *)
            echo "Usage: $0 [all|dev|staging|prod]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
```

#### Configuration Synchronization Script

```bash
#!/bin/bash
# scripts/sync-environments.sh

set -e

SOURCE_ENV="${1:-staging}"
TARGET_ENV="${2:-prod}"
CONFIG_FILE="optimizely.config.mjs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to sync configurations between environments
sync_environments() {
    local source="$1"
    local target="$2"
    
    log "🔄 Syncing $source → $target"
    
    # Backup target environment
    log "📦 Backing up $target environment..."
    optimizely-cms-cli config pull \
        --output "${target}-backup-$(date +%Y%m%d-%H%M%S).json" \
        --host "${target}.cms.optimizely.com"
    
    # Pull source configuration
    log "📥 Pulling $source configuration..."
    optimizely-cms-cli config pull \
        --output "${source}-config.json" \
        --host "${source}.cms.optimizely.com"
    
    # Show differences (if tools available)
    if command -v jq &> /dev/null; then
        log "📊 Configuration comparison:"
        
        # Get content type counts
        source_count=$(jq '.contentTypes | length' "${source}-config.json")
        
        optimizely-cms-cli config pull \
            --output "${target}-current.json" \
            --host "${target}.cms.optimizely.com"
        
        target_count=$(jq '.contentTypes | length' "${target}-current.json")
        
        echo "Source ($source): $source_count content types"
        echo "Target ($target): $target_count content types"
        
        rm "${target}-current.json"
    fi
    
    # Confirmation for production
    if [ "$target" = "prod" ]; then
        echo "⚠️  WARNING: This will sync to PRODUCTION!"
        read -p "Type 'SYNC TO PRODUCTION' to confirm: " confirm
        if [ "$confirm" != "SYNC TO PRODUCTION" ]; then
            log "❌ Sync cancelled"
            rm "${source}-config.json"
            exit 1
        fi
    fi
    
    # Deploy source config to target
    log "🚀 Deploying to $target..."
    optimizely-cms-cli config push "$CONFIG_FILE" \
        --host "${target}.cms.optimizely.com" \
        --force
    
    # Cleanup
    rm "${source}-config.json"
    
    log "✅ Sync complete: $source → $target"
}

# Validate inputs
if [ -z "$SOURCE_ENV" ] || [ -z "$TARGET_ENV" ]; then
    echo "Usage: $0 <source-env> <target-env>"
    echo "Example: $0 staging prod"
    exit 1
fi

if [ "$SOURCE_ENV" = "$TARGET_ENV" ]; then
    echo "❌ Source and target environments cannot be the same"
    exit 1
fi

# Execute sync
sync_environments "$SOURCE_ENV" "$TARGET_ENV"
```

### Node.js Automation Scripts

#### Environment Configuration Manager

```javascript
// scripts/environment-manager.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

class EnvironmentManager {
  constructor() {
    this.environments = {
      dev: 'dev.cms.optimizely.com',
      staging: 'staging.cms.optimizely.com',
      prod: 'prod.cms.optimizely.com'
    };
    
    this.configFile = 'optimizely.config.mjs';
    this.manifestCache = new Map();
  }
  
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
  
  async generateManifest() {
    this.log('Generating manifest from configuration...');
    
    try {
      execSync(
        `optimizely-cms-cli config push ${this.configFile} --output temp-manifest.json --dry-run`,
        { stdio: 'pipe' }
      );
      
      const manifest = JSON.parse(readFileSync('temp-manifest.json', 'utf8'));
      
      // Calculate hash for change detection
      const manifestHash = createHash('sha256')
        .update(JSON.stringify(manifest))
        .digest('hex');
      
      // Cleanup
      execSync('rm temp-manifest.json');
      
      return { manifest, hash: manifestHash };
    } catch (error) {
      this.log(`Failed to generate manifest: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async pullEnvironmentConfig(environment) {
    const host = this.environments[environment];
    if (!host) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    this.log(`Pulling configuration from ${environment}...`);
    
    const outputFile = `${environment}-config.json`;
    
    try {
      execSync(
        `optimizely-cms-cli config pull --output ${outputFile} --host ${host}`,
        { stdio: 'pipe' }
      );
      
      const config = JSON.parse(readFileSync(outputFile, 'utf8'));
      
      // Calculate hash
      const configHash = createHash('sha256')
        .update(JSON.stringify(config))
        .digest('hex');
      
      // Cache the configuration
      this.manifestCache.set(environment, { config, hash: configHash });
      
      return { config, hash: configHash };
    } catch (error) {
      this.log(`Failed to pull ${environment} configuration: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async deployToEnvironment(environment, options = {}) {
    const host = this.environments[environment];
    if (!host) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    const { dryRun = false, force = false, backup = true } = options;
    
    this.log(`Deploying to ${environment}${dryRun ? ' (dry-run)' : ''}...`);
    
    try {
      // Backup if requested
      if (backup && !dryRun) {
        await this.backupEnvironment(environment);
      }
      
      // Build command
      const flags = [
        `--host ${host}`,
        dryRun ? '--dry-run' : '',
        force ? '--force' : ''
      ].filter(Boolean).join(' ');
      
      const command = `optimizely-cms-cli config push ${this.configFile} ${flags}`;
      
      execSync(command, { stdio: 'inherit' });
      
      this.log(`Successfully deployed to ${environment}`, 'success');
      
      return true;
    } catch (error) {
      this.log(`Failed to deploy to ${environment}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async backupEnvironment(environment) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backups/${environment}-backup-${timestamp}.json`;
    
    this.log(`Backing up ${environment} to ${backupFile}...`);
    
    try {
      // Ensure backup directory exists
      execSync('mkdir -p backups');
      
      const host = this.environments[environment];
      execSync(
        `optimizely-cms-cli config pull --output ${backupFile} --host ${host}`,
        { stdio: 'pipe' }
      );
      
      this.log(`Backup saved: ${backupFile}`, 'success');
      return backupFile;
    } catch (error) {
      this.log(`Failed to backup ${environment}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async compareEnvironments(env1, env2) {
    this.log(`Comparing ${env1} vs ${env2}...`);
    
    const [config1, config2] = await Promise.all([
      this.pullEnvironmentConfig(env1),
      this.pullEnvironmentConfig(env2)
    ]);
    
    const types1 = new Set(config1.config.contentTypes.map(ct => ct.key));
    const types2 = new Set(config2.config.contentTypes.map(ct => ct.key));
    
    const onlyIn1 = [...types1].filter(t => !types2.has(t));
    const onlyIn2 = [...types2].filter(t => !types1.has(t));
    const common = [...types1].filter(t => types2.has(t));
    
    console.log(`\n📊 Comparison Results:`);
    console.log(`Common content types: ${common.length}`);
    console.log(`Only in ${env1}: ${onlyIn1.length}`);
    console.log(`Only in ${env2}: ${onlyIn2.length}`);
    
    if (onlyIn1.length > 0) {
      console.log(`\nContent types only in ${env1}:`);
      onlyIn1.forEach(type => console.log(`  - ${type}`));
    }
    
    if (onlyIn2.length > 0) {
      console.log(`\nContent types only in ${env2}:`);
      onlyIn2.forEach(type => console.log(`  - ${type}`));
    }
    
    // Check for drift
    const isDifferent = config1.hash !== config2.hash;
    
    if (isDifferent) {
      this.log(`Environments ${env1} and ${env2} have different configurations`, 'warning');
    } else {
      this.log(`Environments ${env1} and ${env2} are in sync`, 'success');
    }
    
    return {
      common,
      onlyIn1,
      onlyIn2,
      isDifferent,
      hash1: config1.hash,
      hash2: config2.hash
    };
  }
  
  async detectDrift() {
    this.log('Detecting configuration drift across all environments...');
    
    const { hash: localHash } = await this.generateManifest();
    const environmentHashes = {};
    
    // Pull all environment configurations
    for (const [env, _] of Object.entries(this.environments)) {
      try {
        const { hash } = await this.pullEnvironmentConfig(env);
        environmentHashes[env] = hash;
      } catch (error) {
        this.log(`Failed to check ${env}: ${error.message}`, 'warning');
        environmentHashes[env] = null;
      }
    }
    
    // Compare with local
    console.log('\n🔍 Drift Detection Results:');
    console.log(`Local configuration hash: ${localHash.substring(0, 8)}...`);
    
    let driftDetected = false;
    
    for (const [env, hash] of Object.entries(environmentHashes)) {
      if (hash === null) {
        console.log(`${env}: ❌ Unable to check`);
        continue;
      }
      
      const isInSync = hash === localHash;
      const status = isInSync ? '✅ In sync' : '⚠️  Drift detected';
      
      console.log(`${env}: ${status} (${hash.substring(0, 8)}...)`);
      
      if (!isInSync) {
        driftDetected = true;
      }
    }
    
    if (driftDetected) {
      this.log('Configuration drift detected!', 'warning');
    } else {
      this.log('All environments are in sync', 'success');
    }
    
    return { localHash, environmentHashes, driftDetected };
  }
  
  async promoteThroughEnvironments(startEnv = 'dev') {
    const promotionOrder = ['dev', 'staging', 'prod'];
    const startIndex = promotionOrder.indexOf(startEnv);
    
    if (startIndex === -1) {
      throw new Error(`Invalid start environment: ${startEnv}`);
    }
    
    this.log(`Starting promotion from ${startEnv} through environments...`);
    
    for (let i = startIndex; i < promotionOrder.length; i++) {
      const env = promotionOrder[i];
      
      try {
        // Dry run first
        await this.deployToEnvironment(env, { dryRun: true });
        
        // Ask for confirmation
        if (env === 'prod') {
          console.log('\n🚨 PRODUCTION DEPLOYMENT');
          console.log('This will deploy to the production environment!');
          
          // In a real script, you might use a different confirmation method
          // For automation, you might skip this or use environment variables
          const readline = await import('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const answer = await new Promise(resolve => {
            rl.question('Type "DEPLOY TO PRODUCTION" to confirm: ', resolve);
          });
          
          rl.close();
          
          if (answer !== 'DEPLOY TO PRODUCTION') {
            this.log('Production deployment cancelled', 'warning');
            break;
          }
        }
        
        // Deploy for real
        await this.deployToEnvironment(env, { force: true });
        
        this.log(`Successfully promoted to ${env}`, 'success');
        
        // Wait between environments
        if (i < promotionOrder.length - 1) {
          this.log('Waiting 30 seconds before next promotion...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
      } catch (error) {
        this.log(`Promotion failed at ${env}: ${error.message}`, 'error');
        throw error;
      }
    }
    
    this.log('Promotion complete! 🎉', 'success');
  }
}

// CLI interface
async function main() {
  const manager = new EnvironmentManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  try {
    switch (command) {
      case 'deploy':
        const env = args[0];
        const options = {
          dryRun: args.includes('--dry-run'),
          force: args.includes('--force'),
          backup: !args.includes('--no-backup')
        };
        await manager.deployToEnvironment(env, options);
        break;
        
      case 'compare':
        const [env1, env2] = args;
        await manager.compareEnvironments(env1, env2);
        break;
        
      case 'drift':
        await manager.detectDrift();
        break;
        
      case 'promote':
        const startEnv = args[0] || 'dev';
        await manager.promoteThroughEnvironments(startEnv);
        break;
        
      case 'backup':
        const backupEnv = args[0];
        await manager.backupEnvironment(backupEnv);
        break;
        
      default:
        console.log('Usage:');
        console.log('  node environment-manager.js deploy <env> [--dry-run] [--force] [--no-backup]');
        console.log('  node environment-manager.js compare <env1> <env2>');
        console.log('  node environment-manager.js drift');
        console.log('  node environment-manager.js promote [start-env]');
        console.log('  node environment-manager.js backup <env>');
        break;
    }
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EnvironmentManager };
```

## CI/CD Integration Patterns

### GitHub Actions Advanced Workflow

```yaml
# .github/workflows/optimizely-deployment.yml
name: Optimizely CMS Deployment

on:
  push:
    branches: [main, develop, feature/*]
    paths:
      - 'src/content-types/**'
      - 'optimizely.config.mjs'
      - 'package.json'
      - 'package-lock.json'
  
  pull_request:
    branches: [main, develop]
    paths:
      - 'src/content-types/**'
      - 'optimizely.config.mjs'

  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - dev
          - staging
          - prod
      force_deploy:
        description: 'Force deployment (ignore warnings)'
        required: false
        default: false
        type: boolean

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      content-types-changed: ${{ steps.changes.outputs.content-types }}
      config-changed: ${{ steps.changes.outputs.config }}
      should-deploy: ${{ steps.should-deploy.outputs.result }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            content-types:
              - 'src/content-types/**'
            config:
              - 'optimizely.config.mjs'
              - 'package.json'
              - 'package-lock.json'
      
      - name: Determine if deployment is needed
        id: should-deploy
        run: |
          if [[ "${{ steps.changes.outputs.content-types }}" == "true" || "${{ steps.changes.outputs.config }}" == "true" || "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "result=true" >> $GITHUB_OUTPUT
          else
            echo "result=false" >> $GITHUB_OUTPUT
          fi

  validate:
    needs: detect-changes
    if: needs.detect-changes.outputs.should-deploy == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          npm install -g @episerver/cms-cli@latest
      
      - name: Validate configuration
        run: |
          # Syntax check
          node -c optimizely.config.mjs
          
          # Generate manifest (dry run)
          optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run
          
          # Validate manifest structure
          node -e "
            const manifest = require('./manifest.json');
            if (!manifest.contentTypes || !Array.isArray(manifest.contentTypes)) {
              throw new Error('Invalid manifest structure');
            }
            console.log(\`Manifest contains \${manifest.contentTypes.length} content types\`);
          "
      
      - name: Upload manifest artifact
        uses: actions/upload-artifact@v3
        with:
          name: content-manifest
          path: manifest.json
          retention-days: 30

  security-scan:
    needs: detect-changes
    if: needs.detect-changes.outputs.should-deploy == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: |
          npm audit --audit-level moderate
          
          # Check for sensitive data in content types
          if grep -r "password\|secret\|token\|key" src/content-types/ --exclude-dir=node_modules; then
            echo "⚠️ Potential sensitive data found in content types"
            exit 1
          fi

  deploy-dev:
    needs: [detect-changes, validate, security-scan]
    if: |
      needs.detect-changes.outputs.should-deploy == 'true' && 
      (github.ref == 'refs/heads/develop' || 
       startsWith(github.ref, 'refs/heads/feature/') ||
       (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'dev'))
    runs-on: ubuntu-latest
    environment: development
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli@latest
      
      - name: Download manifest
        uses: actions/download-artifact@v3
        with:
          name: content-manifest
      
      - name: Backup development environment
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.DEV_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.DEV_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.DEV_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config pull --output "dev-backup-$(date +%Y%m%d-%H%M%S).json"
      
      - name: Deploy to development
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.DEV_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.DEV_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.DEV_CLIENT_SECRET }}
        run: |
          optimizely-cms-cli config push optimizely.config.mjs --force
      
      - name: Smoke test
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.DEV_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.DEV_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.DEV_CLIENT_SECRET }}
        run: |
          # Verify deployment by pulling config and comparing
          optimizely-cms-cli config pull --output deployed-config.json
          
          # Basic validation
          node -e "
            const deployed = require('./deployed-config.json');
            const expected = require('./manifest.json');
            
            if (deployed.contentTypes.length !== expected.contentTypes.length) {
              throw new Error('Content type count mismatch after deployment');
            }
            
            console.log('✅ Deployment verification passed');
          "

  deploy-staging:
    needs: [detect-changes, validate, security-scan]
    if: |
      needs.detect-changes.outputs.should-deploy == 'true' && 
      (github.ref == 'refs/heads/main' ||
       (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'staging'))
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli@latest
      
      - name: Deploy to staging
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.STAGING_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.STAGING_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.STAGING_CLIENT_SECRET }}
        run: |
          # Backup first
          optimizely-cms-cli config pull --output "staging-backup-$(date +%Y%m%d-%H%M%S).json"
          
          # Deploy
          optimizely-cms-cli config push optimizely.config.mjs --force

  deploy-production:
    needs: [detect-changes, validate, security-scan, deploy-staging]
    if: |
      needs.detect-changes.outputs.should-deploy == 'true' && 
      (github.ref == 'refs/heads/main' ||
       (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'prod'))
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install CLI
        run: npm install -g @episerver/cms-cli@latest
      
      - name: Production deployment
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.PROD_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.PROD_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.PROD_CLIENT_SECRET }}
          FORCE_DEPLOY: ${{ github.event.inputs.force_deploy }}
        run: |
          # Critical backup
          echo "📦 Creating production backup..."
          optimizely-cms-cli config pull --output "prod-backup-$(date +%Y%m%d-%H%M%S).json"
          
          # Final dry run
          echo "🔍 Final production dry run..."
          optimizely-cms-cli config push optimizely.config.mjs --dry-run
          
          # Deploy to production
          echo "🚀 Deploying to production..."
          if [[ "$FORCE_DEPLOY" == "true" ]]; then
            optimizely-cms-cli config push optimizely.config.mjs --force
          else
            optimizely-cms-cli config push optimizely.config.mjs
          fi
          
          echo "✅ Production deployment complete"
      
      - name: Post-deployment verification
        env:
          OPTIMIZELY_CMS_HOST: ${{ secrets.PROD_CMS_HOST }}
          OPTIMIZELY_CLIENT_ID: ${{ secrets.PROD_CLIENT_ID }}
          OPTIMIZELY_CLIENT_SECRET: ${{ secrets.PROD_CLIENT_SECRET }}
        run: |
          # Verify production deployment
          optimizely-cms-cli config pull --output prod-deployed.json
          
          # Run verification script
          node -e "
            const deployed = require('./prod-deployed.json');
            console.log(\`Production now has \${deployed.contentTypes.length} content types\`);
            
            // Add more verification logic here
            console.log('✅ Production verification passed');
          "
      
      - name: Notify team
        if: always()
        run: |
          # Add notification logic here (Slack, Teams, email, etc.)
          echo "Production deployment completed. Status: ${{ job.status }}"

  cleanup:
    needs: [deploy-dev, deploy-staging, deploy-production]
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - name: Cleanup artifacts
        run: |
          echo "Cleaning up deployment artifacts..."
          # Add cleanup logic if needed
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'prod'],
            description: 'Target environment'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deployment (ignore warnings)'
        )
        booleanParam(
            name: 'DRY_RUN',
            defaultValue: false,
            description: 'Dry run only (do not deploy)'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        CLI_VERSION = 'latest'
    }
    
    stages {
        stage('Setup') {
            steps {
                // Install Node.js
                sh """
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                """
                
                // Install CLI
                sh "npm install -g @episerver/cms-cli@${CLI_VERSION}"
                
                // Verify installation
                sh "optimizely-cms-cli --version"
            }
        }
        
        stage('Validate Configuration') {
            steps {
                script {
                    // Syntax check
                    sh "node -c optimizely.config.mjs"
                    
                    // Generate manifest
                    sh "optimizely-cms-cli config push optimizely.config.mjs --output manifest.json --dry-run"
                    
                    // Archive manifest
                    archiveArtifacts artifacts: 'manifest.json', fingerprint: true
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Security audit
                    sh "npm audit --audit-level moderate || true"
                    
                    // Check for sensitive data
                    def sensitiveDataCheck = sh(
                        script: "grep -r 'password\\|secret\\|token\\|key' src/content-types/ --exclude-dir=node_modules || true",
                        returnStdout: true
                    ).trim()
                    
                    if (sensitiveDataCheck) {
                        error("Potential sensitive data found in content types: ${sensitiveDataCheck}")
                    }
                }
            }
        }
        
        stage('Backup') {
            when {
                not { params.DRY_RUN }
            }
            steps {
                script {
                    def environment = params.ENVIRONMENT
                    def backupFile = "backup-${environment}-${env.BUILD_NUMBER}.json"
                    
                    withCredentials([
                        string(credentialsId: "${environment.toUpperCase()}_CMS_HOST", variable: 'OPTIMIZELY_CMS_HOST'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_ID", variable: 'OPTIMIZELY_CLIENT_ID'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_SECRET", variable: 'OPTIMIZELY_CLIENT_SECRET')
                    ]) {
                        sh "optimizely-cms-cli config pull --output ${backupFile}"
                        archiveArtifacts artifacts: backupFile, fingerprint: true
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    def environment = params.ENVIRONMENT
                    def deployFlags = []
                    
                    if (params.DRY_RUN) {
                        deployFlags.add('--dry-run')
                    }
                    
                    if (params.FORCE_DEPLOY && !params.DRY_RUN) {
                        deployFlags.add('--force')
                    }
                    
                    // Production confirmation
                    if (environment == 'prod' && !params.DRY_RUN) {
                        input message: 'Deploy to PRODUCTION?', ok: 'Deploy',
                              submitterParameter: 'DEPLOYER'
                        
                        echo "Production deployment approved by: ${env.DEPLOYER}"
                    }
                    
                    withCredentials([
                        string(credentialsId: "${environment.toUpperCase()}_CMS_HOST", variable: 'OPTIMIZELY_CMS_HOST'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_ID", variable: 'OPTIMIZELY_CLIENT_ID'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_SECRET", variable: 'OPTIMIZELY_CLIENT_SECRET')
                    ]) {
                        def flagsStr = deployFlags.join(' ')
                        sh "optimizely-cms-cli config push optimizely.config.mjs ${flagsStr}"
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            when {
                not { params.DRY_RUN }
            }
            steps {
                script {
                    def environment = params.ENVIRONMENT
                    
                    withCredentials([
                        string(credentialsId: "${environment.toUpperCase()}_CMS_HOST", variable: 'OPTIMIZELY_CMS_HOST'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_ID", variable: 'OPTIMIZELY_CLIENT_ID'),
                        string(credentialsId: "${environment.toUpperCase()}_CLIENT_SECRET", variable: 'OPTIMIZELY_CLIENT_SECRET')
                    ]) {
                        // Pull deployed configuration
                        sh "optimizely-cms-cli config pull --output deployed-config.json"
                        
                        // Verify deployment
                        sh """
                            node -e "
                                const deployed = require('./deployed-config.json');
                                const expected = require('./manifest.json');
                                
                                if (deployed.contentTypes.length !== expected.contentTypes.length) {
                                    throw new Error('Content type count mismatch');
                                }
                                
                                console.log('✅ Deployment verification passed');
                            "
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean workspace
            cleanWs()
        }
        
        success {
            echo "🎉 Deployment to ${params.ENVIRONMENT} successful!"
            
            // Send notifications
            script {
                if (params.ENVIRONMENT == 'prod' && !params.DRY_RUN) {
                    // Production deployment notification
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "✅ Production deployment successful! Build: ${env.BUILD_NUMBER}"
                    )
                }
            }
        }
        
        failure {
            echo "❌ Deployment to ${params.ENVIRONMENT} failed!"
            
            // Send failure notifications
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Deployment to ${params.ENVIRONMENT} failed! Build: ${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## Production Monitoring and Alerts

### Deployment Monitoring Script

```bash
#!/bin/bash
# scripts/monitor-deployment.sh

set -e

# Configuration
ENVIRONMENTS=("dev" "staging" "prod")
WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
LOG_FILE="/var/log/optimizely-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
    local message="$1"
    local severity="${2:-info}"
    
    # Color coding
    local color="good"
    case "$severity" in
        "error") color="danger" ;;
        "warning") color="warning" ;;
        "info") color="good" ;;
    esac
    
    # Send to Slack
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\", \"color\":\"$color\"}" \
            "$WEBHOOK_URL"
    fi
    
    log "$message"
}

check_environment() {
    local env="$1"
    local host="${env}.cms.optimizely.com"
    
    log "Checking $env environment..."
    
    # Test configuration pull
    if optimizely-cms-cli config pull \
        --output "/tmp/${env}-health-check.json" \
        --host "$host" &>/dev/null; then
        
        log "✅ $env environment is healthy"
        return 0
    else
        send_alert "❌ $env environment health check failed" "error"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "Starting deployment monitoring..."
    
    local failed_environments=()
    
    for env in "${ENVIRONMENTS[@]}"; do
        if ! check_environment "$env"; then
            failed_environments+=("$env")
        fi
        
        # Cleanup temp files
        rm -f "/tmp/${env}-health-check.json"
    done
    
    # Summary
    if [ ${#failed_environments[@]} -eq 0 ]; then
        log "All environments are healthy 🎉"
    else
        send_alert "Failed environments: ${failed_environments[*]}" "error"
    fi
}

# Run monitoring
main "$@"
```

### Configuration Drift Detection

```javascript
// scripts/drift-detector.js
import { EnvironmentManager } from './environment-manager.js';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';

class DriftDetector {
  constructor() {
    this.manager = new EnvironmentManager();
    this.configFile = 'drift-baseline.json';
    this.alertThreshold = 5; // Alert if more than 5 differences
  }
  
  async captureBaseline() {
    console.log('📸 Capturing configuration baseline...');
    
    const baseline = {
      timestamp: new Date().toISOString(),
      environments: {}
    };
    
    // Capture current state of all environments
    for (const env of ['dev', 'staging', 'prod']) {
      try {
        const { config, hash } = await this.manager.pullEnvironmentConfig(env);
        baseline.environments[env] = {
          hash,
          contentTypeCount: config.contentTypes.length,
          contentTypes: config.contentTypes.map(ct => ({
            key: ct.key,
            displayName: ct.displayName,
            propertyCount: Object.keys(ct.properties || {}).length
          }))
        };
      } catch (error) {
        console.error(`Failed to capture baseline for ${env}: ${error.message}`);
        baseline.environments[env] = { error: error.message };
      }
    }
    
    // Save baseline
    writeFileSync(this.configFile, JSON.stringify(baseline, null, 2));
    console.log(`✅ Baseline saved to ${this.configFile}`);
    
    return baseline;
  }
  
  async detectDrift() {
    if (!existsSync(this.configFile)) {
      console.log('No baseline found. Capturing current state as baseline...');
      return this.captureBaseline();
    }
    
    console.log('🔍 Detecting configuration drift...');
    
    const baseline = JSON.parse(readFileSync(this.configFile, 'utf8'));
    const currentState = {
      timestamp: new Date().toISOString(),
      environments: {}
    };
    
    const driftReport = {
      timestamp: new Date().toISOString(),
      baselineTimestamp: baseline.timestamp,
      driftDetected: false,
      changes: []
    };
    
    // Check each environment for drift
    for (const env of ['dev', 'staging', 'prod']) {
      try {
        const { config, hash } = await this.manager.pullEnvironmentConfig(env);
        const baselineEnv = baseline.environments[env];
        
        if (!baselineEnv) {
          driftReport.changes.push({
            environment: env,
            type: 'new_environment',
            message: 'New environment detected'
          });
          continue;
        }
        
        if (baselineEnv.error) {
          console.log(`Skipping ${env} (baseline error): ${baselineEnv.error}`);
          continue;
        }
        
        currentState.environments[env] = {
          hash,
          contentTypeCount: config.contentTypes.length,
          contentTypes: config.contentTypes.map(ct => ({
            key: ct.key,
            displayName: ct.displayName,
            propertyCount: Object.keys(ct.properties || {}).length
          }))
        };
        
        // Check for changes
        if (hash !== baselineEnv.hash) {
          driftReport.driftDetected = true;
          
          // Detailed change analysis
          const changes = this.analyzeChanges(baselineEnv, currentState.environments[env]);
          driftReport.changes.push({
            environment: env,
            type: 'configuration_change',
            changes
          });
        }
        
      } catch (error) {
        console.error(`Failed to check ${env}: ${error.message}`);
        driftReport.changes.push({
          environment: env,
          type: 'check_failed',
          error: error.message
        });
      }
    }
    
    // Generate report
    this.generateDriftReport(driftReport);
    
    // Alert if significant drift
    if (driftReport.changes.length >= this.alertThreshold) {
      this.sendDriftAlert(driftReport);
    }
    
    return driftReport;
  }
  
  analyzeChanges(baseline, current) {
    const changes = [];
    
    // Content type count change
    if (baseline.contentTypeCount !== current.contentTypeCount) {
      changes.push({
        type: 'content_type_count',
        from: baseline.contentTypeCount,
        to: current.contentTypeCount
      });
    }
    
    // Content type changes
    const baselineTypes = new Set(baseline.contentTypes.map(ct => ct.key));
    const currentTypes = new Set(current.contentTypes.map(ct => ct.key));
    
    // Added content types
    const addedTypes = [...currentTypes].filter(t => !baselineTypes.has(t));
    if (addedTypes.length > 0) {
      changes.push({
        type: 'content_types_added',
        contentTypes: addedTypes
      });
    }
    
    // Removed content types
    const removedTypes = [...baselineTypes].filter(t => !currentTypes.has(t));
    if (removedTypes.length > 0) {
      changes.push({
        type: 'content_types_removed',
        contentTypes: removedTypes
      });
    }
    
    // Property count changes
    const propertyChanges = [];
    baseline.contentTypes.forEach(baselineCt => {
      const currentCt = current.contentTypes.find(ct => ct.key === baselineCt.key);
      if (currentCt && baselineCt.propertyCount !== currentCt.propertyCount) {
        propertyChanges.push({
          contentType: baselineCt.key,
          from: baselineCt.propertyCount,
          to: currentCt.propertyCount
        });
      }
    });
    
    if (propertyChanges.length > 0) {
      changes.push({
        type: 'property_count_changes',
        changes: propertyChanges
      });
    }
    
    return changes;
  }
  
  generateDriftReport(driftReport) {
    console.log('\n📊 Configuration Drift Report');
    console.log('═'.repeat(50));
    console.log(`Baseline: ${driftReport.baselineTimestamp}`);
    console.log(`Current:  ${driftReport.timestamp}`);
    console.log(`Drift detected: ${driftReport.driftDetected ? '⚠️  YES' : '✅ NO'}`);
    
    if (driftReport.changes.length === 0) {
      console.log('\n✅ No configuration drift detected');
      return;
    }
    
    console.log(`\nChanges detected: ${driftReport.changes.length}`);
    
    driftReport.changes.forEach((change, index) => {
      console.log(`\n${index + 1}. Environment: ${change.environment}`);
      console.log(`   Type: ${change.type}`);
      
      if (change.changes) {
        change.changes.forEach(c => {
          switch (c.type) {
            case 'content_type_count':
              console.log(`   - Content types: ${c.from} → ${c.to}`);
              break;
            case 'content_types_added':
              console.log(`   - Added: ${c.contentTypes.join(', ')}`);
              break;
            case 'content_types_removed':
              console.log(`   - Removed: ${c.contentTypes.join(', ')}`);
              break;
            case 'property_count_changes':
              c.changes.forEach(pc => {
                console.log(`   - ${pc.contentType}: ${pc.from} → ${pc.to} properties`);
              });
              break;
          }
        });
      }
      
      if (change.error) {
        console.log(`   Error: ${change.error}`);
      }
    });
    
    // Save detailed report
    const reportFile = `drift-report-${new Date().toISOString().split('T')[0]}.json`;
    writeFileSync(reportFile, JSON.stringify(driftReport, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportFile}`);
  }
  
  sendDriftAlert(driftReport) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('⚠️  No webhook URL configured for alerts');
      return;
    }
    
    const message = {
      text: `⚠️ Configuration Drift Detected`,
      attachments: [{
        color: 'warning',
        fields: [
          {
            title: 'Environments Affected',
            value: driftReport.changes.map(c => c.environment).join(', '),
            short: true
          },
          {
            title: 'Changes Count',
            value: driftReport.changes.length.toString(),
            short: true
          },
          {
            title: 'Baseline',
            value: driftReport.baselineTimestamp,
            short: false
          }
        ]
      }]
    };
    
    // Send webhook (implementation depends on your webhook service)
    console.log('🚨 Sending drift alert...');
    // fetch(webhookUrl, { method: 'POST', body: JSON.stringify(message) });
  }
}

// CLI interface
async function main() {
  const detector = new DriftDetector();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'baseline':
        await detector.captureBaseline();
        break;
      case 'detect':
        await detector.detectDrift();
        break;
      default:
        console.log('Usage:');
        console.log('  node drift-detector.js baseline  # Capture current state as baseline');
        console.log('  node drift-detector.js detect    # Detect drift from baseline');
        break;
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

// Cron job setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DriftDetector };
```

## Best Practices for Production

### Security Hardening

1. **Credential Management**:
   ```bash
   # Use dedicated service accounts
   # Rotate credentials regularly
   # Monitor credential usage
   # Use minimum required permissions
   ```

2. **Environment Isolation**:
   ```bash
   # Separate API keys per environment
   # Network isolation where possible
   # Different authentication scopes
   ```

3. **Audit Logging**:
   ```bash
   # Log all CLI operations
   # Monitor for unusual activity
   # Retain logs for compliance
   ```

### Operational Excellence

1. **Automation Standards**:
   ```bash
   # Idempotent operations
   # Comprehensive error handling
   # Rollback capabilities
   # Health checks
   ```

2. **Monitoring and Alerting**:
   ```bash
   # Deployment success/failure alerts
   # Configuration drift detection
   # Performance monitoring
   # Capacity planning
   ```

3. **Documentation and Training**:
   ```bash
   # Runbook documentation
   # Incident response procedures
   # Team training programs
   # Change management processes
   ```

---

*Advanced CLI usage enables sophisticated automation and operational workflows. Use these patterns to build reliable, scalable, and secure content management processes that support your organization's growth.*