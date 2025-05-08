import { AnyContentType, extractKeyName } from '../service/utils.js';

export function mapContentToManifest(contentTypes: AnyContentType[]): any[] {
  return contentTypes.map((contentType) => {
    // Spread the contentType as extract properties
    const { properties = {} } = contentType;

    // Transform properties via a single reduce
    const formattedProperties = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        let updatedValue = { ...value };

        if (updatedValue.type === 'component') {
          (updatedValue.contentType as any) = updatedValue.contentType.key;
        }

        // If type is "richText", we switch type to "string" and "format" to "html"
        if (updatedValue.type === 'richText') {
          (updatedValue.type as any) = 'string'; //
          updatedValue.format = 'html';
        }

        // If "enum" exists, set format to "selectOne"
        if (Object.hasOwn(updatedValue, 'enum')) {
          updatedValue.format = 'selectOne';
        }

        // If type "array", "content", "contentReference", update and normalizes its "allowedTypes" and "restrictedTypes"
        updatedValue = mapAllowedRestrictedTypes(updatedValue);

        acc[key] = updatedValue;
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      ...contentType,
      properties: formattedProperties,
    };
  });
}

/**
 * Recursively maps and normalizes `allowedTypes` and `restrictedTypes`
 * and handles nested `items` when the type is "array".
 * @param updatedValue - The schema object to transform.
 * @returns The same object, with allowed/restricted types normalized.
 */
function mapAllowedRestrictedTypes(updatedValue: any) {
  // Recursively handle nested 'items' if it's an array
  if (updatedValue.type === 'array' && updatedValue.items) {
    updatedValue.items = mapAllowedRestrictedTypes(updatedValue.items);
  }

  if (['contentReference', 'content'].includes(updatedValue.type)) {
    if (Array.isArray(updatedValue.allowedTypes)) {
      updatedValue.allowedTypes = updatedValue.allowedTypes.map(
        extractKeyName
      ) as any;
    }

    if (Array.isArray(updatedValue.restrictedTypes)) {
      updatedValue.restrictedTypes = updatedValue.restrictedTypes.map(
        extractKeyName
      ) as any;
    }
  }

  return updatedValue;
}
