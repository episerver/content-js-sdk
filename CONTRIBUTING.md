# Development guide

## Pre-requirements

- Latest LTS version of [Node.js](https://nodejs.org/) (version 22 at the time of writing)
- [pnpm](https://pnpm.io) package manager (version 10 at the time of writing)

## Getting started

1. Clone the repository
2. Run `pnpm install` from the repository root.
3. Run `pnpm build` from the repository root.

Now you have the repository ready! Depending on what do you want to develop, you need to follow additional steps.

### Run the SDK

The SDK is a development library. It does not contain any runtime

### Run the CLI

You can run `optimizely-cms-cli` locally from the sample sites (for example, inside `/samples/nextjs-template`) by using the command:

```
pnpm exec optimizely-cms-cli
```

The CLI provides commands that are organised in topics. You can see them by running either of those commands:

```
pnpm exec optimizely-cms-cli
pnpm exec optimizely-cms-cli --help
```

You can also pass the `--help` flag to any command to see the flags and arguments for each of them

### Run the sample sites

- For `nextjs-template`, read the [README.md file in that project](./samples/nextjs-template/README.md)

## Repository structure

This repository is a mono-repo, meaning that multiple packages and artifacts are in the same repository.

1. The directory `packages` include npm packages. These are libraries and tools that users will install from a package registry.

   - The `optimizely-cms-sdk` is the core library. Samples and the `optimizely-cms-cli` depend on this.
   - The `optimizely-cms-cli` is a CLI tool for managing the CMS.

2. The directory `samples` include are web applications developed to showcase the tools.

## Versioning and release workflow

### Create a pre-release

1. Create a `release/` branch.

   - If you are releasing one package use the name `release/package-name@x.y.z`
   - If you are releasing multiple packages, any other name

2. Bump version of the packages

   -

   ```
   pnpm version
   ```

3. Push the release branch
4. Go to GitHub and create a Draft release **for every released package**

   - The tag should be `package-name@x.y.z`

### Create more pre-release versions

If the packages are not ready for release, and you need to create one more pre-release version of them:

1. Checkout to the `release/` branch you created
2. Bump version of the packages

   ```
   pnpm exec lerna version
   ```

3. Push the branch

### Publish the packages

If the packages are ready for release

1. Bump version of the packages

   ```
   pnpm exec lerna version
   ```

2. Go to GitHub and publish the releases
3. Merge the PR to `main` branch
