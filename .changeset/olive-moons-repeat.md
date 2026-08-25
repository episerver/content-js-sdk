---
'@optimizely/cms-sdk': minor
---

Forms placed in a content area now render their fields.

Until now, a form only worked in an experience's composition or when previewed on its own. Dropped into a content area of an ordinary page it rendered as a title and nothing else, because two things assumed a composition: the probe that decides whether a page needs the form fragments only asks `_Experience`, and a section only fetched its own `composition` when it was the query root.

The probe now falls back to the content model, so a page whose content area permits a form container gets the form fragments, and a form container reached through a content property fetches its own composition.

That second part is limited to form containers on purpose. `composition` comes from Graph's `_ISection` interface, and an application type declaring `sectionEnabled` is not necessarily given it — asking one for `composition` fails the whole query with `Cannot query field "composition"`. Only the forms container is known to implement it, and telling the difference needs the schema, which the query builder does not have.

Graph leaves `composition` empty for content reached through a content area, so `@optimizely/cms-sdk/react/server` gains `getFormNodes(content)`. It returns the form's steps as they arrive when they are already there, and fetches the container on its own when they are not. Call it in place of reading `content.nodes` in a form container component:

```tsx
export default async function FormContainer({ content }) {
  const nodes = await getFormNodes(content);
  // ...
}
```
