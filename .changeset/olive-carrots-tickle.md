---
'@optimizely/cms-sdk': minor
---

Hardened the Optimizely Forms support ahead of release.

`initForms` now keeps its components in a registry of its own rather than merging them into the application's. It can be called before or after `initReactComponentRegistry` and `initContentTypeRegistry`, works with a resolver function as well as a component map, and no longer registers duplicate content types when the entry point re-runs on a hot reload. Previously, a resolver function caused every application component to stop resolving.

Detecting whether Forms is enabled is now resolved once per `GraphClient` instead of on every page render. The deeper composition nesting that Forms needs is applied only when Forms is enabled, so sites without it get the shorter queries back.

Query generation now separates settings that are fixed for a whole query — DAM, Forms, contract expansion, the fragment threshold and the type filter — from the per-fragment options. They were previously re-listed by hand at each level of the recursion, and anything an author forgot was silently replaced by a default. As a result, an array of contract-typed content ignored both `expandContracts` and `typeFilter`; both are now honoured.

Renamed `FormStatusProvider` / `useFormStatus` to `FormSubmissionProvider` / `useFormSubmission`, to stop the hook shadowing react-dom's hook of the same name and different meaning.
