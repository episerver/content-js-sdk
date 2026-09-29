/**
 * The component registries the render layer resolves against, and the `init`
 * functions applications call to fill them.
 *
 * Components are held as `unknown` because the core layer has no opinion on what a
 * component is; each framework binding narrows on read.
 *
 * @module
 */

import { ComponentRegistry, ComponentResolverOrObject } from '../../render/componentRegistry.js';
import { addToContentTypeRegistry } from '../../model/contentTypeRegistry.js';
import { FormContentTypes } from '../../model/formContentTypes.js';
import { mapFormHandlersToContentTypes, type FormHandlers } from '../forms/setup.js';

/** Components registered by the application, through {@linkcode initComponentRegistry}. */
let componentRegistry: ComponentRegistry<unknown> | undefined;

/**
 * Components registered for Optimizely Forms elements, through {@linkcode initForms}.
 *
 * Held in a registry of its own rather than merged into `componentRegistry`, so
 * that the two `init` calls can happen in either order, and so that an
 * application using a resolver *function* keeps it. Merging meant reading the
 * application's components out of its resolver, which is only possible when the
 * resolver is a plain object.
 */
let formComponentRegistry: ComponentRegistry<unknown> | undefined;
let formComponents: Record<string, unknown> = {};

/** Registers the application's components. */
export function initComponentRegistry(options: {
  resolver: ComponentResolverOrObject<unknown>;
}) {
  componentRegistry = new ComponentRegistry(options.resolver);
}

/**
 * Registers Optimizely Forms content types and the components that render them.
 *
 * @param handlers Form component handlers mapped by display name
 */
export function initForms<C>(handlers: FormHandlers<C>) {
  addToContentTypeRegistry(FormContentTypes);
  formComponents = { ...formComponents, ...mapFormHandlersToContentTypes(handlers) };
  formComponentRegistry = new ComponentRegistry(formComponents);
}

/** True once either registry has been filled. A forms-only application is legitimate. */
export const hasComponentRegistry = (): boolean =>
  !!componentRegistry || !!formComponentRegistry;

/** Options for a component lookup. */
export type ResolveComponentOptions<C> = {
  tag?: string;
  /** Looked up instead of both global registries, so bindings sharing a host stay apart. */
  registry?: ComponentRegistry<C>;
};

/**
 * Looks a component up in `options.registry` when given, otherwise in the
 * application's registry, then in the forms one.
 */
export function resolveComponent<C>(
  contentType: string,
  { registry, ...options }: ResolveComponentOptions<C> = {},
): C | undefined {
  if (registry) return registry.getComponent(contentType, options);

  return (componentRegistry?.getComponent(contentType, options) ??
    formComponentRegistry?.getComponent(contentType, options)) as C | undefined;
}

/**
 * Empties both registries.
 *
 * @internal Exists for tests, which would otherwise leak registrations between cases.
 */
export function resetComponentRegistry() {
  componentRegistry = undefined;
  formComponentRegistry = undefined;
  formComponents = {};
}
