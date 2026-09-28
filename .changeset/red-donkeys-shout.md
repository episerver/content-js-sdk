---
'@optimizely/cms-sdk': patch
---

Fix `MODULE_NOT_FOUND: Cannot find package 'react'` when using the SDK without React installed.

The root entry (`@optimizely/cms-sdk`) re-exported `initForms` from `./react/server.js`, which pulled React into the import graph of every consumer. Because React is an optional peer dependency, any install without it — most visibly `npx @optimizely/cms-cli`, where every command failed to load — crashed on import.

`initForms` is unchanged and still exported from `@optimizely/cms-sdk/react/server`, which is where the templates and documentation have always imported it from. React-dependent APIs remain available through the `./react/*` subpath exports.
