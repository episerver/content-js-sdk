# The framework-agnostic core

`@optimizely/cms-sdk/core` holds everything the SDK needs to render Optimizely CMS content,
as plain functions and observable stores. It imports no framework.

The React components in `@optimizely/cms-sdk/react/server`, `/react/client` and
`/forms/react` are thin bindings over this module. If you are writing an application, keep
using those — this page is for building a binding for another framework, or for rendering
content without one.

```ts
import { planComposition, resolveContentComponent } from '@optimizely/cms-sdk/core';
```

## What a binding has to supply

Core makes every decision that does not depend on the framework: which component a piece of
content maps to, which display-template tag applies, how a composition node becomes component
props, which `data-epi-*` attributes belong where, whether a field is valid, and what a form
submit does.

A binding supplies four things:

| | |
| --- | --- |
| **Elements** | Turning a descriptor into your framework's element |
| **Reactivity** | Subscribing to a store and re-rendering |
| **Local state** | A field's current value, whether it has been touched |
| **Event handlers** | `onChange`, `onBlur`, `onSubmit`, `onClick` |

## Stores

Every stateful part of core is a store with the same two methods:

```ts
type ReadableStore<T> = {
  getSnapshot(): T;
  subscribe(listener: () => void): () => void;
};
```

`getSnapshot()` keeps its identity until the state actually changes. That is what React's
`useSyncExternalStore` requires; it is also the Svelte store contract, and it maps onto an
Angular signal:

```ts
// React
const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

// Svelte
const state = readable(store.getSnapshot(), set => store.subscribe(() => set(store.getSnapshot())));

// Angular
const state = signal(store.getSnapshot());
store.subscribe(() => state.set(store.getSnapshot()));
```

## Rendering

### 1. Register components

```ts
import { initComponentRegistry } from '@optimizely/cms-sdk/core';

initComponentRegistry({
  resolver: {
    Article: ArticleComponent,
    Hero: { default: HeroComponent, tags: { featured: FeaturedHeroComponent } },
  },
});
```

The registry holds components as `unknown` — core has no opinion on what a component is. Pass
your framework's component type as the type argument when you read one back.

`initForms(handlers)` fills a second registry for Optimizely Forms elements. The two are
separate so the calls can happen in either order, and so an application using a resolver
*function* keeps it.

Both registries are global, and `initReactComponentRegistry` writes the same one. A host
rendering with more than one framework — Astro with React and Svelte islands, say — gives each
binding its own registry instead, and passes it to `resolveContentComponent` and
`planGridSection` as `registry`. It is consulted instead of both global registries, with no
fallback, so register form components in it too (see `mapFormHandlersToContentTypes`).

```ts
const registry = new ComponentRegistry<SvelteComponent>({ Article: ArticleComponent });

resolveContentComponent(content, { registry });
planGridSection(nodes, { registry });
```

### 2. Resolve one piece of content

```ts
const resolved = resolveContentComponent<MyComponentType>(content, { tag, props });
```

It returns:

- `component` — what the registry matched, or `undefined`
- `typename` — the content type the lookup settled on, for your fallback message
- `tag` — the tag it used
- `contentProps` — the content to hand the component
- `componentProps` — the caller's props, minus the preview attributes
- `previewAttrs` — the `data-epi-*` props, **always empty outside edit mode**

Tag precedence is: an explicit `tag` option, then `content.__tag`, then the tag of the display
template named by `_metadata.displayOption`, `composition.displayTemplateKey`,
`__composition.displayTemplateKey` or `displayTemplateKey`, in that order.

Component lookup tries each entry of `_metadata.types` in turn, most specific first, and falls
back to `__typename`.

Because `previewAttrs` is empty outside edit mode, a binding can decide whether to render a
wrapper with one check:

```ts
const needsWrapper = Object.keys(resolved.previewAttrs).length > 0;
```

To appear in the same traces as the React components, wrap the render in
`withComponentRenderSpan`. It emits `optimizely.<framework>.render_component`, a no-op unless
OpenTelemetry is configured:

```ts
import { SemanticAttributes } from '@optimizely/cms-sdk/telemetry';

await withComponentRenderSpan('svelte', content.__typename, !!resolved.tag, !!displaySettings, async span => {
  span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, !!resolved.component);
  // render
});
```

### 3. Plan a composition

`planComposition(nodes)` and `planGridSection(nodes)` walk an experience and return a flat
description of what to render. Neither produces any element.

```ts
type RenderItem<C> =
  | { kind: 'component'; source: 'component' | 'section'; content: OptimizelyContent; … }
  | { kind: 'structure'; nodeType: string; index: number; globalComponent: C | undefined;
      children: GridRenderItem<C>[]; … }
  | { kind: 'unknown'; … };
```

Every item also carries `key`, `node`, `tag`, `displaySettings` and `previewAttrs`.

The two planners differ in more than recursion, and the difference is load-bearing:

- **`planComposition`** is a flat experience section. A component node's `content` is
  `{ ...node.component, __tag }`. A section node's `content` also carries the node's own
  scalar fields and `__typename: node.type` — a section is a content type in its own right.
  `source` tells the two apart; `isWrappedComponent(item)` is true for the component nodes a
  binding wraps. It never returns `structure` items.
- **`planGridSection`** recurses through rows and columns. A component node's `content` is
  `{ ...node.component, __composition: node, __tag }`, which is what lets a component read its
  own composition key. A `row` or `column` node gets `globalComponent` filled from whatever is
  registered under `_Row` / `_Column`. `getStructureContainer(item, { overrides, fallbacks })`
  picks the binding's override first, then that component, then the binding's fallback.

A `kind: 'unknown'` item is a node whose content type the CMS did not resolve. Render your own
placeholder, or nothing.

### Rendering the plan

```ts
function render(items: RenderItem<MyComponentType>[]): MyElement[] {
  return items.map(item => {
    if (item.kind === 'unknown') return placeholder(item.key);

    if (item.kind === 'structure')
      return element(getStructureContainer(item, { fallbacks }) ?? Fragment, {
        key: item.key,
        displaySettings: item.displaySettings,
        ...item.previewAttrs,
        children: render(item.children),
      });

    const resolved = resolveContentComponent<MyComponentType>(item.content);
    return element(resolved.component ?? Fallback, {
      key: item.key,
      content: resolved.contentProps,
      displaySettings: item.displaySettings,
    });
  });
}
```

## Live preview

`createContentSavedListener` holds the whole CMS save-event flow: URL normalisation,
debouncing, the duplicate guard, same-URL detection, and the hard-reload fallback.

```ts
const listener = createContentSavedListener({
  onNavigate: (url, isSameUrl) => (isSameUrl ? router.refresh() : router.push(url)),
  refreshTimeout: 50,
  onBusyChange: busy => setMask(busy),
});

const stop = listener.start();
```

Nothing subscribes until `start()`, so importing the module on a server is safe.

The CMS emits a burst of events for a single save — the page, plus each nested block — which
`refreshTimeout` coalesces into one navigation. Setting it to `false` navigates immediately and
falls back to a 50 ms duplicate guard instead.

Call `listener.update(options)` on every render rather than recreating the listener. Bindings
pass an inline arrow for `onNavigate`, and tearing the listener down would cancel a refresh
that is already pending.

Without an `onNavigate`, the page hard-reloads via `window.location.replace`.

## Forms

Three pieces, deliberately separate.

### The submission store

```ts
const submission = createSubmissionStore();
// { status, error, errorMessage, formSuccess, formError, isSubmitting }
```

Separate from the controller because the status is usually read *outside* the form — an alert
above it, a button in a footer. `errorMessage` is only ever set when a `submitHandler` threw an
`Error`; a failed built-in POST leaves it undefined, so a template rendering it cannot put
`Failed to fetch` or a bare status code in front of a visitor.

### The controller

```ts
const controller = createFormController({ submission, action, submitHandler, stepIds, stepRules });
```

Snapshot: `{ currentStepIndex, attemptedSubmit, hasAnyErrors, resetToken, fieldToReveal }`.

Fields register themselves with a validator:

```ts
controller.registerField(name, element, () => isValid, stepIndex);
```

Things worth knowing before you write a binding against it:

- **Call `controller.update(settings)` during render**, not in an effect. It merges, so
  pass only what changed; pass a key as `undefined` to clear it. `submit` can fire
  before the first effect flushes, and an inline `submitHandler` is a new function every
  render. Anything in `FormControllerSettings` — `action`, `submitHandler`, `stepIds`,
  `stepRules`, `scrollToOnSuccess`, `scrollToOnError` — is read at use rather than captured
  at creation.
- **`stepIds` holds, per step, every id a dependency rule may name it by** (see
  `getElementIds`). `stepRules` answers jump targets and step visibility from the current
  field values; `nextStep` follows a jump, otherwise skips hidden steps (never the last), and
  `prevStep` retraces the path actually taken.
- **`nextStep` validates only the current step**; `submit` validates every step, including ones
  that are not on screen, and switches to the step holding the first failure.
- **Revealing a field is two-phase.** A failed validation sets `fieldToReveal`; the binding
  calls `controller.revealPendingField()` after rendering, once the step holding it is on
  screen. Scrolling to a `display: none` element does nothing, which would leave the visitor on
  a form that silently refuses to send.
- **`resetToken` is how fields clear.** The inputs are controlled, so a DOM `form.reset()`
  clears the markup but leaves framework state holding the old values. Fields watch the token
  and return to their initial value; it starts at 0, so skip the first render.
- **Field order is tracked separately from registration.** A field re-registers every time its
  validity flips, so map insertion order drifts from page order. `validateAllFields` returns
  failures in page order regardless.
- **DOM work is injectable.** `effects.scrollToElementId` and `effects.revealField` default to
  the real DOM; pass your own to test the controller headless.

`submit(formData, form)` runs `dropShadowedBlanks` first. Every step stays mounted and enabled,
so a field name reused across steps reaches `FormData` once per step, and the blank copies would
otherwise shadow the real answer.

### Fields, buttons and rules

Field state is derived, not stored. The binding owns only the value and the touched flag:

```ts
const definition = defineFormField({ content });
const state = computeFieldState(definition, { value, isTouched, attemptedSubmit, isVisible });

const { fieldProps, errorProps } = buildFieldProps(definition, state, value);
const props = { ...fieldProps, onChange, onBlur, ref };
```

Buttons the same way:

```ts
const role = getFormButtonRole(content);         // 'submit' | 'next' | 'previous' | 'reset'
const props = { ...buildButtonProps(role, { isSubmitting, tooltip }), onClick };
```

Dependency rules are pure functions over a map of field values:

```ts
const visible = isElementVisible(rules, fieldValues, elementId);
```

The binding owns that map — a satisfied `Hide` beats a satisfied `Show`, and an element no rule
targets is visible. Core deliberately does not hold the values, so there is only ever one source
of truth for them.

## Context

Request-scoped data (the preview token, edit mode) goes through a `ContextAdapter`. React has
`ReactContextAdapter`, backed by `React.cache`. For anything else, `MemoryAdapter`:

```ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { configureAdapter, MemoryAdapter } from '@optimizely/cms-sdk/core';

const adapter = new MemoryAdapter(new AsyncLocalStorage());
configureAdapter(adapter);

// then, per request:
await adapter.run(() => handleRequest(request));
```

Without an `AsyncLocalStorage` it uses a single shared context — correct in a browser, and on a
host serving one request at a time, but not on a server handling concurrent requests.

## Rich text

`getRichTextTree(content)` turns a rich-text field into a tree of `RenderNode`s. A binding walks it
with three helpers: `getRichTextElement(node)` gives an element node's `tag`, `selfClosing`,
`attributes` and `style` (with the image preview token applied); `getMarkTag(mark)` gives a text
mark's tag; and `toStyleString(style)` writes the style for frameworks that take a string.

## What stays in a binding

Not everything belongs in core. The React layer keeps, and yours should too:

- Presentation fallbacks — the default row, column and component wrappers
- The framework's own prop conventions, such as React's `className` / `htmlFor` mapping
- Anything requiring the framework's element type or its lifecycle
