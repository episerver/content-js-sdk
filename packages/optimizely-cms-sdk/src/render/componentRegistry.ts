/**
 * This module defines a {@linkcode ComponentRegistry}, a mapping between Optimizely CMS content types and
 * frontend Components (React components, Vue components, etc.)
 *
 * To define the `ComponentRegistry`, developers can provide a {@linkcode ComponentMap} object or a
 * {@linkcode ComponentResolver} function
 *
 * @module
 */

/**
 * A component definition that includes a default component and optional
 * tagged variants
 */
type ComponentWithVariants<C> = {
  /** Default component */
  default: C;

  /**
   * Tagged variants, where the keys are tag names and the values are the corresponding components.
   */
  tags: Record<string, C>;
};

/** A component entry that can be a single component or a component with tagged variants  */
type ComponentEntry<C> = C | ComponentWithVariants<C>;

/** Optional arguments to resolve a component */
type ResolverOptions = {
  tag?: string;
};

/**
 * A function that dynamically resolves components based on content type and options.
 *
 * This provides a flexible alternative to static component mappings, allowing you to
 * implement custom logic for component resolution, such as lazy loading, conditional
 * rendering, or dynamic imports.
 */
type ComponentResolver<C> = (
  contentType: string,
  options?: ResolverOptions
) => C | undefined;

/** Object mapping a content type name to a {@linkcode ComponentEntry} */
type ComponentMap<C> = Record<string, ComponentEntry<C>>;

/** Returns true if `obj` is type {@linkcode ComponentWithVariants} */
function hasVariants(obj: unknown): obj is ComponentWithVariants<unknown> {
  return (
    typeof obj === 'object' && obj !== null && 'default' in obj && 'tags' in obj
  );
}

/** Returns the default component in an {@linkcode ComponentEntry} */
function getDefaultComponent<C>(entry: ComponentEntry<C>): C {
  if (hasVariants(entry)) {
    return entry.default;
  } else {
    return entry;
  }
}

/** Returns a component matching a tag in a {@linkcode ComponentEntry} */
function getTagComponent<C>(
  entry: ComponentEntry<C>,
  tag: string
): C | undefined {
  if (!hasVariants(entry)) {
    return undefined;
  }

  return entry.tags[tag];
}

/**
 * Defines the component resolver as a function {@linkcode ComponentResolver}
 * or as an object {@linkcode ComponentMap}
 */
export type ComponentResolverOrObject<C> =
  | ComponentResolver<C>
  | ComponentMap<C>;

/** A registry mapping content type names and components */
export class ComponentRegistry<T> {
  resolver: ComponentResolverOrObject<T>;

  constructor(resolverOrObject: ComponentResolverOrObject<T>) {
    this.resolver = resolverOrObject;
  }

  /** Returns the component given its content type name. Returns `undefined` if not found */
  getComponent(
    contentType: string,
    options: ResolverOptions = {}
  ): T | undefined {
    if (typeof this.resolver === 'function') {
      return this.resolver(contentType, options);
    }

    const entry = this.resolver[contentType];

    if (!entry) {
      return undefined;
    }

    if (!options.tag) {
      return getDefaultComponent(entry);
    }

    // Search for the component `${contentType}:${tag}`
    const taggedEntry = this.resolver[`${contentType}:${options.tag}`];

    if (taggedEntry) {
      return getDefaultComponent(taggedEntry);
    }

    return (
      // Search for the component with the tag in the component definition
      getTagComponent(entry, options.tag) ??
      // Return the default component (without tag)
      getDefaultComponent(entry)
    );
  }
}
