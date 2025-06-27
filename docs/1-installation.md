# Installation

This page explains how to install the Optimizely SDK and CLI into your project.

- The SDK is a library with tools to model your content, fetch it and render it
- The CLI is a terminal app to upload your models to the CMS via the CMS REST API

## Step 1. Setup access to the GitHub package registry

> [!NOTE]
> The packages are at this moment published only in GitHub package registry.

[Create a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with at least `read:packages` scope

Once you create the personal access token, you must [authorize it to access to Optimizely via SSO](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on): click "Configure SSO" and choose Optimizely to give access

In your `$HOME` directory (`~/` in Mac/Linux, `C:\Users\<username>` in Windows) create a file called `.npmrc` with the following content (replace `<YOUR TOKEN>` with your actual personal access token, and make sure the line is not commented out):

```
@episerver:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<YOUR TOKEN>
```

## Step 2. Install the SDK

```sh
npm install @episerver/cms-sdk
```

## Step 3. Use the CLI

To use the CLI, you can:

1. Use it without installation
2. Install globally in your system
3. Install locally in a project

### Use without installation

```sh
# You can use `pnpx`, `yarn dlx`, etc. instead of `npx`
npx @episerver/cms-cli
```

### Install globally

```sh
npm install @episerver/cms-cli -g
```

You can test that it worked by running:

```sh
optimizely-cms-cli
```

### Install in a project

```sh
npm install @episerver/cms-cli -D
```

Then use `npx` (or `pnpx`, or `yarn dlx`):

```sh
npx optimizely-cms-cli
```

## Next steps

Now, you are ready to [set up the CLI](./2-setup.md)
