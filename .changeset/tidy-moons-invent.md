---
'@optimizely/cms-sdk': minor
---

Add component previews: `createComponentPreviewPage` renders a single component
on its own page for an iframe to embed, `generateMockContent` fills it with
stand-in content derived from the content type (optionally through faker, a
factory, or predefined data), and `@optimizely/cms-sdk/core` exports the
postMessage contract the preview uses to report its size to the embedding page.
