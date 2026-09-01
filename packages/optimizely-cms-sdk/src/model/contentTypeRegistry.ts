import { AnyContentType, AnyContract } from './contentTypes.js';

export type RegistryEntry = AnyContentType | AnyContract;

/** Types the application registered through `initContentTypeRegistry`. */
let _registry: RegistryEntry[] = [];

/**
 * Types added by the SDK itself, currently the Optimizely Forms elements.
 *
 * Kept apart from `_registry` so that `init` and `addToContentTypeRegistry` can
 * be called in either order without one wiping the other.
 */
let _added: RegistryEntry[] = [];

/**
 * Bumped whenever either list changes, so callers that cache a snapshot of the
 * registry can tell it has gone stale. See `getCachedContentTypes`.
 */
let _version = 0;

/** Returns a value that changes whenever the registry contents change. */
export function getRegistryVersion(): number {
  return _version;
}

/** Initializes the content type registry */
export function init(registry: RegistryEntry[]) {
  _registry = registry;
  _version++;
}

/**
 * Adds content types to the registry without replacing existing entries
 * (internal use only).
 *
 * Types already present are skipped: this runs on every hot reload, and
 * duplicates would otherwise pile up and be emitted into generated queries.
 */
export const addToContentTypeRegistry = (types: AnyContentType[]) => {
  const added = types.filter(type => getContentType(type.key) === undefined);
  if (added.length === 0) return;

  _added.push(...added);
  _version++;
};

/** Get the Component from a content type name */
export function getContentType(name: string) {
  return _registry.find(c => c.key === name) ?? _added.find(c => c.key === name);
}

/** Get all the content types */
export function getAllContentTypes(): RegistryEntry[] {
  return _added.length === 0 ? _registry : [..._registry, ..._added];
}

/** Get the Component from a base type */
export function getContentTypeByBaseType(name: string): AnyContentType[] {
  return getAllContentTypes().filter(
    (c): c is AnyContentType => 'baseType' in c && c.baseType === name,
  );
}

/**
 * Check if a content type is registered in the registry.
 * Useful for validating content types before attempting to fetch or render them.
 *
 * @param key - The content type key to check
 * @returns true if the content type is registered, false otherwise
 *
 * @example
 * ```typescript
 * if (isContentTypeRegistered('BlogPage')) {
 *   const content = await client.getContentByPath('/blog/post-1');
 * }
 * ```
 */
export function isContentTypeRegistered(key: string): boolean {
  return getContentType(key) !== undefined;
}
