# @optimizely/cms-sdk

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

- 36b4c1a: [CMS-55301](https://optimizely-ext.atlassian.net/browse/CMS-55301): Remove the
  `'standard'` Rich Text editor preset

  **Breaking change:** `'standard'` was never a preset the CMS understood, so
  `RICHTEXT_PRESET` is now `'default' | 'expanded' | 'minimal'`. Content types that ask
  for it stop type-checking.

  ```ts
  // Before
  summary: { type: 'richText', editorSettings: { preset: 'standard' } }

  // After
  summary: { type: 'richText', editorSettings: { preset: 'default' } }
  ```

  **Migrating:** replace `preset: 'standard'` with `'default'`. See
  [RichText Property](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#richtext-property).

- d58d272: [CMS-55780](https://optimizely-ext.atlassian.net/browse/CMS-55780): Rich Text
  properties now default to `json` only

  **Breaking change:** queries used to select both `html` and `json` for every Rich Text
  property. They now select `json` alone, so `html` comes back `undefined` and any
  component rendering the raw HTML string (e.g. through `dangerouslySetInnerHTML`) renders
  nothing. Queries and responses shrink for everyone else.

  ```ts
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    fragment: {
      richTextFormat: 'html', // or 'both' to keep the old payload
    },
  });
  ```

  Applications rendering Rich Text with the SDK's `<RichText>` component need no change —
  it reads the `json` representation. See
  [RichText Property](https://github.com/episerver/content-js-sdk/blob/main/docs/3-modelling.md#richtext-property).

- 54ab0e9: [CMS-56023](https://optimizely-ext.atlassian.net/browse/CMS-56023): config()
  options regrouped into fragment and query

  **Breaking change:** options that used to sit flat on `config()` now live in one of two
  groups, so any call still passing them at the top level silently loses them. `fragment`
  holds the settings that shape the generated GraphQL query and are fixed for the client's
  lifetime; `query` holds the per-request defaults you can still override on a single
  call.

  ```ts
  // Before
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    richTextFormat: 'json',
    compositionDepth: 4,
    expandContracts: true,
    maxFragmentThreshold: 100,
    dam: 'automatic',
    cache: true,
    slot: 'Current',
    host: process.env.APPLICATION_HOST,
  });

  // After
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    fragment: {
      richTextFormat: 'json',
      compositionDepth: 4,
      expandContracts: true,
      maxThreshold: 100, // renamed from maxFragmentThreshold
      dam: 'automatic',
    },
    query: {
      cache: true,
      slot: 'Current',
      host: process.env.APPLICATION_HOST,
    },
  });
  ```

  `typeFilter` moves into `fragment` too. TypeScript flags anything left at the top level.

  `dam` is no longer accepted on individual requests — it shapes the generated query, so
  it is fixed for the lifetime of a client. `cache`, `stored`, `slot` and `host` are still
  per-request overrides. See
  [config() Parameters](https://github.com/episerver/content-js-sdk/blob/main/docs/5-fetching.md#config-parameters).

### Minor Changes

- e7d2908: [CMS-55078](https://optimizely-ext.atlassian.net/browse/CMS-55078): Add
  `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property
  from the editing interface. Defaults to `'available'` when not set.
  `optimizely-cms-cli config pull` keeps `displayMode: 'hidden'` in generated content
  types and omits the `'available'` default.
- 6c3cd3a: [CMS-54015](https://optimizely-ext.atlassian.net/browse/CMS-54015): Added forms
  support to the sdk (query metadata, forms content types)
- 54977f8: [CMS-55015](https://optimizely-ext.atlassian.net/browse/CMS-55015):
  Configurable composition depth

  Experience queries fetched a fixed number of composition levels.
  `fragment.compositionDepth` sets how many to fetch — raise it for deeply nested
  compositions, lower it for smaller queries.

  ```ts
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    fragment: {
      compositionDepth: 6, // default 4
    },
  });
  ```

  See
  [config() Parameters](https://github.com/episerver/content-js-sdk/blob/main/docs/5-fetching.md#config-parameters).

- 79dae6d: [CMS-54818](https://optimizely-ext.atlassian.net/browse/CMS-54818): Fix slow
  and dropped preview updates in `PreviewComponent` and `NextPreviewComponent`

  A single save in the CMS emits a burst of events (the page plus each nested block). The
  debounce that coalesced them was re-created on every render, so pending refreshes were
  cancelled and edits appeared late or not at all. `refreshTimeout` now defaults to `50`
  ms instead of `300`.

  `PreviewComponent` also accepts `busy`, which keeps the loading indicator up while the
  caller is still navigating — router APIs return `void`, so `onNavigate` resolving does
  not mean the new content has arrived. `NextPreviewComponent` sets it from a React
  transition, so its indicator now stays visible until the new Server Component payload
  lands.

  ```tsx
  <PreviewComponent busy={isPending} onNavigate={navigate}>
    <Spinner />
  </PreviewComponent>
  ```

- 67f52fa: [CMS-54015](https://optimizely-ext.atlassian.net/browse/CMS-54015): Hardened
  the Optimizely Forms support ahead of release.

  `initForms` now keeps its components in a registry of its own rather than merging them
  into the application's. It can be called before or after `initReactComponentRegistry`
  and `initContentTypeRegistry`, works with a resolver function as well as a component
  map, and no longer registers duplicate content types when the entry point re-runs on a
  hot reload. Previously, a resolver function caused every application component to stop
  resolving.

  Detecting whether Forms is enabled is now resolved once per Graph endpoint for the
  lifetime of the process, instead of on every page render. It is cached at module scope
  rather than on the client, because `getClient()` returns a new client per call and
  frameworks call it once per request.

- 988568e: [CMS-55279](https://optimizely-ext.atlassian.net/browse/CMS-55279): Forms
  placed in a content area now render their fields. Their steps are fetched automatically,
  so `content.nodes` is populated wherever the form sits.

  `FormWrapper` also accepts an optional `submitHandler` that replaces the built-in POST —
  resolving means success, throwing means failure, and a thrown `Error`'s message is
  exposed as `useFormSubmission().errorMessage`. `action` is now optional.

  ```tsx
  <FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
  ```

- d392b21: [CMS-55409](https://optimizely-ext.atlassian.net/browse/CMS-55409): Turn DAM
  asset fragments on or off from `config()`

  DAM fragment inclusion used to be decided entirely by schema detection, with no way to
  override it. The new `dam` option settles it yourself:
  - `'automatic'` (default) — include DAM fragments when the Graph schema exposes DAM
    types. Unchanged behaviour.
  - `'on'` — always include them, skipping detection.
  - `'off'` — never include them, skipping detection.

  ```ts
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
    fragment: {
      dam: 'on', // 'automatic' | 'on' | 'off'
    },
  });
  ```

  `dam` shapes the generated query, so it is fixed for the lifetime of a client and cannot
  be overridden on a single request. See
  [Working with DAM Assets](https://github.com/episerver/content-js-sdk/blob/main/docs/11-dam-assets.md#controlling-dam-fragment-inclusion).

### Patch Changes

- 14f46bc: [CMS-54769](https://optimizely-ext.atlassian.net/browse/CMS-54769): Handle the
  `'*'` wildcard in `allowedTypes`

  `allowedTypes: ['*']` means "any content type". Queries treated `'*'` as a content type
  key and resolved nothing; `optimizely-cms-cli config push` sent it to the CMS, which
  rejects it. The wildcard now expands to every registered type when querying and is
  stripped when pushing.

- 00037d9: Fix empty options in form selection fields

  Dropdown, radio and checkbox fields render their choices again. The CMS returns the
  `Options` metadata as a JSON string, which was read as an object and produced an empty
  list.

- d392b21: [CMS-55090](https://optimizely-ext.atlassian.net/browse/CMS-55090): Generate
  cacheable GraphQL queries

  Queries now pass their filters as scalar variables instead of inline input objects, so
  Optimizely Graph can cache and store them. Responses come back faster; no changes needed
  in your application.

- aba0462: [CMS-54844](https://optimizely-ext.atlassian.net/browse/CMS-54844): Access
  section properties directly on `content`

  Custom properties of `_section` content types are now available flat on `content`, the
  same as every other content type, instead of nested under `content.component`.

- a8dc922: [CMS-54607](https://optimizely-ext.atlassian.net/browse/CMS-54607): Normalize
  graphUrl to auto-append /content/v2 when missing, fixing 404 errors when using
  OPTIMIZELY_GRAPH_GATEWAY environment variable
- 0333f2f: [CMS-55406](https://optimizely-ext.atlassian.net/browse/CMS-55406): Fix
  property inference for content types extending a contract without properties

  Extending a contract that declares no properties (or an empty `properties: {}`)
  collapsed the content type's own properties, leaving `ContentProps` empty at the type
  level.

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

- 7cc4a94: Fix custom section properties missing from Graph responses

  Properties declared on a `_section` content type came back `undefined` because the
  generated query never selected them. Sections inside an experience composition now carry
  their own properties.

- 40f3f23: [CMS-54651](https://optimizely-ext.atlassian.net/browse/CMS-54651): Fix content
  array resolution with multiple contracts

  A content area whose allowed types implement more than one contract missed the fragments
  of the extra contracts, so those properties came back `undefined`.

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

- d58d272: [CMS-55780](https://optimizely-ext.atlassian.net/browse/CMS-55780): Rich Text
  properties now default to `json` only (was `html` + `json`), shrinking query/response
  payloads. Rendering `html`? Set `config({ richTextFormat: 'html' })` or `'both'`.
- 54ab0e9: [CMS-56023](https://optimizely-ext.atlassian.net/browse/CMS-56023): config()
  options regrouped into fragment and query

### Minor Changes

- e7d2908: [CMS-55078](https://optimizely-ext.atlassian.net/browse/CMS-55078): Add
  `displayMode` to content type properties. Set `displayMode: 'hidden'` to hide a property
  from the editing interface. Defaults to `'available'` when not set.
  `opti-cms config pull` keeps `displayMode: 'hidden'` in generated content types and
  omits the `'available'` default.
- 6c3cd3a: [CMS-54015](https://optimizely-ext.atlassian.net/browse/CMS-54015): Added forms
  support to the sdk (query metadata, forms content types)
- 54977f8: Introduce a user defined attribute to define composition fragment depth for
  composition
- 79dae6d: [CMS-54818](https://optimizely-ext.atlassian.net/browse/CMS-54818): Fix slow
  and dropped preview updates in `PreviewComponent` and `NextPreviewComponent`
- 67f52fa: [CMS-54015](https://optimizely-ext.atlassian.net/browse/CMS-54015): Hardened
  the Optimizely Forms support ahead of release.

  `initForms` now keeps its components in a registry of its own rather than merging them
  into the application's. It can be called before or after `initReactComponentRegistry`
  and `initContentTypeRegistry`, works with a resolver function as well as a component
  map, and no longer registers duplicate content types when the entry point re-runs on a
  hot reload. Previously, a resolver function caused every application component to stop
  resolving.

  Detecting whether Forms is enabled is now resolved once per Graph endpoint for the
  lifetime of the process, instead of on every page render. It is cached at module scope
  rather than on the client, because `getClient()` returns a new client per call and
  frameworks call it once per request.

- 988568e: [CMS-55279](https://optimizely-ext.atlassian.net/browse/CMS-55279): Forms
  placed in a content area now render their fields. Their steps are fetched automatically,
  so `content.nodes` is populated wherever the form sits.

  `FormWrapper` also accepts an optional `submitHandler` that replaces the built-in POST —
  resolving means success, throwing means failure, and a thrown `Error`'s message is
  exposed as `useFormSubmission().errorMessage`. `action` is now optional.

  ```tsx
  <FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
  ```

- 36b4c1a: Update RICHTEXT_PRESET values

### Patch Changes

- 14f46bc: [CMS-54769](https://optimizely-ext.atlassian.net/browse/CMS-54769): Handle
  wildcard in allowedTypes
- 00037d9: Fix parsing of incoming options for form selection
- aba0462: [CMS-54844](https://optimizely-ext.atlassian.net/browse/CMS-54844): Access
  section properties directly on `content`

  Custom properties of `_section` content types are now available flat on `content`, the
  same as every other content type, instead of nested under `content.component`.

- a8dc922: [CMS-54607](https://optimizely-ext.atlassian.net/browse/CMS-54607): Normalize
  graphUrl to auto-append /content/v2 when missing, fixing 404 errors when using
  OPTIMIZELY_GRAPH_GATEWAY environment variable
- 0333f2f: [CMS-55406](https://optimizely-ext.atlassian.net/browse/CMS-55406): Fix
  property inference for content types extending a contract without properties
- 7cc4a94: Fixed custom section properties not returned by graph client
- 40f3f23: [CMS-54651](https://optimizely-ext.atlassian.net/browse/CMS-54651): Fix content
  array resolution with multiple contracts

## 2.2.0

### Minor Changes

- 53775b0: Improve typing for contentType function
- b15e199: Fix displaySetting's 'editor' type issue and add 'selectOne'
- c662175: Fix namespace (graph, globalcontracts) issue in GraphQL query/fragment
  generation
- c184559: Add support for language/locale in build config
- 10a19be: Introduce the method toSchema for parsing data fetched from other GraphQL libs

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

## 2.1.0-beta.0

### Minor Changes

- 2a7e43b: Cumulative release: Includes all new features, bug fixes, and performance
  improvements merged since v2.0.0
