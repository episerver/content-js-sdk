/**
 * This module defines a {@linkcode ComponentRegistry}, a mapping between Optimizely CMS content types and
 * frontend Components (React components, Vue components, etc.)
 *
 * To define the `ComponentRegistry`, developers can provide a {@linkcode ComponentMap} object or a
 * {@linkcode ComponentResolver} function
 *
 * @module
 */

import { startComponentResolveSpan } from '../telemetry/spans.js';
import { SemanticAttributes } from '../telemetry/index.js';
import { componentResolveDuration, componentLookupCount, recordMetrics } from '../telemetry/metrics.js';

/**
 * A component definition that includes a default component and optional
 * tagged variants
 */
type ComponentWithVariants<C> = {
  /** Default component */
  default?: C;

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
type ComponentResolver<C> = (contentType: string, options?: ResolverOptions) => C | undefined;

/** Object mapping a content type name to a {@linkcode ComponentEntry} */
type ComponentMap<C> = Record<string, ComponentEntry<C>>;

/** Returns true if `obj` is type {@linkcode ComponentWithVariants} */
function hasVariants(obj: unknown): obj is ComponentWithVariants<unknown> {
  return typeof obj === 'object' && obj !== null && 'tags' in obj;
}

/** Returns the default component in an {@linkcode ComponentEntry} */
function getDefaultComponent<C>(entry: ComponentEntry<C>): C | undefined {
  if (hasVariants(entry)) {
    return entry.default;
  } else {
    return entry;
  }
}

/** Returns a component matching a tag in a {@linkcode ComponentEntry} */
function getTagComponent<C>(entry: ComponentEntry<C>, tag: string): C | undefined {
  if (!hasVariants(entry)) {
    return undefined;
  }

  return entry.tags[tag];
}

/**
 * Defines the component resolver as a function {@linkcode ComponentResolver}
 * or as an object {@linkcode ComponentMap}
 */
export type ComponentResolverOrObject<C> = ComponentResolver<C> | ComponentMap<C>;

/** A registry mapping content type names and components */
export class ComponentRegistry<T> {
  resolver: ComponentResolverOrObject<T>;

  constructor(resolverOrObject: ComponentResolverOrObject<T>) {
    this.resolver = resolverOrObject;
  }

  /** Returns the component given its content type name. Returns `undefined` if not found */
  getComponent(contentType: string, options: ResolverOptions = {}): T | undefined {
    const span = startComponentResolveSpan(contentType, options.tag);
    const startTime = span ? performance.now() : 0;
    const endSpan = (component?: any) => {
      const found = !!component;
      span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, found);

      if (span) {
        const attributes: Record<string, any> = {
          [SemanticAttributes.OPTI_COMPONENT_TYPE]: contentType,
          [SemanticAttributes.OPTI_COMPONENT_FOUND]: found,
        };
        if (options.tag) {
          attributes[SemanticAttributes.OPTI_COMPONENT_TAG] = options.tag;
        }
        recordMetrics(componentResolveDuration, componentLookupCount, startTime, attributes);
      }

      span.end();
    };

    if (typeof this.resolver === 'function') {
      const resolved = this.resolver(contentType, options);
      endSpan(resolved);
      return resolved;
    }

    const entry = this.getEntryWithFallback(contentType);

    if (!options.tag) {
      if (!entry) {
        endSpan();
        return undefined;
      }
      const component = getDefaultComponent(entry);
      endSpan(component);
      return component;
    }

    const taggedEntry = this.resolver[`${contentType}:${options.tag}`];

    if (taggedEntry) {
      const component = getDefaultComponent(taggedEntry);
      endSpan(component);
      return component;
    }

    if (!entry) {
      endSpan();
      return undefined;
    }

    const component =
      // Search for the component with the tag in the component definition
      getTagComponent(entry, options.tag) ??
      // Return the default component (without tag)
      getDefaultComponent(entry);
    endSpan(component);
    return component;
  }

  /** Returns entry with optional fallback to base type when contentType ends with "Property" */
  private getEntryWithFallback(contentType: string): ComponentEntry<T> | undefined {
    if (typeof this.resolver === 'function') {
      return undefined;
    }

    const entry = this.resolver[contentType];
    if (entry) {
      return entry;
    }

    // Fallback: if contentType ends with "Property", try without the suffix
    if (contentType.endsWith('Property')) {
      const baseType = contentType.slice(0, -8); // Remove "Property"
      return this.resolver[baseType];
    }

    return undefined;
  }
}
