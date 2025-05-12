import { AnyContentType, MediaStringTypes } from './contentTypes';

let _registry: AnyContentType[] = [];

/** Initializes the content type registry */
export function init(registry: AnyContentType[]) {
  _registry = registry;
}

/** Get the Component from a content type name */
export function getContentType(name: string) {
  return _registry.find((c) => c.key === name);
}

/** Get all the content types */
export function getAllContentTypes(): AnyContentType[] {
  return _registry;
}

/** Normalize CMS baseType to SDK types */
export function normalizeBaseType(key: string): string {
  switch (key) {
    case '_Image':
      return 'image';
    case '_Media':
      return 'media';
    case '_Video':
      return 'video';
    default:
      return key;
  }
}

/** get baseType from custom item */
export function getBaseKey(key: string): string {
  switch (key) {
    case 'image':
      return ' _Image';
    case 'media':
      return ' _Media';
    case 'video':
      return ' _Video';
    default:
      return key;
  }
}

/** Get the Component from a base type */
export function getContentTypeByBaseType(
  name: MediaStringTypes
): AnyContentType[] {
  return _registry.filter(
    (c) => c.baseType === normalizeBaseType(name)
  ) as AnyContentType[];
}

/** Get the Component from a content type name */
export function getAllMediaTypeKeys() {
  return _registry
    .filter((c) => ['image', 'media', 'video'].includes(c.baseType))
    .map((c) => c.key);
}
