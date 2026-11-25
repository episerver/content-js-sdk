---
'@optimizely/cms-codegen': minor
'@optimizely/cms-cli': minor
'@optimizely/cms-sdk': minor
---

`opti-codegen` writes `registry.ts` to `src/` (`app/` if there is no `src/`, else the project root) and `global.d.ts` to the project root,
with an `// @generated – do not edit` header. Commit both files.

`opti-codegen` also registers React components in `registry.ts`. A component is the default export of a file, matched to a content
type by: the content type defined in the same file, a tagged display template it imports (registered as `Key:tag`), a content type
it imports, or its file name. `typescript` is now a peer dependency. `opti-codegen --check` exits 1 when the generated files are out of date, and typegen stops without writing anything when `optimizely.config.mjs` is missing. `opti-dev` generates once before starting the dev server.

`config push` rejects duplicate entries in `allowedTypes` and `restrictedTypes`.

`@optimizely/cms-sdk` exports `ContentTypeRegistry`, `PropertyGroupRegistry`, `MayContainRegistry` and `MayContainKey`, which the generated `global.d.ts` fills so content type keys autocomplete.
