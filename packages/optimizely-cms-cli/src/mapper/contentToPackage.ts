import {
  AnyContentType,
  extractKeyName,
  isValidArrayWithItems,
} from '../service/utils.js';

export function mapContentToManifest(contentTypes: AnyContentType[]): any[] {
  return contentTypes.map((contentType) => {
    // Spread the contentType as extract properties
    const { properties = {} } = contentType;

    // Transform properties via a single reduce
    const formattedProperties = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        const updatedValue = { ...value };

        // If type is "richText", we switch type to "string" and "format" to "html"
        if (updatedValue.type === 'richText') {
          (updatedValue.type as any) = 'string'; //
          updatedValue.format = 'html';
        }

        // If "enum" exists, set format to "selectOne"
        if (Object.hasOwn(updatedValue, 'enum')) {
          updatedValue.format = 'selectOne';
        }

        // If type "array" and property "items" exists, update "allowedTypes" and "restrictedTypes"
        if (isValidArrayWithItems(updatedValue)) {
          const { allowedTypes, restrictedTypes } = updatedValue.items;

          if (allowedTypes) {
            updatedValue.items.allowedTypes = allowedTypes.map(
              extractKeyName
            ) as any;
          }

          if (restrictedTypes) {
            updatedValue.items.restrictedTypes = restrictedTypes.map(
              extractKeyName
            ) as any;
          }
        }

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
