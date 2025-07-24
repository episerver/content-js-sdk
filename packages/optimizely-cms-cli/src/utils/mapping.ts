import { AnyContentType, extractKeyName } from '../service/utils.js';
import { isKeyInvalid } from './validate.js';

/**
 * Parses the content type object to extract relevant information.
 * It processes the `mayContainTypes` field to ensure it is an array of key names.
 * @param contentType - The content type object to parse.
 * @returns A simplified representation of the content type.
 */
export function parseChildContentType(contentType: AnyContentType): any {
  const { mayContainTypes, ...rest } = contentType;
  return {
    ...rest,
    mayContainTypes: Array.isArray(mayContainTypes)
      ? mayContainTypes.map(extractKeyName)
      : [],
  };
}

/**
 * Transforms the properties of an object by applying a transformation function to each property value.
 * @param properties - An object containing key-value pairs where the values are to be transformed.
 * @returns A new object with the same keys as the input object, but with transformed values.
 */
export function transformProperties(
  properties: Record<string, any>
): Record<string, any> {
  return Object.entries(properties).reduce((acc, [key, value]) => {
    acc[key] = transformProperty(value);
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Transforms a given property by applying a series of handlers to update its structure and format.
 *
 * The transformation process includes:
 * - Handling component types.
 * - Handling enum formats.
 * - Handling array types.
 * - Handling contentReference types.
 * - Mapping allowed and restricted types.
 *
 * @param property - The property object to be transformed.
 * @returns The transformed property object after applying all handlers.
 */
function transformProperty(property: any): any {
  let updatedProperty = { ...property };

  updatedProperty = handleComponentType(updatedProperty);
  updatedProperty = handleEnumFormat(updatedProperty);
  updatedProperty = handleArrayType(updatedProperty);
  updatedProperty = handleContentReferenceType(updatedProperty);
  updatedProperty = mapAllowedRestrictedTypes(updatedProperty);

  return updatedProperty;
}

/**
 * Validates the content type key to ensure it meets the required format.
 * Throws an error if the key is invalid.
 *
 * @param key - The content type key to validate.
 * @throws {Error} If the key is invalid.
 */
export function validateContentTypeKey(key: string): void {
  if (isKeyInvalid(key)) {
    throw new Error(
      `❌ [optimizely-cms-cli] Invalid content type key: "${key}". Keys must be alphanumeric and cannot start with a special character or number.`
    );
  }
}

/**
 * Updates a property object by replacing its `contentType` with its `key` if the type is `component`.
 * Returns the original property if no changes are needed.
 *
 * @param property - The property object to process.
 * @returns The updated property object or the original property.
 */
function handleComponentType(property: any): any {
  if (property.type === 'component' && property.contentType?.key) {
    return {
      ...property,
      contentType: property.contentType.key,
    };
  }
  return property;
}

/**
 * Handles the enum format for properties.
 * If the property has an 'enum' field, it sets the format to 'selectOne'.
 * @param property - The property to check and transform.
 * @returns The transformed property with 'format' set to 'selectOne' if applicable.
 */
function handleEnumFormat(property: any): any {
  if (Object.hasOwn(property, 'enum')) {
    return {
      ...property,
      format: 'selectOne',
    };
  }
  return property;
}

/**
 * Handles the array type properties.
 * If the property is of type 'array', it checks the items type and transforms accordingly.
 * @param property - The property to check and transform.
 * @returns The transformed property with appropriate format or contentType.
 */
function handleArrayType(property: any): any {
  if (property.type !== 'array' || !property.items) {
    return property;
  }

  const updatedProperty = { ...property };

  if (property.items.type === 'link') {
    updatedProperty.format = 'LinkCollection';
  } else if (
    property.items.type === 'component' &&
    property.items.contentType?.key
  ) {
    updatedProperty.items = {
      ...property.items,
      contentType: property.items.contentType.key,
    };
  } else if (property.items.type === 'contentReference') {
    updatedProperty.items = transformContentReference(property.items);
  }

  return updatedProperty;
}

/**
 * Handles the content reference type properties.
 * If the property is of type 'contentReference', it transforms the contentType to its key.
 * @param property - The property to check and transform.
 * @returns The transformed property with contentType as a key if applicable.
 */
function handleContentReferenceType(property: any): any {
  if (property.type === 'contentReference') {
    return transformContentReference(property);
  }
  return property;
}

/**
 * Transforms a content reference object to a manifest format.
 * @param reference - The content reference object to transform.
 * @returns The updated property object or the original property.
 */
function transformContentReference(reference: any): any {
  if (hasContentTypeWithKey(reference)) {
    return {
      ...reference,
      contentType: reference.contentType.key,
    };
  }
  return reference;
}

/**
 * Checks if the object has a contentType with a key.
 * @param obj - The object to check.
 * @returns boolean - True if the object has a contentType with a key, false otherwise.
 */
function hasContentTypeWithKey(obj: any): boolean {
  return (
    'contentType' in obj &&
    typeof obj.contentType === 'object' &&
    obj.contentType !== null &&
    'key' in obj.contentType
  );
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
