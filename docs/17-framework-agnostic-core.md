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

`getSnapshot()` keeps its identity until the state changes, so it adapts to any framework in
one line:

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

`initForms(handlers)` fills a second registry for Optimizely Forms elements; the calls can
happen in either order.

Both registries are global, and `initReactComponentRegistry` writes the same one. A host
rendering with more than one framework (e.g. Astro with React and Svelte islands) gives each
binding its own registry, passed as `registry` to `resolveContentComponent` and
`planGridSection`. It replaces both global registries with no fallback, so register form
components in it too (see `mapFormHandlersToContentTypes`).

```ts
import { ComponentRegistry, planGridSection, resolveContentComponent } from '@optimizely/cms-sdk/core';

// The component type is inferred from the map, tagged variants included
const registry = new ComponentRegistry({ Article: ArticleComponent });

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
- `previewAttrs` — the `data-epi-*` props, or `undefined` when there are none (**always outside edit mode**)

Tag precedence is: an explicit `tag` option, then `content.__tag`, then the tag of the display
template named by `_metadata.displayOption`, `composition.displayTemplateKey`,
`__composition.displayTemplateKey` or `displayTemplateKey`, in that order.

Component lookup tries each entry of `_metadata.types` in turn, most specific first, and falls
back to `__typename`.

A binding decides whether to render a wrapper by checking `resolved.previewAttrs` directly.

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

The two planners shape `content` differently:

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
        node: item.node,
        index: item.index,
        displaySettings: item.displaySettings,
        children: render(item.children),
      });

    const resolved = resolveContentComponent<MyComponentType>(item.content, {
      props: item.previewAttrs,
      registry,
    });
    const component = element(resolved.component ?? Fallback, {
      content: resolved.contentProps,
      displaySettings: item.displaySettings,
      ...resolved.componentProps,
    });

    return resolved.previewAttrs ?
        element('div', { key: item.key, ...resolved.previewAttrs, children: component })
      : withKey(component, item.key);
  });
}
```

For `planComposition`, render `isWrappedComponent(item)` items inside a wrapper carrying
`item.previewAttrs` instead of passing them as props. `samples/astro-sample/src/components/svelte/optimizely/`
has a working Svelte binding built this way.

## Live preview

`createContentSavedListener` handles CMS save events: URL normalisation, debouncing,
duplicate filtering, same-URL detection and the hard-reload fallback.

```ts
const listener = createContentSavedListener({
  onNavigate: (url, isSameUrl) => (isSameUrl ? router.refresh() : router.push(url)),
  refreshTimeout: 50,
  onBusyChange: busy => setMask(busy),
});

const stop = listener.start();
```

- Nothing subscribes until `start()`, so importing on a server is safe.
- `refreshTimeout` coalesces the burst of events one save emits into a single navigation;
  `false` navigates immediately, with a 50 ms duplicate guard.
- Call `listener.update(options)` on every render instead of recreating the listener, which
  would cancel a pending refresh.
- Without `onNavigate`, the page hard-reloads.

## Forms

### The submission store

```ts
const submission = createSubmissionStore();
// { status, error, errorMessage, formSuccess, formError, isSubmitting }
```

Kept separate from the controller so status can be read outside the form. `errorMessage` is
only set when a `submitHandler` throws an `Error`, never for a failed built-in POST.

### The controller

```ts
const controller = createFormController({ submission, action, submitHandler, stepIds, stepRules });
```

Snapshot: `{ currentStepIndex, attemptedSubmit, hasAnyErrors, resetToken, fieldToReveal }`.

Fields register themselves with a validator:

```ts
controller.registerField(name, element, () => isValid, stepIndex);
```

- **Call `controller.update(settings)` during render**, not in an effect. It merges; pass a key
  as `undefined` to clear it. Every `FormControllerSettings` value is read at use, not captured
  at creation.
- **`stepIds` holds, per step, every id a dependency rule may name it by** (see
  `getElementIds`). `nextStep` follows a jump from `stepRules`, otherwise skips hidden steps
  (never the last); `prevStep` retraces the path taken.
- **`nextStep` validates only the current step**; `submit` validates every step and switches to
  the first failure.
- **Revealing a field is two-phase.** A failed validation sets `fieldToReveal`; call
  `controller.revealPendingField()` after the step holding it has rendered.
- **Fields clear on `resetToken`**, returning to their initial value. It starts at 0, so skip
  the first render.
- **`validateAllFields` returns failures in page order**, not registration order.
- **DOM work is injectable** through `effects.scrollToElementId` and `effects.revealField`.

`submit(formData, form)` runs `dropShadowedBlanks` first, so blank copies of a field name reused
across steps don't shadow the real answer.

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

The binding owns that map. A satisfied `Hide` beats a satisfied `Show`, and an element no rule
targets is visible.

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
