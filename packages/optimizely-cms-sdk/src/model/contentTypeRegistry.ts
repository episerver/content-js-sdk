import { isBaseMediaType } from '../util/baseTypeUtil';
import { AnyContentType } from './contentTypes';

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

/** Get the Component from a base type */
export function getContentTypeByBaseType(name: string): AnyContentType[] {
  return _registry.filter((c) => c.baseType === name) as AnyContentType[];
}

/** Get the Component from a content type name */
export function getAllMediaTypeKeys() {
  return _registry.filter((c) => isBaseMediaType(c.baseType)).map((c) => c.key);
}
