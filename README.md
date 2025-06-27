# Optimizely CMS JavaScript tools

## 📚 Documentation

For comprehensive guides, API references, and advanced usage patterns, see the **[complete documentation](./docs/)**.

**Quick Links:**
- **[Getting Started with SDK](./docs/cms-sdk/getting-started.md)** - Build your first content-driven application
- **[Getting Started with CLI](./docs/cms-cli/getting-started.md)** - Automate content type deployments
- **[API Reference](./docs/cms-sdk/api-reference.md)** - Complete SDK API documentation
- **[Commands Reference](./docs/cms-cli/commands-reference.md)** - Complete CLI command reference

## Installation

> [!NOTE]
> The packages are at this moment published only in GitHub package registry.

### 1. Setup access to the GitHub package registry

[Create a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with at least `read:packages` scope

Once you create the personal access token, you must [authorize it to access to Optimizely via SSO](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on): click "Configure SSO" and choose Optimizely to give access

In your `$HOME` directory (`~/` in Mac/Linux, `C:\Users\<username>` in Windows) create a file called `.npmrc` with the following content:

```
@episerver:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<YOUR TOKEN>
```

### 2. Run the CLI without installation

Run:

```sh
# You can use `pnpx`, `yarn dlx`, etc. instead of `npx`
npx @episerver/cms-cli
```

### (optional) Install the CLI globally

```sh
npm install @episerver/cms-cli -g

# Note: the binary is called `optimizely-cms-cli`:
optimizely-cms-cli
```

### 3. Install the SDK in a project

```sh
# You can use `pnpm`, `yarn`, etc. instead of `npm`
npm install @episerver/cms-sdk
```
