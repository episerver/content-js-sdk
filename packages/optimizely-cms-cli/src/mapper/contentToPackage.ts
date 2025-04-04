import { AnyContentType } from '../service/utils.js';

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
