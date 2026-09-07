# Development guide

This guide are instructions for maintainers. For general installation instructions, read the [README](./README.md) file

## Pre-requirements

- Latest LTS version of [Node.js](https://nodejs.org/) (version 22 at the time of writing)
- [pnpm](https://pnpm.io) package manager (version 10 at the time of writing)

## Installation

1. Clone the repository
2. Run `pnpm install` from the repository root.
3. Run `pnpm build` from the repository root to build all the packages.

### 1. Run the CLI

You can run `optimizely-cms-cli` _locally_ (i.e. run from source code) from the sample sites (for example, inside `/samples/nextjs-template`) by using the command:

```
pnpm exec optimizely-cms-cli
```

The CLI provides commands that are organised in topics. You can see them by running either of those commands:

```
pnpm exec optimizely-cms-cli
pnpm exec optimizely-cms-cli --help
```

You can also pass the `--help` flag to any command to see the flags and arguments for each of them

### 2. Run the sample site

- For `nextjs-template`, read the [README.md file in that project](./samples/nextjs-template/README.md)

## Versioning and release workflow

This project uses [Changesets](https://github.com/changesets/changesets) for version management and releases.

### Adding a changeset

When contributing a feature or bugfix, include a changeset to document the change:

```bash
pnpm changeset
```

Follow the prompts to:

1. Select the affected package(s) (`optimizely-cms-sdk`, `optimizely-cms-cli`)
2. Choose the change type:
   - `patch` for bug fixes
   - `minor` for new features
   - `major` for breaking changes
3. Write a description (becomes the changelog entry)

Commit the generated `.changeset/*.md` file with your changes.

When the version bump PR is created, each changelog entry is automatically prefixed
with a link to its Jira ticket (via [`.issuetracker`](./.issuetracker)), read from the
branch name in the merge commit that added the changeset file.

### Release process

Releases are managed through GitHub Actions workflows. Changesets accumulate until you're ready to release.

#### Beta release (optional)

1. **Create version bump PR**
   - Go to GitHub Actions → "Create Version Bump PR"
   - Check "Pre-release mode (beta)"
   - Run workflow

2. **Review and merge**
   - Bot creates a PR that bumps versions (e.g., `2.1.0` → `2.2.0-beta.0`)
   - Review the changes and merge to `main`

3. **Publish to npm**
   - Go to GitHub Actions → "Release Packages"
   - Run workflow
   - Packages publish with `@beta` tag

4. **Test and iterate**
   - QA tests using `npm install @optimizely/cms-sdk@beta`
   - For fixes, add changesets and repeat steps 1-3 (versions bump to `beta.1`, `beta.2`, etc.)

#### Stable release

1. **Create version bump PR**
   - Go to GitHub Actions → "Create Version Bump PR"
   - Uncheck "Pre-release mode (beta)"
   - Run workflow

2. **Review and merge**
   - Bot creates a PR that bumps versions (e.g., `2.2.0-beta.1` → `2.2.0`)
   - Review and merge to `main`

3. **Publish to npm**
   - Go to GitHub Actions → "Release Packages"
   - Run workflow
   - Packages publish with `@latest` tag
   - Beta versions automatically deprecated

#### Direct stable release (skip beta)

Follow the stable release steps above. The version bump will go directly from the current version to the next stable version without a beta phase.

## Project structure

This repository is a mono-repo, meaning that multiple packages and artifacts are in the same repository.

```text
.
├── packages/
│   ├── optimizely-cms-create-app/
│   ├── optimizely-cms-cli/
│   └── optimizely-cms-sdk/
├── samples/
│   └── nextjs-template/
├── CONTRIBUTING.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

1. The directory `packages` include npm packages. These are libraries and tools that users will install from a package registry.

   - The `optimizely-cms-sdk` is the core library. Samples and the `optimizely-cms-cli` depend on this.
   - The `optimizely-cms-cli` is a CLI tool for managing the CMS.
   - The `optimizely-cms-create-app` is a project scaffolding tool for creating new applications.

2. The directory `samples` include are web applications developed to showcase the tools.
