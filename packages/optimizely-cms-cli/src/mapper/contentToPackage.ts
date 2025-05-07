import {
  AllowedOrRestrictedType,
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

        // If type "array", "content", "contentReference", update "allowedTypes" and "restrictedTypes"
        if (isValidArrayWithItems(updatedValue)) {
          const value = updatedValue as AllowedOrRestrictedType;

          // Normalize possible locations of the "allowedTypes" and "restrictedTypes" types
          const targets = [value.items, value];

          for (const target of targets) {
            if (!target || typeof target !== 'object') continue;

            if (Array.isArray(target.allowedTypes)) {
              target.allowedTypes = target.allowedTypes.map(
                extractKeyName
              ) as any;
            }

            if (Array.isArray(target.restrictedTypes)) {
              target.restrictedTypes = target.restrictedTypes.map(
                extractKeyName
              ) as any;
            }
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
