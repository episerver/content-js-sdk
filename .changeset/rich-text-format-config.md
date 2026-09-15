---
'@optimizely/cms-sdk': major
---

[CMS-55780](https://optimizely-ext.atlassian.net/browse/CMS-55780): Rich Text properties now default to `json` only (was `html` + `json`), shrinking query/response payloads. Rendering `html`? Set `config({ richTextFormat: 'html' })` or `'both'`.
