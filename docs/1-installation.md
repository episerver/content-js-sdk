# Installation

This page explains how to install the Optimizely SDK and CLI into your project.

- The SDK is a library with tools to model your content, fetch it and render it
- The CLI is a terminal app to upload your models to the CMS via the CMS REST API

## Step 1. Setup access to the GitHub package registry

> [!NOTE]
> The packages are at this moment published only in GitHub package registry.

1. [Create a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with at least `read:packages` scope

   > [!NOTE]
   > If you are a Optimizely employee, once you create the personal access token, you must [authorize it to access to Optimizely via SSO](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on): click "Configure SSO" and choose Optimizely to give access

2. In your `$HOME` directory (`~/` in Mac/Linux, `C:\Users\<username>` in Windows) create a file called `.npmrc` with the following content (replace `<YOUR TOKEN>` with your actual personal access token):

   ```
   @episerver:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=<YOUR TOKEN>
   ```

## Step 2. Test that you have access to the CLI

You can use the CLI directly by running

```sh
npx @episerver/cms-cli@latest
```

You should see a command list

<details><summary>Alternative installation</summary>

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

Then use it from the project:

```sh
npx optimizely-cms-cli
```

</details>

## Step 3. Initialize a npm project

We recommend to initialize a Next.js project. Run:

```sh
npx create-next-app@latest
```

And select the following prompts:

- Would you like to use TypeScript: Yes
- Would you like your code inside a `src/` directory? Yes
- Would you like to use App Router? (recommended) Yes

## Step 4. Install the SDK

```sh
npm install @episerver/cms-sdk
```

## Next steps

Now, you are ready to [set up the CLI](./2-setup.md)
