# CLI

`@optimizely/cms-cli` uploads the content types you define in code to Optimizely CMS,
pulls existing ones down as TypeScript, deletes them, and deploys your site to Optimizely
front-end hosting.

```sh
optimizely-cms-cli <command> [arguments] [flags]
```

| Command                                                               | What it does                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| [`login`](#login)                                                     | Checks the credentials in your environment               |
| [`config push`](#config-push)                                         | Pushes content types from your config file to the CMS    |
| [`config pull`](#config-pull)                                         | Generates TypeScript files, or JSON, from the CMS        |
| [`config delete`](#config-delete)                                     | Deletes the content types defined in your config file    |
| [`content delete`](#content-delete)                                   | Deletes one content type                                 |
| [`danger delete-all-content-types`](#danger-delete-all-content-types) | Deletes every user-defined content type in the CMS       |
| [`deploy`](#deploy)                                                   | Packages the project and deploys it to front-end hosting |

## Running the CLI

Run the latest version without installing it:

```sh
npx @optimizely/cms-cli@latest <command>
```

Or install it as a dev dependency, so that everyone on the project uses the same version:

```sh
npm install -D @optimizely/cms-cli
npx optimizely-cms-cli <command>
```

Or install it globally:

```sh
npm install -g @optimizely/cms-cli
optimizely-cms-cli <command>
```

Run without a command, or with `--help`, the CLI lists its commands.

## Environment variables

The CLI loads `.env` from the directory you run it in, so run it from your project root.
Variables already set in your shell take precedence over `.env`.

| Variable                       | Required | Description                                                                                    |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `OPTIMIZELY_CMS_CLIENT_ID`     | Yes      | The client ID of an API key, from **Settings → API Keys** in the CMS                           |
| `OPTIMIZELY_CMS_CLIENT_SECRET` | Yes      | The client secret of the same API key                                                          |
| `OPTIMIZELY_CMS_API_URL`       | No       | The CMS API to call. Defaults to `https://api.cms.optimizely.com`. `--host` overrides it       |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No       | Set to `0` to accept self-signed certificates, for a local CMS only. This is a Node.js setting |

```ini
OPTIMIZELY_CMS_CLIENT_ID=<your client id>
OPTIMIZELY_CMS_CLIENT_SECRET=<your client secret>
```

The CLI treats a URL of the form `https://api.cms.optimizely.com` or
`https://api.cmstest.optimizely.com` as the API gateway. It treats any other URL as a CMS
instance and calls `<url>/_cms/v1`.

`deploy` uses its own credentials instead, created in the **API** tab of the DXP
management portal:

| Variable                       | Required     | Description                            |
| ------------------------------ | ------------ | -------------------------------------- |
| `OPTIMIZELY_DXP_PROJECT_ID`    | For `deploy` | The front-end hosting project ID       |
| `OPTIMIZELY_DXP_CLIENT_KEY`    | For `deploy` | The client key of a Deployment API key |
| `OPTIMIZELY_DXP_CLIENT_SECRET` | For `deploy` | The client secret of the same key      |

> [!NOTE]
>
> The CLI doesn't read `OPTIMIZELY_CMS_URL`. That variable belongs to your app, which uses
> it to load the live preview script. See [Live preview](../learn/live-preview.md).

## Global flags

| Flag           | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `--host <url>` | The CMS to call, including the scheme. Accepted by every command except `deploy` |
| `--help`       | Shows help for the CLI, a topic (`config`) or a command (`config push`)          |
| `--version`    | Prints the CLI version. Use it without a command: `optimizely-cms-cli --version` |

The CMS URL is resolved in this order: `--host`, then `OPTIMIZELY_CMS_API_URL`, then
`https://api.cms.optimizely.com`. A trailing slash is removed.

## `login`

Checks that `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET` are set and that
the CMS accepts them.

```sh
optimizely-cms-cli login [--verbose] [--host <url>]
```

### Reference

#### Flags

| Flag           | Default | Description                                                 |
| -------------- | ------- | ----------------------------------------------------------- |
| `--verbose`    | `false` | Also prints the client ID, and the error details on failure |
| `--host <url>` |         | The CMS to authenticate against                             |

#### Output

On success the CLI prints `Your credentials are correct`. On failure it prints
`Authentication failed`, followed by the reason, and exits with code `1`.

### Usage

#### Checking your credentials

```sh
optimizely-cms-cli login
```

```text
✔ Your credentials are correct
```

#### Checking credentials against another instance

```sh
optimizely-cms-cli login --host https://api.cmstest.optimizely.com --verbose
```

## `config push`

Pushes the content types, contracts, display templates and property groups found through
your config file to the CMS. It also creates the locales, content and applications the
config file declares.

```sh
optimizely-cms-cli config push [file] [--dryRun] [--output <path>] [--force] [--only <keys>] [--host <url>]
```

### Reference

#### Arguments

- `file` (optional) — the path to the config file. Defaults to `./optimizely.config.mjs`.
  See [`optimizely.config.mjs`](./optimizely-config.md) for what the file contains.

#### Flags

| Flag              | Default | Description                                                                       |
| ----------------- | ------- | --------------------------------------------------------------------------------- |
| `--dryRun`        | `false` | Builds and validates the manifest, then stops without uploading it                |
| `--output <path>` |         | Writes the manifest JSON to this file before uploading it                         |
| `--force`         | `false` | Applies changes the CMS would otherwise reject because they can lose data         |
| `--only <keys>`   |         | Comma-separated keys of the content types, contracts or display templates to push |
| `--host <url>`    |         | The CMS to push to                                                                |

The flag is `--dryRun`, in camel case. `--dry-run` isn't recognised.

#### What gets validated

Before anything is uploaded, the CLI checks every `content` and `contentReference`
property, including array items, in every content type. Each one must declare exactly one
form of type constraint:

- `contentType`, on a `contentReference` property only, or
- a non-empty `allowedTypes` or `restrictedTypes`.

Any property that breaks this rule stops the command with exit code `1`, and nothing is
pushed:

```text
Invalid content type configuration (1 issue found):
  ✖ Content type "LandingPage", property "mainContent" (content): missing type constraints. Declare "allowedTypes"/"restrictedTypes", to define which content types are permitted.

  Resolve the issues above and run the command again. Nothing was pushed to the CMS.
```

| Problem                     | Reported as                    |
| --------------------------- | ------------------------------ |
| No constraint at all        | `missing type constraints`     |
| An empty list, such as `[]` | `empty type constraints`       |
| `contentType` and a list    | `conflicting type constraints` |
| `contentType` on `content`  | `unsupported type constraint`  |

See [Content types](../guides/content-types.md) for how to choose a constraint.

#### Caveats

- **`config push` never deletes anything.** The CMS adds and updates the types you push,
  and leaves every other type alone. To remove a type, use
  [`content delete`](#content-delete) or [`config delete`](#config-delete).
- **`--dryRun` still signs in.** It requests an access token from the CMS before it stops,
  so it needs valid credentials. It never uploads the manifest.
- **`--force` can lose data.** Without it, the CMS rejects changes such as removing a
  property or changing its type, and the CLI suggests `--force` in the error.
- **A scoped push (`--only`) skips locales, content and applications.** These are global,
  so only a full push changes them.

### Usage

#### Pushing the default config file

```sh
optimizely-cms-cli config push
```

#### Pushing a different config file

```sh
optimizely-cms-cli config push ./config/optimizely.staging.mjs
```

#### Checking the manifest without uploading it

```sh
optimizely-cms-cli config push --dryRun --output ./manifest.json
```

This also lists every constraint error, so it is a quick way to check a content model
before you push.

#### Pushing only some types

`--only` limits the push to the keys you list:

```sh
optimizely-cms-cli config push --only Hero,LandingPage
```

The manifest then contains:

- the content types and contracts with those keys
- the display templates whose own key is listed, or whose content type is listed
- the property groups those content types use

A display template for a base type or a row or column is included only when you list its
own key. Types you leave out are not changed.

The CLI still reads and validates the whole config. An unknown key stops the command
before anything is sent:

```text
Unknown keys in --only: Heor
Use the keys of content types, contracts or display templates, separated by commas.
```

#### Applying a breaking change to one type

Combine `--only` with `--force` to limit a data-losing update to the type you changed:

```sh
optimizely-cms-cli config push --only Hero --force
```

## `config pull`

Downloads the content types and display templates from the CMS and generates TypeScript
files for them, or prints them as JSON.

```sh
optimizely-cms-cli config pull [--output <path>] [--group | --individual | --single-file | --json] [--includeReadOnly] [--host <url>]
```

### Reference

#### Flags

| Flag                | Short | Default               | Description                                                    |
| ------------------- | ----- | --------------------- | -------------------------------------------------------------- |
| `--output <path>`   | `-o`  | `./src/content-types` | The output directory, or a file path ending in `.ts` or `.tsx` |
| `--group`           | `-g`  | `false`               | Writes one file per type, in a folder per base type            |
| `--individual`      | `-i`  | `false`               | Writes one file per type, all in the output directory          |
| `--single-file`     | `-s`  | `false`               | Writes every type to one file, `manifest.ts`                   |
| `--json`            | `-j`  | `false`               | Prints the manifest as JSON to stdout instead of writing files |
| `--includeReadOnly` | `-r`  | `false`               | Also pulls read-only types. `--include-read-only` works too    |
| `--host <url>`      |       |                       | The CMS to pull from                                           |

`--group`, `--individual`, `--single-file` and `--json` exclude each other. `--json` can't
be combined with `--output`.

#### Interactive and non-interactive mode

What `config pull` does depends on whether stdin and stdout are both a terminal:

- **In a terminal**, it asks for anything the flags leave open: the output directory, how
  to organise the files, and whether to generate a `registry.ts` file (optionally with a
  `config()` call).
- **When either is not a terminal**, such as in CI or when you pipe or redirect input or
  output, it never prompts:
  - With none of `--output`, `--group`, `--individual` or `--single-file`, it prints JSON
    to stdout, as if you passed `--json`. Progress messages go to stderr.
  - With any of them, it writes the files. The output directory defaults to
    `./src/content-types` and the layout to `--group`.

#### Output layout

With `--group` (the default choice in the prompt), each content type goes in a folder
named after its base type without the underscore. Contracts go in `contract/` and display
templates in `displayTemplates/`:

```text
src/content-types/
├── page/
│   └── ArticlePage.ts
├── component/
│   └── HeroComponent.ts
├── contract/
│   └── SeoContract.ts
└── displayTemplates/
    └── HeroDisplayTemplate.ts
```

With `--individual`, the same files sit side by side in the output directory. With
`--single-file`, or an `--output` path ending in `.ts` or `.tsx`, everything goes in one
file: `manifest.ts`, or the file name you gave.

#### Caveats

- **The generated files leave out the built-in `BlankExperience` and `BlankSection`
  types.** The JSON output includes them.
- **Read-only types can't be changed through the CLI.** `--includeReadOnly` is useful to
  generate types for content types managed elsewhere, such as from .NET code on a PaaS
  instance, or by another system.
- **The registry prompt has no flag.** Outside a terminal, no `registry.ts` is generated.

### Usage

#### Pulling interactively

```sh
optimizely-cms-cli config pull
```

#### Pulling into folders per base type

```sh
optimizely-cms-cli config pull --output ./src/content-types --group
```

#### Pulling into one file with your own name

```sh
optimizely-cms-cli config pull --output ./src/content-types/all-content-types.ts
```

#### Saving or processing the JSON manifest

```sh
optimizely-cms-cli config pull --json > manifest.json
optimizely-cms-cli config pull --json | jq .contentTypes
```

#### Including read-only types

```sh
optimizely-cms-cli config pull --includeReadOnly
```

## `config delete`

Deletes from the CMS the content types defined in your project, after one confirmation.
Use it to undo a push.

```sh
optimizely-cms-cli config delete [file] [--host <url>]
```

### Reference

#### Arguments

- `file` (optional) — the path to the config file. Defaults to `./optimizely.config.mjs`.

#### Flags

| Flag           | Description            |
| -------------- | ---------------------- |
| `--host <url>` | The CMS to delete from |

#### Caveats

- **Only content types are deleted.** Contracts and display templates defined in the
  project stay in the CMS.
- **A type that has content can't be deleted.** The CLI reports it and moves on to the
  next type. Delete the content in the CMS first, then run the command again.
- **There is no flag to skip the confirmation.** The command needs an interactive
  terminal.

### Usage

#### Deleting the project's content types

```sh
optimizely-cms-cli config delete
```

The CLI lists the project types it found in the CMS, and the ones it didn't, then asks
before it deletes anything. It ends with a count of the types it deleted and the ones it
couldn't.

## `content delete`

Deletes one content type from the CMS, after a confirmation.

```sh
optimizely-cms-cli content delete <key> [--host <url>]
```

### Reference

#### Arguments

- `key` (required) — the key of the content type to delete, such as `Article`.

#### Flags

| Flag           | Description            |
| -------------- | ---------------------- |
| `--host <url>` | The CMS to delete from |

#### Caveats

- **A type that has content can't be deleted.** The CLI prints
  `Cannot delete: Content type is in use`. Delete the content first.
- **An unknown key fails** with `Content type "<key>" not found`.

### Usage

#### Deleting a content type

```sh
optimizely-cms-cli content delete Article
```

## `danger delete-all-content-types`

Deletes every user-defined content type in the CMS, including types that are not in your
project. Built-in and system types are kept.

```sh
optimizely-cms-cli danger delete-all-content-types [--host <url>]
```

### Reference

#### Flags

| Flag           | Description            |
| -------------- | ---------------------- |
| `--host <url>` | The CMS to delete from |

#### Caveats

- **It asks twice.** The second prompt follows the list of types it is about to delete.
- **A type that has content can't be deleted.** The CLI reports it and continues with the
  rest.

> [!CAUTION]
>
> This removes content types created by anyone, from any project that shares the CMS
> instance, and can't be undone. To remove only your own project's types, use
> [`config delete`](#config-delete).

### Usage

#### Resetting a development instance

```sh
optimizely-cms-cli danger delete-all-content-types --host https://api.cmstest.optimizely.com
```

## `deploy`

Packages a Next.js or Astro project, uploads it to Optimizely front-end hosting, starts
the deployment, waits for it, completes it and prints the site URL.

```sh
optimizely-cms-cli deploy --env <name> [flags]
```

### Reference

#### Flags

| Flag                  | Short | Default                                        | Description                                                                                                                |
| --------------------- | ----- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--env <name>`        | `-e`  |                                                | The environment as named in the DXP management portal, such as `Test1` or `Production1`. Required unless `--output` is set |
| `--dir <path>`        |       | `.`                                            | The project directory                                                                                                      |
| `--output <path>`     | `-o`  |                                                | Write the package to this directory instead of deploying it                                                                |
| `--name <name>`       |       | The `package.json` name                        | The package name                                                                                                           |
| `--version <version>` |       | The `package.json` version and a UTC timestamp | The exact package version                                                                                                  |
| `--no-complete`       |       |                                                | Stop when the deployment awaits verification                                                                               |
| `--yes`               | `-y`  |                                                | Skip the confirmation prompt for Production environments                                                                   |
| `--timeout <minutes>` |       | `30`                                           | How long to wait for each deployment stage                                                                                 |

#### Caveats

- **It uses the DXP Deployment API, not the CMS.** It needs the `OPTIMIZELY_DXP_*`
  variables, and `--host` doesn't apply.
- **It checks the project before uploading.** It needs `next` or `astro` as a dependency,
  `build` and `start` scripts, and exactly one `package-lock.json` or `yarn.lock`.

### Usage

#### Deploying to a test environment

```sh
optimizely-cms-cli deploy --env Test1
```

#### Deploying to production from CI

```sh
optimizely-cms-cli deploy --env Production1 --yes
```

#### Checking the package without deploying it

```sh
optimizely-cms-cli deploy --output ./out
```

See [Deploy to front-end hosting](../guides/deploy-to-frontend-hosting.md) for the project
requirements, what goes in the package, and a GitHub Actions workflow.

## Troubleshooting

See [Troubleshooting: CLI and `config push`](./troubleshooting.md#cli-and-config-push) for
the errors the CLI prints and how to fix them.
