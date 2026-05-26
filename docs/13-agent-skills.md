# Agent Skills for Optimizely CMS

Accelerate your Optimizely CMS development with AI-powered Agent Skills. These skills teach AI coding agents how to work with Optimizely CMS, enabling automated content type modeling, React component generation, live preview setup, and SDK configuration.

## What are Agent Skills?

Agent Skills are a standardized, open format for extending AI agent capabilities with specialized knowledge and workflows. Following the [Agent Skills specification](https://agentskills.io), these skills work across 40+ AI agents including:

- **[Claude Code](https://claude.ai/code)** - Terminal, IDE, desktop app, and browser
- **[Cursor](https://cursor.com/)** - AI-first code editor
- **[GitHub Copilot](https://github.com/features/copilot)** - AI pair programmer in VS Code and other editors
- **[OpenCode](https://opencode.ai/)** - Open source coding agent
- **[And many more](https://agentskills.io/clients)** - See the complete list of compatible agents

Skills use **progressive disclosure**: your AI agent loads only skill names and descriptions at startup, then loads full instructions when a task matches. This keeps the context footprint small while providing powerful domain expertise when needed.

## Prerequisites

Before using these skills, ensure you have:

1. **Compatible AI Agent** - Claude Code, Cursor, GitHub Copilot, or any [Agent Skills-compatible agent](https://agentskills.io/clients)
2. **Optimizely CMS SDK** - Installed in your project (`npm install @optimizely/cms-sdk`)
3. **Optimizely CMS CLI** - Installed as dev dependency (`npm install -D @optimizely/cms-cli`)
4. **Optimizely CMS Instance** - Access to an Optimizely CMS instance with API credentials
5. **Node.js** - Version 22+ recommended

> **Already set up?** If not, follow the [Setup guide](./2-setup.md) first.

## Installation

### Option 1: Claude Code Plugin Marketplace (Recommended for Claude Code Users)

The fastest way to get started with Claude Code:

```
# In Claude Code, add the marketplace
/plugin marketplace add episerver/content-js-sdk

# Install the plugin (installs all 4 skills at once)
/plugin install optimizely-cms-skills@episerver-content-js-sdk
```

This installs all skills automatically and keeps them updated.

### Option 2: GitHub CLI (For Any Agent Skills-Compatible Agent)

Install individual skills using the GitHub CLI:

```bash
# Install all four skills
gh skill install episerver/content-js-sdk optimizely-model --agent claude-code
gh skill install episerver/content-js-sdk optimizely-model-react --agent claude-code
gh skill install episerver/content-js-sdk optimizely-preview --agent claude-code
gh skill install episerver/content-js-sdk optimizely-setup --agent claude-code
```

Replace `claude-code` with your agent name (e.g., `cursor`, `copilot`).

### Option 3: Manual Installation

Clone the repository and copy skills to your agent's skills directory:

```bash
# Clone the repository
git clone https://github.com/episerver/content-js-sdk.git

# Copy all skills to your .claude/skills directory
cp -r content-js-sdk/packages/optimizely-cms-skills/skills/* ~/.claude/skills/

# Or copy to your project's .claude/skills directory
mkdir -p .claude/skills
cp -r content-js-sdk/packages/optimizely-cms-skills/skills/* .claude/skills/
```

## Available Skills

### 1. optimizely-model

**What it does:** Models Optimizely CMS content types, display templates, and contracts using TypeScript.

**Use when you want to:**
- Create a new content type (page, component, block, experience)
- Define display templates for visual variations
- Create contracts (reusable property sets)
- Model content based on CMS definitions

**Example trigger phrases:**
- "Create a BlogPage content type"
- "Add an Article type with title and body"
- "Make a Hero component"
- "Create an SEO contract"

**What it generates:**
- TypeScript content type definitions
- Property definitions with correct types
- Content registry updates
- Display template definitions

### 2. optimizely-model-react

**What it does:** Generates React components for Optimizely CMS content types and display templates.

**Use when you want to:**
- Create React component implementations for content types
- Render content in your React application
- Implement display templates with settings
- Set up component registration

**Example trigger phrases:**
- "Create React component for BlogPage"
- "Implement the Hero component"
- "Add component for Article"
- "Render the CardTemplate"

**What it generates:**
- React component boilerplate
- Preview attribute handling
- RichText, image, and content reference rendering
- Component registry updates

### 3. optimizely-preview

**What it does:** Sets up or troubleshoots Optimizely CMS live preview in React applications.

**Use when you want to:**
- Enable live preview in your application
- Configure preview for different frameworks
- Debug preview issues
- Set up preview routes

**Example trigger phrases:**
- "Set up live preview"
- "Preview not working"
- "Configure preview for Next.js App Router"
- "Preview shows blank screen"

**What it handles:**
- Preview route creation (Next.js, TanStack Start, etc.)
- Environment variable configuration
- CMS communication setup
- Troubleshooting common issues

### 4. optimizely-setup

**What it does:** Sets up the Optimizely CMS JavaScript SDK in a project from scratch.

**Use when you want to:**
- Initial SDK installation and configuration
- Create API credentials setup
- Generate configuration files
- Configure environment variables

**Example trigger phrases:**
- "Set up Optimizely"
- "Install the CMS SDK"
- "Configure content delivery API"
- "Initialize Optimizely in my project"

**What it handles:**
- Package manager detection and installation
- `.env` file creation with API credentials
- `optimizely.config.mjs` generation
- `.gitignore` configuration

## Complete Workflow Examples

### Example 1: Building a Blog System from Scratch

Let's create a complete blog system with content types and React components.

**Step 1: Set up the SDK (if not already done)**

```
You: "Set up Optimizely SDK in my Next.js project"

Agent: [Uses optimizely-setup skill]
- Detects pnpm as package manager
- Installs @optimizely/cms-sdk and @optimizely/cms-cli
- Creates .env file prompting for credentials
- Generates optimizely.config.mjs
- Updates .gitignore
```

**Step 2: Create content types**

```
You: "Create a BlogPage content type with title (string), author (string), 
      publishDate (date), and body (richText) fields"

Agent: [Uses optimizely-model skill]
- Creates src/components/BlogPage.tsx
- Adds all properties with correct types
- Registers BlogPage in content registry
- Suggests running 'config push' to sync with CMS
```

**Step 3: Create React components**

```
You: "Now create the React component for BlogPage"

Agent: [Uses optimizely-model-react skill]
- Generates BlogPage component in src/components/BlogPage.tsx
- Adds preview attributes with getPreviewUtils()
- Implements RichText rendering for body
- Formats date display for publishDate
- Registers component in initReactComponentRegistry
```

**Step 4: Set up live preview**

```
You: "Set up live preview for Next.js App Router"

Agent: [Uses optimizely-preview skill]
- Creates app/api/optimizely/preview/route.ts
- Sets up OPTIMIZELY_CMS_URL in .env
- Provides instructions for CMS configuration
- Explains how to test preview
```

### Example 2: Creating Content with References

```
You: "Create a ProductPage with name, description, price, and an array of 
      RelatedProducts that reference other ProductPages"

Agent: [Uses optimizely-model skill]
- Creates ProductPage content type
- Adds basic properties (name, description, price)
- Adds relatedProducts array with ContentReference to ProductPage
- Handles TypeScript types for content references
- Registers in content registry

You: "Add the React component"

Agent: [Uses optimizely-model-react skill]
- Creates ProductPage component
- Renders basic properties
- Fetches and renders related products array
- Uses getContent() for content references
- Adds proper TypeScript typing
```

### Example 3: Display Templates

```
You: "Create a Card display template for Article with settings for 
      showImage (boolean) and cardStyle (choice of 'minimal' or 'detailed')"

Agent: [Uses optimizely-model skill]
- Creates ArticleCardTemplate display template
- Adds settings with correct types
- Uses ChoiceField for cardStyle
- Links template to Article content type
- Registers in template registry

You: "Create the React component for this template"

Agent: [Uses optimizely-model-react skill]
- Creates ArticleCard component
- Accesses settings via displaySettings
- Conditionally renders image based on showImage
- Applies different styling based on cardStyle
- Registers component with template
```

## Tips for Effective Usage

### 1. Be Specific About Requirements

**Good:** "Create a BlogPage with title, author, publishDate, and richText body"

**Less effective:** "Make a blog page"

### 2. Mention the Framework

**Good:** "Set up preview for Next.js App Router"

**Less effective:** "Set up preview"

### 3. Build Incrementally

Start with content types, then add React components, then set up preview. The skills work best in sequence.

### 4. Review Generated Code

While skills generate production-ready code, always review:
- TypeScript types match your needs
- Content properties are correctly modeled
- Component rendering matches your design
- Preview setup works in your environment

### 5. Combine Skills

Skills work together. For example:
1. Use `optimizely-model` to create types
2. Use `optimizely-model-react` to create components
3. Use `optimizely-preview` to enable editing

## Updating Skills

### Claude Code Plugin:

```
/plugin update optimizely-cms-skills@episerver-content-js-sdk
```

### GitHub CLI:

```bash
# Reinstall to get latest version
gh skill install episerver/content-js-sdk optimizely-model --force
```

### Manual Updates:

```bash
# Pull latest changes
cd content-js-sdk
git pull origin main

# Copy updated skills
cp -r packages/optimizely-cms-skills/skills/* ~/.claude/skills/
```

## Compatible Agents

These skills work with any agent supporting the Agent Skills specification:

| Agent | Platform | Installation Method |
|-------|----------|---------------------|
| [Claude Code](https://claude.ai/code) | Terminal, IDE, Desktop, Browser | Plugin marketplace or GitHub CLI |
| [Cursor](https://cursor.com/) | Desktop app | GitHub CLI |
| [GitHub Copilot](https://github.com/features/copilot) | VS Code, JetBrains, CLI | GitHub CLI |
| [VS Code](https://code.visualstudio.com/) | Desktop app | GitHub CLI |
| [OpenCode](https://opencode.ai/) | CLI, Desktop | GitHub CLI |

See the [complete list](https://agentskills.io/clients) of 40+ compatible agents.

## Troubleshooting

### Skills Not Loading

**Problem:** AI agent doesn't seem to use the skills.

**Solutions:**
- Verify skills are installed: Check `~/.claude/skills/` or `.claude/skills/`
- Restart your AI agent
- Check skill names match: `optimizely-model`, `optimizely-model-react`, etc.
- Use trigger phrases that match skill descriptions

### Wrong Code Generated

**Problem:** Agent generates incorrect code for Optimizely CMS.

**Solutions:**
- Be more specific in your request
- Mention Optimizely CMS explicitly in your prompt
- Check that skills are up to date
- Verify your SDK version matches skills (2.0.0+)

### Preview Not Working

**Problem:** Live preview doesn't work after setup.

**Solutions:**
- Use the `optimizely-preview` skill to troubleshoot
- Check `.env` file has correct `OPTIMIZELY_CMS_URL`
- Verify CMS configuration has correct preview URL
- Check browser console for errors
- Ensure Next.js/framework setup is correct

### Installation Issues

**Problem:** Skills won't install via GitHub CLI.

**Solutions:**
- Install GitHub CLI: `brew install gh` (Mac) or download from [cli.github.com](https://cli.github.com)
- Authenticate: `gh auth login`
- Try manual installation method instead
- For Claude Code, use plugin marketplace

## Next Steps

Now that you have Agent Skills installed:

1. **Create your first content type** - Try: "Create a HomePage content type"
2. **Generate a React component** - Try: "Create React component for HomePage"
3. **Set up preview** - Try: "Set up live preview for my framework"
4. **Explore the SDK** - Read the [Modelling guide](./3-modelling.md) for deeper understanding

## Support

Need help with Agent Skills or Optimizely CMS?

- **Community Slack**: Join the [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **GitHub Issues**: Report issues on [GitHub](https://github.com/episerver/content-js-sdk/issues)
- **Documentation**: Browse our [documentation](https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/install-javascript-sdk)
- **Agent Skills Docs**: Learn more at [agentskills.io](https://agentskills.io)

---

**Ready to boost your productivity?** Install the skills and start building with AI assistance!
