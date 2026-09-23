---
'@optimizely/cms-sdk': minor
---

[CMS-54818](https://optimizely-ext.atlassian.net/browse/CMS-54818): Fix slow and dropped preview updates in `PreviewComponent` and `NextPreviewComponent`

A single save in the CMS emits a burst of events (the page plus each nested block). The debounce that coalesced them was re-created on every render, so pending refreshes were cancelled and edits appeared late or not at all. `refreshTimeout` now defaults to `50` ms instead of `300`.

`PreviewComponent` also accepts `busy`, which keeps the loading indicator up while the caller is still navigating — router APIs return `void`, so `onNavigate` resolving does not mean the new content has arrived. `NextPreviewComponent` sets it from a React transition, so its indicator now stays visible until the new Server Component payload lands.

```tsx
<PreviewComponent busy={isPending} onNavigate={navigate}>
  <Spinner />
</PreviewComponent>
```
