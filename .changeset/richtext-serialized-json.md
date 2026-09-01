---
'@optimizely/cms-sdk': patch
---

Render RichText content delivered as a serialized JSON string.

Optimizely Graph returns the `json` field either as an object or as a JSON string depending
on the CMS version. `RichText` previously rendered nothing for the string form; it now
parses it, and renders empty rather than throwing on malformed input.
