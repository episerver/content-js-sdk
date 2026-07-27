---
'@optimizely/cms-sdk': minor
---

Add a Storybook-like design-system viewer via the new `@optimizely/cms-sdk/react/designSystem` export.

Given a content type key (the component name), it renders that `_component` in isolation with auto-generated sample data plus its property schema and display-template variants. Callers (CMS, App, AI agent) can send the key — and optionally override field values — to preview a single component without real CMS content.

Exports: `DesignSystem` (server component), `buildSampleContent(key, overrides?)`, and `isDesignSystemEnabled()` (on locally; in production requires `OPTIMIZELY_DESIGN_SYSTEM=true`).

Wire it into an app with a thin route, e.g. `app/design-system/page.tsx`, reading `?key=`, `?props=` (JSON), and `?displaySettings=` (JSON). The stride template ships this route; copy it into other apps as needed.
