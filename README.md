# Optimizely CMS JavaScript tools

## Tooling

- NPM vs YARN vs PNPM?
- Monorepos: Maybe Turborepo? pnpm? Lerna?
- TSConfig: Create a base for all packages
- ESM and CJS

## CLI

- oclif and inquirer

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

---

## CI / CD

- Use whatever Optimizely is using in other repos
