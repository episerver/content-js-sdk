---
'@optimizely/cms-sdk': minor
---

Add component previews: one component rendered on a page of its own, for a
catalogue, an inspector or a screenshot runner to consume.

Three new entry points, split by who imports them:

- `@optimizely/cms-sdk/react/standalone` — `createStandalonePreview` builds
  the preview page. Needs React Server Components, so Next's App Router or
  another RSC-capable framework. Nothing in it imports Next.
- `@optimizely/cms-sdk/mock` — `withMock` declares the stand-in content a
  component is previewed with, next to the component itself, checked against
  its content type. `generateMockContent` builds content from a content
  type's schema, optionally through faker, a factory or predefined values.
- `@optimizely/cms-sdk/protocol` — the contract an embedder reads: the
  `postMessage` types a preview reports its size over, and the DOM attributes
  it writes the same measurement to for tools that load the page directly
  rather than framing it.

The preview reports `dimensions` once it has settled and again when its box
moves, answers a `measure` request from the embedder, and reports `error`
when a component cannot be rendered. Measurements go to `OPTIMIZELY_CMS_URL`
unless the page names another origin.
