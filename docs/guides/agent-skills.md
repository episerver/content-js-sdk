# Use agent skills

AI coding agents write better Optimizely CMS code when they know the SDK's conventions.
**Agent skills** give them that knowledge: how to model content types, generate React
components, set up live preview, configure the SDK and more.

> **You will learn**
>
> - How to install the skills
> - Where to find the list of skills
> - Where to get help

The skills live in their own repository,
[episerver/optimizely-cms-skills](https://github.com/episerver/optimizely-cms-skills).

## Install the skills

### With the Claude Code plugin marketplace

Run these commands inside Claude Code:

```text
/plugin marketplace add episerver/optimizely-cms-skills
/plugin install optimizely-cms-skills@optimizely-cms
```

### With the GitHub CLI

This works with any agent that supports the
[Agent Skills specification](https://agentskills.io). Install one skill at a time, naming
your agent:

```sh
gh skill install episerver/optimizely-cms-skills optimizely-model --agent claude-code
```

### Manually

Clone the repository and copy the skills into your agent's skills folder. For Claude Code,
that is `~/.claude/skills/`:

```sh
git clone https://github.com/episerver/optimizely-cms-skills.git
cp -r optimizely-cms-skills/skills/* ~/.claude/skills/
```

## Find the available skills

The [repository README](https://github.com/episerver/optimizely-cms-skills#skills) has the
complete, up-to-date list of skills, with usage examples.

## Get help

- **Problems with a skill**:
  [optimizely-cms-skills issues](https://github.com/episerver/optimizely-cms-skills/issues)
- **Problems with the SDK**:
  [content-js-sdk issues](https://github.com/episerver/content-js-sdk/issues)
- **Questions**:
  [Optimizely Community Slack](https://optimizely-community.slack.com/archives/C0952JAST5J)

## Recap

- Agent skills teach AI coding agents how to work with the SDK.
- Install them from the Claude Code plugin marketplace, with `gh skill install`, or by
  copying them into your agent's skills folder.
- The skills repository's README lists every skill.

## Related

- [Quick start](../learn/quick-start.md)
- [Content types](./content-types.md)
- [Live preview](../learn/live-preview.md)
