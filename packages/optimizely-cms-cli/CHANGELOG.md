# @optimizely/cms-cli

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
