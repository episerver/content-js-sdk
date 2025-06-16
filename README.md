# Optimizely CMS JavaScript tools

## Getting started

> [!Note] The packages are at this moment published only in GitHub package registry.

### 1. Create a GitHub token with access rights

[Create a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with at least `read:packages` scope

### 2. Login to GitHub package registry

In your project, add a file called `.npmrc` with the following content (replace `<YOUR TOKEN>` with the token obtained in the previous step):

```
@episerver:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<YOUR TOKEN>
```

### 3. Install the packages

```sh
# Replace with `pnpm`, `yarn`, etc if you use a different package manager
npm install @episerver/cms-sdk
npm install @episerver/cms-cli
```
