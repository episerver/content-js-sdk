---
'@optimizely/cms-sdk': minor
---

Forms placed in a content area now render their fields. Their steps are fetched automatically, so `content.nodes` is populated wherever the form sits.

`FormWrapper` also accepts an optional `submitHandler` that replaces the built-in POST — resolving means success, throwing means failure, and a thrown `Error`'s message is exposed as `useFormSubmission().errorMessage`. `action` is now optional.

```tsx
<FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
```
