# Deploy to Optimizely front-end hosting

Optimizely front-end hosting runs a Next.js or Astro front end for your CMS (SaaS) instance on
the DXP platform, with the Cloudflare CDN and WAF included. The `deploy` command in
`@optimizely/cms-cli` packages your project, uploads it, starts the deployment and completes it:

```bash
npx optimizely-cms-cli deploy --env Test1
```

## Before you start

### Access

You need Opti ID enabled for the front-end project, and the **Power User** role on the
**Developer portal (front end)** product. See
[Host a front end with Optimizely](https://docs.optimizely.com/cms-saas/docs/host-a-front-end-with-optimizely)
for the steps.

### Credentials

In the DXP management portal, open the **API** tab and create an API key. Select every
environment you want to deploy to. The secret is shown only once.

Add the values to `.env` in your project, or to your CI secrets:

```ini
OPTIMIZELY_DXP_PROJECT_ID=your-project-id
OPTIMIZELY_DXP_CLIENT_KEY=your-client-key
OPTIMIZELY_DXP_CLIENT_SECRET=your-client-secret
```

> [!NOTE]
> These are not the CMS credentials (`OPTIMIZELY_CMS_CLIENT_ID` / `OPTIMIZELY_CMS_CLIENT_SECRET`)
> that `config push` uses. A project that deploys and pushes content types needs both sets.

> [!WARNING]
> `deploy` never uploads `.env` files, but keep `.env` out of version control anyway.

### Project requirements

`deploy` checks these before it uploads anything, and lists every problem it finds:

| Requirement | Why |
| --- | --- |
| `next` or `astro` is a dependency | Front-end hosting runs Next.js and Astro 5 or 7 |
| `package.json` has `build` and `start` scripts | The platform runs `build`, then `start` |
| Exactly one `package-lock.json` or `yarn.lock` | The platform installs with npm or yarn. pnpm is not supported |
| No `workspace:`, `link:` or `file:` dependencies | The platform cannot resolve them |

For a pnpm project, create an npm lock file next to `pnpm-lock.yaml`. `deploy` leaves
`pnpm-lock.yaml` out of the package:

```bash
npm install --package-lock-only
```

Declare a supported Node.js version. Astro needs 22.12.0 or later, and odd-numbered releases
are not supported:

```json
{
  "engines": { "node": "^22.12.0 || ^24.0.0" }
}
```

An Astro site must use server output with the Node adapter in standalone mode, and start the
server entry:

```json
{
  "scripts": {
    "build": "astro build",
    "start": "node ./dist/server/entry.mjs"
  }
}
```

The Next.js templates from [Create App](./14-create-app.md) meet every requirement, and have a
`deploy` script.

## Deploy

```bash
# Deploy to Test1
npx optimizely-cms-cli deploy --env Test1

# Deploy to Production. Asks for confirmation in a terminal; --yes skips it
npx optimizely-cms-cli deploy --env Production

# Stop when the deployment awaits verification, then check the site and
# complete or reset it in the DXP management portal
npx optimizely-cms-cli deploy --env Test1 --no-complete
```

The command shows each step, the deployment status, and any warnings or errors from the
platform. When it finishes, it prints the site URL. It exits with a non-zero code if any step
fails, so CI and coding agents can rely on it.

See [CLI Commands](./13-cli-commands.md#deploy) for every flag.

### What goes in the package

The package is named `<name>.head.app.<version>.zip`. The name is the `package.json` name
without its npm scope or special characters. The version is the `package.json` version plus a
UTC timestamp, for example `my-site.head.app.1.0.0-20261006120000.zip`, because the platform
rejects a second upload under the same name. `--name` and `--version` set them exactly.

The package contains the project source and the lock file. It leaves out `node_modules`,
`.next`, `dist`, `.astro`, `.git`, earlier packages, unsupported lock files, and `.env` files
other than `.env.example` and `.env.template`.

To check the package without deploying it:

```bash
npx optimizely-cms-cli deploy --output ./out
```

## After the first deploy

Connect the deployed site to the CMS:

1. Create the application, if it does not exist yet. Define it in `optimizely.config.mjs` and
   run `config push`, or create it in **Settings > Applications**.
2. Add the deployed hostname to the application. `deploy` does this for you when the CMS
   credentials (`OPTIMIZELY_CMS_CLIENT_ID` / `OPTIMIZELY_CMS_CLIENT_SECRET`) are set:
   - in a terminal, it asks which application to use and confirms before it changes anything;
   - in CI, it adds the hostname only when you pass `--application <key>`.

   Otherwise, add the hostname under **Hostnames** in **Settings > Applications**. A hostname
   that is already assigned is left as it is.
3. In **Settings > Scheduled jobs**, run the Optimizely Graph reindex job.

## Environment variables on the platform

Front-end hosting supplies these variables at build time and at runtime. You do not set them:

- `OPTIMIZELY_CMS_URL`
- `OPTIMIZELY_GRAPH_GATEWAY`
- `OPTIMIZELY_GRAPH_SINGLE_KEY`
- `OPTIMIZELY_GRAPH_APP_KEY`
- `OPTIMIZELY_GRAPH_SECRET`

The SDK samples and templates already read the first three by these names. Add other settings
and secrets in the **App Settings** tab of the DXP management portal.

## Deploy from GitHub Actions

Create App adds a workflow that deploys on each push to `main`:

```bash
npx @optimizely/cms-create-app my-site --template nextjs-stride --pm npm --ci github
```

For an existing project, copy
[`deploy-optimizely.yml`](../packages/optimizely-cms-create-app/templates/scaffold/github/deploy-optimizely.yml)
to `.github/workflows/`. Then add `OPTIMIZELY_DXP_PROJECT_ID`, `OPTIMIZELY_DXP_CLIENT_KEY` and
`OPTIMIZELY_DXP_CLIENT_SECRET` as repository secrets.

The workflow:

- deploys to `Test1` on a push to `main`;
- deploys to any environment when you run it from the **Actions** tab;
- never runs two deploys to the same environment at once;
- fails when the deployment fails.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `Front-end hosting credentials not provided` | Set the `OPTIMIZELY_DXP_*` variables the message names |
| `The front-end hosting credentials were rejected` | Check the client key and secret. Create a new API key if the secret is lost |
| `...have no access to this project or environment` | Create an API key with the target environment selected |
| `No package-lock.json or yarn.lock found` | Run `npm install --package-lock-only` |
| `Found package-lock.json and yarn.lock` | Delete the lock file of the package manager you do not use |
| `package.json has no "start" script` | Add the script from [Project requirements](#project-requirements) |
| `Dependency "..." uses "workspace:*"` | Replace it with a published version |
| `A package named ... was already uploaded` | Deploy again with a different `--version` |
| `Deployment ... failed` | Read the errors listed under the message. Application logs are in the **Troubleshoot** tab of the DXP management portal |
| `Deployment ... did not finish within 30 minutes` | The deployment may still be running. Check the portal, or raise `--timeout` |
| `The deployment succeeded, but the hostname was not added` | The site is live. Fix the cause in the message (CMS credentials, application key), then add the hostname in **Settings > Applications** or deploy again |
| `Failed to prepare container in repository 'frontend' on ACR` (in the portal) | The package has no lock file. Deploy with the CLI, which checks for one |

## Next steps

- [CLI Commands](./13-cli-commands.md) - Every command, flag and environment variable
- [Create App](./14-create-app.md) - Start a project that is ready to deploy
- [Live Preview](./7-live-preview.md) - Configure preview for the deployed site
