---
'@optimizely/cms-typegen': minor
'@optimizely/cms-cli': minor
---

`opti-typegen` writes `registry.ts` and `global.d.ts` to `.optimizely/` instead of `src/registry.ts` and `global.d.ts`,
with an `// @generated – do not edit` header. Add `.optimizely/` to `.gitignore`, delete the old generated files, and import
`initRegistry` from `.optimizely/registry`, which also loads `global.d.ts`.

`opti-typegen` also registers React components in `registry.ts`. A component is the default export of a file, matched to a content
type by: the content type defined in the same file, a tagged display template it imports (registered as `Key:tag`), a content type
it imports, or its file name. `typescript` is now a peer dependency.

`config push` rejects duplicate entries in `allowedTypes` and `restrictedTypes`.
