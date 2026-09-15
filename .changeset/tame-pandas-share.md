---
'@optimizely/cms-cli': minor
---

`config pull` can now generate a `registry.ts` file that registers every pulled content type and display template via `initContentTypeRegistry()` / `initDisplayTemplateRegistry()`, optionally including a `config({ apiKey })` call.
