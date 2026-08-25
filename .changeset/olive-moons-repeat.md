---
'@optimizely/cms-sdk': minor
---

Forms placed in a content area now render their fields, and submission can be handled in code.

Previously a form only worked inside an experience composition or previewed on its own; in a content area it rendered as a title and nothing else. The SDK now detects a form container reachable through a page's content properties, and `@optimizely/cms-sdk/react/server` gains `getFormNodes(content)` for reading its steps — Graph leaves `composition` empty for content reached that way, so the container is fetched separately when needed. Use it in place of `content.nodes`:

```tsx
export default async function FormContainer({ content }) {
  const nodes = await getFormNodes(content);
  // ...
}
```

`FormWrapper` also accepts an optional `submitHandler` that replaces the built-in POST to the container's Submit URL. Resolving means success, throwing means failure, and a thrown `Error`'s message is exposed as `useFormSubmission().errorMessage`. `action` is now optional.

```tsx
<FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
```
