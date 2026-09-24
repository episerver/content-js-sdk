# @optimizely/cms-cli

## 3.0.0

### Major Changes

- 61e921a: [CMS-54832](https://optimizely-ext.atlassian.net/browse/CMS-54832): Add
  validations and type restrictions for properties with content and contentReference

  `optimizely-cms-cli config push` now stops before uploading when a `content` or
  `contentReference` property (or array item) is misconfigured:
  - Missing constraints — declare `contentType`, or `allowedTypes`/`restrictedTypes`.
  - Empty `allowedTypes`/`restrictedTypes` — list at least one content type, or remove the
    field.
  - `contentType` combined with `allowedTypes`/`restrictedTypes` — declare only one of
    them.

  **Breaking change:** these were warnings before, so a content model that pushed cleanly
  on the previous version can now be rejected outright. Unconstrained properties make the
  SDK generate nested GraphQL fragments for every registered content type.

  ```ts
  // Rejected
  properties: {
    mainContent: { type: 'content' },                    // missing type constraints
    gallery: { type: 'content', allowedTypes: [] },      // empty type constraints
    hero: { type: 'contentReference', contentType: ImageCT, allowedTypes: [ImageCT] },
  }

  // Accepted
  properties: {
    mainContent: { type: 'content', allowedTypes: [TeaserCT] },
    gallery: { type: 'content', restrictedTypes: [FolderCT] },
    hero: { type: 'contentReference', contentType: ImageCT },
  }
  ```

  **Migrating:** give every existing `content` and `contentReference` property a
  `contentType` or a non-empty `allowedTypes`/`restrictedTypes` before upgrading. Narrower
  constraints mean smaller queries and faster responses. See
  [Content Relationships](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#migrating-existing-content-types)
  for examples.

### Minor Changes

- e7d2908: [CMS-55078](https://optimizely-ext.atlassian.net/browse/CMS-55078): Add
  `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property
  from the editing interface. Defaults to `'available'` when not set.
  `optimizely-cms-cli config pull` keeps `displayMode: 'hidden'` in generated content
  types and omits the `'available'` default.
- 27426f2: [CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Add
  `optimizely-cms-cli config delete`

  Deletes from the CMS only the content types declared in your project configuration,
  after a confirmation prompt — unlike `danger delete-all-content-types`, which removes
  every user-defined type.

  ```sh
  optimizely-cms-cli config delete             # ./optimizely.config.mjs
  optimizely-cms-cli config delete ./custom-config.mjs
  ```

- f79e569: [CMS-55061](https://optimizely-ext.atlassian.net/browse/CMS-55061):
  `config pull` can now generate a `registry.ts` file that registers every pulled content
  type and display template via `initContentTypeRegistry()` /
  `initDisplayTemplateRegistry()`, optionally including a `config({ apiKey })` call.

### Patch Changes

- 14f46bc: [CMS-54769](https://optimizely-ext.atlassian.net/browse/CMS-54769): Handle the
  `'*'` wildcard in `allowedTypes`

  `allowedTypes: ['*']` means "any content type". Queries treated `'*'` as a content type
  key and resolved nothing; `optimizely-cms-cli config push` sent it to the CMS, which
  rejects it. The wildcard now expands to every registered type when querying and is
  stripped when pushing.

- b751309: [CMS-54548](https://optimizely-ext.atlassian.net/browse/CMS-54548): Always
  write `allowedTypes` and `restrictedTypes` on `config pull`

  Empty constraint lists were dropped from the generated content types, so a pull followed
  by a push turned a property that allowed nothing into one that allows everything.

- 75cb2be: [CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Improve
  detection of deletable types for `danger delete-all-content-types`

  Only types with no `source` are user-defined and deletable. The command used to skip
  just `system` and `serverModel`, so it attempted types owned by other sources and failed
  on them.

- 8877d5c: [CMS-55749](https://optimizely-ext.atlassian.net/browse/CMS-55749): Fix
  `components` glob exclusions and precedence

  `!dir` now excludes nested files, not only the ones directly inside it. When two
  patterns match content types with the same key, the one listed first in `components`
  wins — results used to be sorted by path, so the winner was arbitrary.

- 16f90e1: [CMS-56470](https://optimizely-ext.atlassian.net/browse/CMS-56470): Register
  contracts alongside the content types that extend them

  Rendering a page whose content area accepted a content type implementing a contract
  threw `Content type "<name>Contract" is not available in the component registry`,
  because query generation looks a contract fragment up by key but nothing ever put the
  contract in the registry.
  - `initContentTypeRegistry()` now also registers any contract reached through a
    registered type's `extends`, so existing applications need no change.
  - `optimizely-cms-cli config pull` now includes contracts in the generated
    `registry.ts`, which also covers contracts used only in
    `allowedTypes`/`restrictedTypes`.

- Updated dependencies [61e921a]
- Updated dependencies [e7d2908]
- Updated dependencies [14f46bc]
- Updated dependencies [6c3cd3a]
- Updated dependencies [00037d9]
- Updated dependencies [54977f8]
- Updated dependencies [79dae6d]
- Updated dependencies [d392b21]
- Updated dependencies [67f52fa]
- Updated dependencies [aba0462]
- Updated dependencies [988568e]
- Updated dependencies [d392b21]
- Updated dependencies [36b4c1a]
- Updated dependencies [d58d272]
- Updated dependencies [a8dc922]
- Updated dependencies [54ab0e9]
- Updated dependencies [0333f2f]
- Updated dependencies [16f90e1]
- Updated dependencies [7cc4a94]
- Updated dependencies [40f3f23]
  - @optimizely/cms-sdk@3.0.0

## 3.0.0-beta.0

### Major Changes

- 61e921a: [CMS-54832](https://optimizely-ext.atlassian.net/browse/CMS-54832): Add
  validations and type restrictions for properties with content and contentReference

  `opti-cms config push` now stops before uploading when a `content` or `contentReference`
  property (or array item) is misconfigured:
  - Missing constraints — declare `contentType`, or `allowedTypes`/`restrictedTypes`.
  - Empty `allowedTypes`/`restrictedTypes` — list at least one content type, or remove the
    field.
  - `contentType` combined with `allowedTypes`/`restrictedTypes` — declare only one of
    them.

  Previously unconstrained properties were only a warning; they make the SDK generate
  nested GraphQL fragments for every content type.

  **Migrating:** give every existing `content` and `contentReference` property a
  `contentType` or a non-empty `allowedTypes`/`restrictedTypes` before upgrading. Narrower
  constraints mean smaller queries and faster responses. See
  [Content Relationships](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#migrating-existing-content-types)
  for examples.

### Minor Changes

- e7d2908: [CMS-55078](https://optimizely-ext.atlassian.net/browse/CMS-55078): Add
  `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property
  from the editing interface. Defaults to `'available'` when not set.
  `opti-cms config pull` keeps `displayMode: 'hidden'` in generated content types and
  omits the `'available'` default.
- 27426f2: [CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Add config
  delete command
- f79e569: [CMS-55061](https://optimizely-ext.atlassian.net/browse/CMS-55061):
  `config pull` can now generate a `registry.ts` file that registers every pulled content
  type and display template via `initContentTypeRegistry()` /
  `initDisplayTemplateRegistry()`, optionally including a `config({ apiKey })` call.

### Patch Changes

- b751309: [CMS-54548](https://optimizely-ext.atlassian.net/browse/CMS-54548): Always
  write allowedTypes and restrictedTypes when using config pull
- 75cb2be: [CMS-54768](https://optimizely-ext.atlassian.net/browse/CMS-54768): Improve
  detection of deletable types for delete-all-content-types
- 8877d5c: Fix components glob exclusions and precedence: !dir now excludes nested files,
  and pattern order determines which content type wins on key conflicts
- Updated dependencies [61e921a]
- Updated dependencies [e7d2908]
- Updated dependencies [14f46bc]
- Updated dependencies [6c3cd3a]
- Updated dependencies [00037d9]
- Updated dependencies [54977f8]
- Updated dependencies [79dae6d]
- Updated dependencies [67f52fa]
- Updated dependencies [aba0462]
- Updated dependencies [988568e]
- Updated dependencies [36b4c1a]
- Updated dependencies [d58d272]
- Updated dependencies [a8dc922]
- Updated dependencies [54ab0e9]
- Updated dependencies [0333f2f]
- Updated dependencies [7cc4a94]
- Updated dependencies [40f3f23]
  - @optimizely/cms-sdk@3.0.0-beta.0

## 2.2.0

### Minor Changes

- b87c027: Fix duplicate entry point content creation and application update detection
- c184559: Add support for language/locale in build config

### Patch Changes

- Updated dependencies [53775b0]
- Updated dependencies [b15e199]
- Updated dependencies [c662175]
- Updated dependencies [c184559]
- Updated dependencies [10a19be]
  - @optimizely/cms-sdk@2.2.0

## 2.1.0

### Minor Changes

- 2a7e43b: ## @optimizely/cms-sdk

  ### Major Features
  - **Contracts**: Add support for content type contracts with allowed/restricted types,
    fragment generation, and component fallback mechanism (CMS-46677, #292,
    @marin-karamihalev)
  - **Applications**: Add application type definitions and validation (CMS-51342, #333,
    @TRomesh)
  - **NextPreviewComponent**: Add Next.js-specific preview component with optimized
    content saved webhook handling and soft refresh (CMS-52407, #319, @TRomesh)
  - **OpenTelemetry**: Add observability with tracing and metrics support (CMS-50199,
    #309, @marin-karamihalev)

  ### Features
  - Add all base type properties to GraphQL queries for improved data access (CMS-41847,
    #392, @GiangNT95)
  - Add optional locale support to ContentType and RICHTEXT_PRESET type (CMS-53704, #400,
    @TRomesh)
  - Add section fragment handling for OptimizelyComposition components (CMS-53436,
    #388-389, @marin-karamihalev)
  - Add expandContracts boolean flag replacing maxContractExpansionLimit (CMS-52890, #349,
    @marin-karamihalev)
  - Refactor createQuery for improved maintainability (CMS-52411, #320,
    @marin-karamihalev)
  - Refactor utils for better code organization (CMS-53352, #366, @marin-karamihalev)

  ### Fixes
  - Fix contentType circular reference handling by allowing string type (CMS-53737, #409,
    @marin-karamihalev)
  - Fix preview attributes handling in OptimizelyComposition and OptimizelyGridSection
    (CMS-53437, #393, @TRomesh)
  - Fix DAM asset fragment resolution in compositions (CMS-52404, #318,
    @marin-karamihalev)
  - Fix element focus in preview mode (CMS-52749, #346, @TRomesh)
  - Fix display template for top-level experience content (CMS-52750, #335, @GiangNT95)
  - Add type re-exports for proper declaration file generation (CMS-53656, #405, @TRomesh)
  - Fix getContent() to return published version instead of draft as documented
    (CMS-52026, #307, @GiangNT95)
  - Fix getContentByPath() 404 when page has simple address set (CMS-52209, #312,
    @GiangNT95)
  - Fix component registry fallback for types ending with "Property" (CMS-51995, #304,
    @TRomesh)
  - Allow empty contracts in configuration (CMS-52849, #342, @marin-karamihalev)
  - Fix RichText inconsistent HTML entity decoding (CMS-53226, #353, @TRomesh)

  ### Documentation
  - Update v2.1.0 documentation for clarity and completeness (CMS-53655, #404, @TRomesh)
  - Add expandContracts documentation (CMS-53826, #411, @marin-karamihalev)
  - Add OTEL conditional span documentation (CMS-53327, #408, @marin-karamihalev)
  - Fix documentation examples for getContent() key and version formats (CMS-52020, #306,
    @GiangNT95)

  ## @optimizely/cms-cli

  ### Major Features
  - **Contracts**: Add contract generation and validation support (CMS-46677, #292,
    @marin-karamihalev)
  - **Applications**: Add programmatic application creation and management with
    `createApplication`, `updateApplication`, `checkApplications` (CMS-51342, #333,
    @TRomesh)
  - **create-opti-app**: New command to scaffold project templates including Stride,
    Alloy, and TanStack starters (CMS-49618, #382, @GiangNT95)
  - **Single File Mode**: Add single-file output mode for pull command (CMS-52422, #326,
    @marin-karamihalev)

  ### Features
  - Add support for circular and self-referenced content types in code generation
    (CMS-44353, #305, @GiangNT95)
  - Add editor settings support for RichText properties (CMS-52547, #348, @TRomesh)
  - Add self-signed certificate support (CMS-52494, #322, @JohanPetersson)
  - Refactor pull command with functional patterns and enhanced spinner messages
    (CMS-51981, #303, @marin-karamihalev)
  - Stride templates and refactoring (CMS-53473, #375-391, @JohanPetersson)

  ### Fixes
  - Fix duplicate applications handling by filtering missing app entryPoints (CMS-53768,
    #403, @TRomesh)
  - Skip unnecessary prompts when single file mode is enforced (CMS-53832, #412,
    @marin-karamihalev)
  - Fix preview URL issue with inProcessWebsite (CMS-53120, #351, @TRomesh)
  - Fix same entry point handling in multiple applications (CMS-53109, #350, @TRomesh)

### Patch Changes

- Updated dependencies [2a7e43b]
  - @optimizely/cms-sdk@2.1.0

## 2.1.0-beta.0

### Minor Changes

- 2a7e43b: Cumulative release: Includes all new features, bug fixes, and performance
  improvements merged since v2.0.0

### Patch Changes

- Updated dependencies [2a7e43b]
  - @optimizely/cms-sdk@2.1.0-beta.0
