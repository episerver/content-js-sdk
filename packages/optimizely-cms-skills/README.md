# Optimizely CMS Agent Skills

[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Compatible-blue)](https://agentskills.io)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../../LICENSE)

A collection of [Agent Skills](https://agentskills.io) that teach AI coding agents how to work with Optimizely CMS. Compatible with Claude Code, Cursor, GitHub Copilot, and others.

## What's Included

This package contains 4 Agent Skills:

- **optimizely-model** - Model content types, display templates, and contracts with TypeScript
- **optimizely-model-react** - Generate React components for content types and display templates
- **optimizely-preview** - Set up or troubleshoot live preview in React applications
- **optimizely-setup** - Set up the Optimizely CMS JavaScript SDK from scratch

## Quick Start

### Option 1: Claude Code Plugin Marketplace (Recommended)

```
# In Claude Code, add the marketplace
/plugin marketplace add episerver/content-js-sdk

# Install the plugin (installs all skills)
/plugin install optimizely-cms-skills@episerver-content-js-sdk
```

### Option 2: GitHub CLI

```bash
# Install individual skills
gh skill install episerver/content-js-sdk optimizely-model --agent claude-code
gh skill install episerver/content-js-sdk optimizely-model-react --agent claude-code
gh skill install episerver/content-js-sdk optimizely-preview --agent claude-code
gh skill install episerver/content-js-sdk optimizely-setup --agent claude-code
```

### Option 3: Manual Installation

```bash
# Clone the repository
git clone https://github.com/episerver/content-js-sdk.git

# Copy skills to your agent's skills directory
cp -r content-js-sdk/packages/optimizely-cms-skills/skills/* ~/.claude/skills/
```

## Documentation

- **[Skills Documentation](./skills/README.md)** - Detailed information about each skill
- **[Complete Guide](../../docs/13-agent-skills.md)** - Full guide with usage examples and workflows
- **[Main SDK Documentation](../../README.md)** - Optimizely CMS JavaScript SDK

## Usage Example

```
You: "Create a BlogPage content type with title, author, and body fields"

Agent: [Uses optimizely-model skill]
- Creates TypeScript content type definition
- Adds properties with correct types
- Registers in content registry

You: "Now create the React component"

Agent: [Uses optimizely-model-react skill]  
- Generates React component
- Adds preview attributes
- Handles rich text rendering
```

## Requirements

- **AI Agent**: Claude Code, Cursor, GitHub Copilot, or any [Agent Skills-compatible agent](https://agentskills.io/clients)
- **Optimizely CMS SDK**: `npm install @optimizely/cms-sdk`
- **Optimizely CMS CLI**: `npm install -D @optimizely/cms-cli`
- **Optimizely CMS**: Access to a CMS instance
- **Node.js**: Version 22+ recommended

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
