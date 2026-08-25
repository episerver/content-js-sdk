---
'@optimizely/cms-sdk': minor
---

Forms can now be submitted from code instead of by POSTing to the container's Submit URL.

`FormWrapper` accepts an optional `submitHandler` that replaces the send. Resolving means success, throwing means failure.

```tsx
<FormWrapper submitHandler={async formData => { await saveLead(formData) }}>
```

A thrown `Error`'s message is exposed as `useFormSubmission().errorMessage`. `action` is now optional.
