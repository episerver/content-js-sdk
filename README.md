# Optimizely CMS JavaScript tools

## Tech-stack

| Tool       | Category                 |
| :--------- | :----------------------- |
| pnpm       | Package manager          |
| Turborepo? | task runner              |
| changeset? | monorepo version manager |

### Other discussions

- TSConfig: Create a base for all packages
- ESM and CJS
- Formatter, at least in the samples

## CLI

Tooling:

- oclif: parses arguments and flags, creates examples...
- inquirer: for prompts

### Commands

```
login
config push
config pull
content-types delete-all
```

maybe in the future, expose the CLI commands as JS functions:

- When we see the need of using the commands programmatically
- Maybe as a _different_ SDK ("Management SDK"?)

## SDK

### Modelling

- `buildConfig` and `buildContentType`
- `/packages` endpoint
- We don't maintain TypeScript types for the JSON "manifest"
  - Because the SDK has its own "ContentType" types
  - Because the SDK does not own the manifest - ideally should be generated from the Open API spec

### Rendering

- React-specific?
- Next.js-specific?

### Content delivery (GraphQL)

- If we generate the queries (strings) ourselves, maybe `fetch` works instead of requiring any dependency

## Sample sites

- At least Next.js

---

## CI / CD

- Use whatever Optimizely is using in other repos
