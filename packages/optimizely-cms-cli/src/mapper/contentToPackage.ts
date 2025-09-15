import { AnyContentType } from '../service/utils.js';
import {
  transformProperties,
  validateContentTypeKey,
  parseChildContentType,
} from '../utils/mapping.js';

/**
 * Transforms a content type object to a manifest format.
 * Validates the content type key and formats its properties.
 * @param contentType - The content type object to transform.
 * @param allowedKeys - Set of valid content type keys for validation.
 * @returns
 */
function transformContentType(
  contentType: AnyContentType,
  allowedKeys?: Set<string>
): any {
  validateContentTypeKey(contentType.key);

  const { key, properties = {} } = contentType;
  const parsedContentType = parseChildContentType(contentType, allowedKeys);
  const formattedProperties = transformProperties(properties, key);

  return {
    ...parsedContentType,
    properties: formattedProperties,
  };
}

/**
 * Maps an array of content types to a manifest format.
 * Validates string entries in mayContainTypes against known content type keys.
 * @param contentTypes - Array of content types to transform.
 * @returns An array of transformed content types.
 */
export function mapContentToManifest(contentTypes: AnyContentType[]): any[] {
  const allowedKeys = new Set(contentTypes.map((ct) => ct.key));
  return contentTypes.map((ct) => transformContentType(ct, allowedKeys));
}
