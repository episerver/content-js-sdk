---
'@optimizely/cms-sdk': minor
---

[CMS-56217](https://optimizely-ext.atlassian.net/browse/CMS-56217): Support CMS Taxonomy categories. The SDK now includes `categories` in the `ItemMetadata` fragment when taxonomy is available, exposing `_metadata.categories` (array of term keys) on every content fetch. Opt in to hierarchy resolution with `resolveTaxonomy: true` to get `_metadata.resolvedCategories` with full breadcrumb paths, display names, and metadata — without writing a separate `_TaxonomyTerm` query. Resolved terms are cached per-endpoint for the process lifetime. Taxonomy detection follows the same tri-state pattern as DAM (`'automatic' | 'on' | 'off'`).
