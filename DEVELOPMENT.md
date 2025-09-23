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

### Create a pre-release

1. Create a `release/` branch.

   - If you are releasing one package use the name `release/package-name@x.y.z`
   - If you are releasing multiple packages, choose any other name

2. For every package that gets released, edit the package.json file with the new pre-release version

   - For example `0.1.0-alpha.1`

3. Push the release branch (`git push`)
4. Go to GitHub and create one Draft release **for every released package**.

   - Tag: `<<package name>>@<<version>>`. E.g. `@optimizely/cms-cli@0.1.0`
   - Release name (same as tag)
   - Branch: choose the branch you have just created

### Create more pre-release versions

If the packages are not ready for release, and you need to create one more pre-release version of them:

1. Checkout to the `release/` branch you created
2. For every package that gets released, bump the version in package.json and create a new
3. Push the branch and the tags

### Publish the packages

When the packages are ready for release

1. For every package, edit the package.json with the release version.
2. Push the branch to GitHub
3. Go to GitHub and publish the releases

   - Add the newly created tags to each of the releases

4. Merge the PR to `main` branch

## Project structure

This repository is a mono-repo, meaning that multiple packages and artifacts are in the same repository.

```
.
├── packages/
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

2. The directory `samples` include are web applications developed to showcase the tools.
