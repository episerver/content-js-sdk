# Optimizely CMS Agent Skills

[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Compatible-blue)](https://agentskills.io)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../LICENSE)

A collection of [Agent Skills](https://agentskills.io) that teach AI coding agents how to work with Optimizely CMS. These skills enable AI agents to help with content type modeling, React component generation, live preview setup, and SDK configuration.

## What are Agent Skills?

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. Following the [Agent Skills specification](https://agentskills.io/specification), these skills work across 40+ AI agents including Claude Code, Cursor, GitHub Copilot, and more.

Skills use **progressive disclosure**: agents load only skill names and descriptions at startup, then load full instructions when a task matches. This keeps context footprint small while providing powerful domain expertise.

## Available Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| **optimizely-model** | Model Optimizely CMS content types, display templates, and contracts with TypeScript | "Create a BlogPage content type", "Add an Article type", "Make a Hero component" |
| **optimizely-model-react** | Generate React components for Optimizely CMS content types and display templates | "Create React component for BlogPage", "Implement the Hero component", "Add component for Article" |
| **optimizely-preview** | Set up or troubleshoot Optimizely CMS live preview in React applications | "Set up live preview", "Preview not working", "Configure preview for Next.js" |
| **optimizely-setup** | Set up the Optimizely CMS JavaScript SDK in a project | "Set up Optimizely", "Install the CMS SDK", "Configure content delivery API" |

## Installation

### Option 1: Claude Code Plugin Marketplace (Recommended for Claude Code users)

Install all skills at once using the Claude Code plugin system:

```
# In Claude Code, add the marketplace
/plugin marketplace add episerver/content-js-sdk

# Install the plugin (installs all 4 skills)
/plugin install optimizely-cms-skills@episerver-content-js-sdk
```

### Option 2: GitHub CLI (For any Agent Skills-compatible agent)

Install individual skills using the GitHub CLI:

```bash
# Install the content type modeling skill
gh skill install episerver/content-js-sdk optimizely-model --agent claude-code

# Install the React component generation skill
gh skill install episerver/content-js-sdk optimizely-model-react --agent claude-code

# Install the live preview skill
gh skill install episerver/content-js-sdk optimizely-preview --agent claude-code

# Install the SDK setup skill
gh skill install episerver/content-js-sdk optimizely-setup --agent claude-code
```

> **Note:** Replace `claude-code` with your agent name (e.g., `cursor`, `copilot`)

### Option 3: Manual Installation

Clone the repository and copy skills to your agent's skills directory:

```bash
# Clone the repository
git clone https://github.com/episerver/content-js-sdk.git

# Copy all skills to your .claude/skills directory
cp -r content-js-sdk/skills/* ~/.claude/skills/

# Or copy individual skills
cp -r content-js-sdk/skills/optimizely-model ~/.claude/skills/
```

### Option 4: Project-Level Installation

Add skills to your project's `.claude/skills/` directory for project-specific use:

```bash
# Create project skills directory
mkdir -p .claude/skills

# Copy skills from this repository
cp -r skills/* .claude/skills/
```

## Usage Examples

### Example 1: Initial SDK Setup

```
User: "Set up Optimizely CMS SDK in my Next.js project"

Agent: [Uses optimizely-setup skill]
       - Detects package manager (pnpm, npm, or yarn)
       - Installs @optimizely/cms-sdk and @optimizely/cms-cli
       - Creates .env file and prompts for API credentials
       - Generates optimizely.config.mjs configuration
       - Updates .gitignore to exclude .env
       - Provides instructions for obtaining CMS API credentials
```

### Example 2: Set Up Live Preview

```
User: "I need to set up live preview for my Next.js App Router project"

Agent: [Uses optimizely-preview skill]
       - Creates preview route at app/api/optimizely/preview/route.ts
       - Sets up environment variables
       - Configures communication with CMS
       - Provides CMS configuration instructions
```

### Example 3: Create Content Types and Components

```
User: "Create a BlogPage content type with title, author, publishDate, and body fields"

Agent: [Uses optimizely-model skill]
       - Creates BlogPage.tsx with TypeScript content type definition
       - Adds properties with correct types
       - Registers in content registry
       
User: "Now create the React component for it"

Agent: [Uses optimizely-model-react skill]
       - Generates BlogPage React component
       - Adds preview attributes
       - Handles rich text rendering
       - Registers in component registry
```

## Requirements

- **AI Agent**: Claude Code, Cursor, GitHub Copilot, or any [Agent Skills-compatible agent](https://agentskills.io/clients)
- **Optimizely CMS SDK**: Install with `npm install @optimizely/cms-sdk`
- **Optimizely CMS CLI**: `npm install -D @optimizely/cms-cli`
- **Optimizely CMS**: Access to an Optimizely CMS instance
- **Node.js**: Version 22+ recommended

## How It Works

These skills use the [Agent Skills specification](https://agentskills.io/specification):

1. **Discovery**: Your AI agent loads skill names and descriptions at startup
2. **Activation**: When you request something matching a skill's description, the agent loads full instructions
3. **Execution**: The agent follows the skill's instructions to help you complete the task

Skills contain:

- **SKILL.md**: YAML metadata + markdown instructions
- Domain-specific knowledge about Optimizely CMS
- Best practices for SDK usage
- Common patterns and examples

## Compatible Agents

These skills work with any agent supporting the Agent Skills specification:

- [Claude Code](https://claude.ai/code) - Terminal, IDE, desktop, and browser
- [Cursor](https://cursor.com/) - AI-first code editor
- [GitHub Copilot](https://github.com/features/copilot) - AI pair programmer
- [VS Code](https://code.visualstudio.com/) - With Copilot extension
- [OpenCode](https://opencode.ai/) - Open source coding agent
- [And more](https://agentskills.io/clients) - See full list

## Documentation

For complete Optimizely CMS SDK documentation:

- [Installation](../docs/1-installation.md) - Set up your development environment
- [Setup](../docs/2-setup.md) - Configure the SDK and CLI
- [Modelling](../docs/3-modelling.md) - Define content types with TypeScript
- [Rendering (React)](../docs/6-rendering-react.md) - Display content in React components
- [Live Preview](../docs/7-live-preview.md) - Enable real-time content editing
- [Agent Skills Guide](../docs/13-agent-skills.md) - Complete guide to using these skills

## Updating Skills

### With Claude Code Plugin:

```
/plugin update optimizely-cms-skills@episerver-content-js-sdk
```

### With GitHub CLI:

```bash
# Reinstall to get latest version
gh skill install episerver/content-js-sdk optimizely-model --force
```

### Manual Updates:

```bash
# Pull latest changes
cd content-js-sdk
git pull

# Copy updated skills
cp -r skills/* ~/.claude/skills/
```

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
