# Agent Skills for Optimizely CMS

Agent Skills teach AI coding agents how to work with Optimizely CMS — content type modelling, React component generation, live preview setup, SDK configuration and more.

The skills live in their own repository: **[episerver/optimizely-cms-skills](https://github.com/episerver/optimizely-cms-skills)**.

## Installation

### Claude Code plugin marketplace

```
/plugin marketplace add episerver/optimizely-cms-skills
/plugin install optimizely-cms-skills@optimizely-cms
```

### GitHub CLI (any Agent Skills-compatible agent)

```bash
gh skill install episerver/optimizely-cms-skills optimizely-model --agent claude-code
```

### Manual

```bash
git clone https://github.com/episerver/optimizely-cms-skills.git
cp -r optimizely-cms-skills/skills/* ~/.claude/skills/
```

## Available skills

See the [repository README](https://github.com/episerver/optimizely-cms-skills#skills) for the complete, up-to-date list of skills and usage examples.

## Support

- **Skills issues**: [optimizely-cms-skills issues](https://github.com/episerver/optimizely-cms-skills/issues)
- **SDK issues**: [content-js-sdk issues](https://github.com/episerver/content-js-sdk/issues)
- **Community Slack**: [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)
- **Agent Skills spec**: [agentskills.io](https://agentskills.io)
