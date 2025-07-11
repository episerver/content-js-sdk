import { AnyContentType } from '../service/utils.js';
import {
  transformProperties,
  validateContentTypeKey,
} from '../utils/mapping.js';

/**
 * Transforms a content type object to a manifest format.
 * Validates the content type key and formats its properties.
 * @param contentType - The content type object to transform.
 * @returns
 */
function transformContentType(contentType: AnyContentType): any {
  validateContentTypeKey(contentType.key);

  const { properties = {} } = contentType;
  const formattedProperties = transformProperties(properties);

  return {
    ...contentType,
    properties: formattedProperties,
  };
}

/**
 * Maps an array of content types to a manifest format.
 * @param contentTypes - Array of content types to transform.
 * @returns An array of transformed content types.
 */
export function mapContentToManifest(contentTypes: AnyContentType[]): any[] {
  return contentTypes.map(transformContentType);
}
