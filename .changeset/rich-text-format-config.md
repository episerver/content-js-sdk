---
'@optimizely/cms-sdk': major
---

Rich Text properties now default to `json` only (was `html` + `json`), shrinking query/response payloads. Rendering `html`? Set `config({ richTextFormat: 'html' })` or `'both'`.
