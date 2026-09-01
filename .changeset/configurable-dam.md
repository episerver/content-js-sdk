---
'@optimizely/cms-sdk': minor
---

Make DAM asset fragments configurable.

New `dam` option on `GraphOptions` and `GraphQueryOptions` accepts `'automatic'` (default,
probes the schema for DAM types), `'on'` (always include DAM fragments, skipping detection)
or `'off'` (never include them). Exports the `DamMode` type.
