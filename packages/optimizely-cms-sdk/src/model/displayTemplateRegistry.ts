import { DisplayTemplate } from './displayTemplates.js';

let _registry: DisplayTemplate[] = [];

/** Initializes the content type registry */
export function init(registry: DisplayTemplate[]) {
  _registry = registry;
}

/** Get the DisplayTemplate from a template name */
export function getDisplayTemplate(name: string) {
  return _registry.find((c) => c.key === name);
}

/**
 * Get the tag of a {@linkcode DisplayTemplate}. Returns undefined if
 * the DisplayTemplate doesn't exist or it doesn't have any tag
 *
 * @param key DisplayTemplate's key
 */
export function getDisplayTemplateTag(key: string): string | undefined {
  return getDisplayTemplate(key)?.tag;
}

/** Get all the DisplayTemplates */
export function getAllDisplayTemplates(): DisplayTemplate[] {
  return _registry;
}

/** Get the DisplayTemplate from a tag */
export function getDisplayTemplateByTag(tag: string): DisplayTemplate[] {
  return _registry.filter((c) => c.tag === tag) as DisplayTemplate[];
}
