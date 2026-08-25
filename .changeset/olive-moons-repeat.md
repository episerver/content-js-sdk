---
'@optimizely/cms-sdk': minor
---

Forms placed in a content area now render their fields, and submission can be handled in code.

Previously a form only worked inside an experience composition or previewed on its own; in a content area it rendered as a title and nothing else. The SDK now detects a form container reachable through a page's content properties, and fills in its steps while fetching — Graph resolves a section's `composition` only when that section is the content being asked for, so those containers are fetched separately. Nothing is needed in your components: `content.nodes` is populated either way.

`FormWrapper` also accepts an optional `submitHandler` that replaces the built-in POST to the container's Submit URL. Resolving means success, throwing means failure, and a thrown `Error`'s message is exposed as `useFormSubmission().errorMessage`. `action` is now optional.

```tsx
<FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
```
