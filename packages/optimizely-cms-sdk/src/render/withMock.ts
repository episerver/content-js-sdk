/**
 * Declaring stand-in content next to the component that renders it.
 *
 * @module
 */

import type { AnyContentType } from '../model/contentTypes.js';
import type { ContentProps, InferProps } from '../infer.js';
import type { ComponentMock, FakerLike } from './mockContent.js';

/** Where the mock is kept on a component. Read back by the preview page. */
export const MOCK = Symbol.for('optimizely.mock');

/**
 * Attaches the stand-in content a component should be previewed with.
 *
 * The preview page finds it the same way it finds the component — by content
 * type key, through the component registry — so there is no list to keep and
 * nothing to import. A component with no mock still previews; its properties
 * are filled from the schema as before.
 *
 * Values are checked against the content type's properties, so a renamed
 * property is a compile error rather than a preview that quietly shows the
 * wrong thing. Base fields such as `_metadata` are not settable here.
 *
 * @example A fixed value
 * ```tsx
 * export default withMock(Heading, HeadingComponent, {
 *   heading: 'Shop the winter range',
 * });
 * ```
 *
 * @example Built from the preview's text source
 * ```tsx
 * export default withMock(Button, ButtonComponent, ({ faker }) => ({
 *   label: faker?.commerce.productName() ?? 'Add to basket',
 * }));
 * ```
 *
 * Only read when rendering through `createStandalonePreview`. Nothing else
 * looks for it, so it has no effect on a page an editor publishes.
 */
export function withMock<C, T extends AnyContentType>(
  component: C,
  // Present for its type, not its value: it is what `data` is checked
  // against. Named rather than `_` so the call site reads properly.
  contentType: T,
  // The content type's own properties, and nothing else: `_metadata`, `_id`
  // and the rest of the base fields are the preview's to decide, not a
  // component's to pin.
  data:
    | Partial<InferProps<T>>
    | ((ctx: {
        faker?: FakerLike;
        /** Everything the schema produced, base fields included. */
        generated: ContentProps<T>;
      }) => Partial<InferProps<T>>),
): C {
  // A symbol rather than a named property: components are also plain
  // functions an application may already hang things on.
  Object.defineProperty(component as object, MOCK, {
    value: data as ComponentMock,
    enumerable: false,
    configurable: true,
  });

  return component;
}

/** The mock a component was given, if it has one. */
export function mockOf(component: unknown): ComponentMock | undefined {
  return (component as Record<symbol, ComponentMock> | undefined)?.[MOCK];
}
