---
'@optimizely/cms-cli': minor
---

[CMS-55061](https://optimizely-ext.atlassian.net/browse/CMS-55061): `config pull` can now generate a `registry.ts` file that registers every pulled content type and display template via `initContentTypeRegistry()` / `initDisplayTemplateRegistry()`, optionally including a `config({ apiKey })` call.
