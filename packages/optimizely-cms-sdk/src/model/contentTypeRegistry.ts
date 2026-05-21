import { AnyContentType, Contract } from './contentTypes.js';

export type RegistryEntry = AnyContentType | Contract;

let _registry: RegistryEntry[] = [];

/** Initializes the content type registry */
export function init(registry: RegistryEntry[]) {
  _registry = registry;
}

/** Get the Component from a content type name */
export function getContentType(name: string) {
  return _registry.find(c => c.key === name);
}

/** Get all the content types */
export function getAllContentTypes(): RegistryEntry[] {
  return _registry;
}

/** Get the Component from a base type */
export function getContentTypeByBaseType(name: string): AnyContentType[] {
  return _registry.filter((c): c is AnyContentType => 'baseType' in c && c.baseType === name);
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
