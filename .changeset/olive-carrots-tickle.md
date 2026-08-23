---
'@optimizely/cms-sdk': minor
---

Hardened the Optimizely Forms support ahead of release.

`initForms` now keeps its components in a registry of its own rather than merging them into the application's. It can be called before or after `initReactComponentRegistry` and `initContentTypeRegistry`, works with a resolver function as well as a component map, and no longer registers duplicate content types when the entry point re-runs on a hot reload. Previously, a resolver function caused every application component to stop resolving.

Detecting whether Forms is enabled is now resolved once per Graph endpoint for the lifetime of the process, instead of on every page render. It is cached at module scope rather than on the client, because `getClient()` returns a new client per call and frameworks call it once per request.
