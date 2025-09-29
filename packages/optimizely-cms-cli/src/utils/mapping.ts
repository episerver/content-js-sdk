import { extractKeyName } from '../service/utils.js';
import { isKeyInvalid } from './validate.js';

/**
 * Normalizes the `mayContainTypes` field of a content type object.
 * - Converts each entry to a key name (string).
 * - For self-referential entries (e.g., '_self'), it uses the parent key.
 * - Validates keys against the provided `allowedKeys` set (if given), except for keys starting with '_'.
 * - Detects and throws errors for duplicate or unknown keys.
 * @param contentType - The content type object to process.
 * @param allowedKeys - Optional set of valid content type keys for validation.
 * @returns The content type object with a normalized `mayContainTypes` array.
 */
export function parseChildContentType(
  contentType: Record<string, any>,
  allowedKeys?: Set<string>
): any {
  const { mayContainTypes, key: parentKey, ...rest } = contentType;

  if (!Array.isArray(mayContainTypes)) return { ...rest, key: parentKey };

  const invalid: string[] = [];

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const normalized = mayContainTypes.map((entry: any) => {
    const key = extractKeyName(entry, parentKey);
    // Do not allow keys that start with '_' to be validated against allowedKeys
    if (!key.startsWith('_') && allowedKeys && !allowedKeys.has(key)) {
      invalid.push(key);
    }
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
    return key;
  });

  if (duplicates.length > 0) {
    throw new Error(
      `❌ [optimizely-cms-cli] Duplicate entries in mayContainTypes for content type "${
        contentType.key
      }": ${duplicates.join(', ')}`
    );
  }

  if (invalid.length > 0) {
    throw new Error(
      `❌ [optimizely-cms-cli] Invalid mayContainTypes for content type "${
        contentType.key
      }". Unknown content types: ${invalid.join(', ')}`
    );
  }

  return {
    ...rest,
    key: parentKey,
    mayContainTypes: normalized,
  };
}

/**
 * Transforms the properties of an object by applying a transformation function to each property value.
 * @param properties - An object containing key-value pairs where the values are to be transformed.
 * @param parentKey - The parent contentType key, used for context in certain transformations (when '_self' is used).
 * @returns A new object with the same keys as the input object, but with transformed values.
 */
export function transformProperties(
  properties: Record<string, any>,
  parentKey: string
): Record<string, any> {
  return Object.entries(properties).reduce((acc, [key, value]) => {
    acc[key] = transformProperty(value, parentKey);
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
 * @param parentKey - The parent contentType key, used for context in certain transformations (when '_self' is used).
 * @returns The transformed property object after applying all handlers.
 */
function transformProperty(property: any, parentKey: string): any {
  let updatedProperty = { ...property };

  updatedProperty = handleComponentType(updatedProperty);
  updatedProperty = handleEnumFormat(updatedProperty);
  updatedProperty = handleArrayType(updatedProperty);
  updatedProperty = handleContentReferenceType(updatedProperty);
  updatedProperty = mapAllowedRestrictedTypes(updatedProperty, parentKey);

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
 * Uses the provided `parentKey` for context when extracting key names when '_self' is used.
 * @param updatedValue - The schema object to transform.
 * @param parentKey - The parent contentType key, used for context in certain transformations.
 * @returns The same object, with allowed/restricted types normalized.
 */
function mapAllowedRestrictedTypes(updatedValue: any, parentKey: string) {
  // Recursively handle nested 'items' if it's an array
  if (updatedValue.type === 'array' && updatedValue.items) {
    updatedValue.items = mapAllowedRestrictedTypes(
      updatedValue.items,
      parentKey
    );
  }

  if (['contentReference', 'content'].includes(updatedValue.type)) {
    if (Array.isArray(updatedValue.allowedTypes)) {
      updatedValue.allowedTypes = updatedValue.allowedTypes.map((input: any) =>
        extractKeyName(input, parentKey)
      ) as any;
    }

    if (Array.isArray(updatedValue.restrictedTypes)) {
      updatedValue.restrictedTypes = updatedValue.restrictedTypes.map(
        (input: any) => extractKeyName(input, parentKey)
      ) as any;
    }
  }

  return updatedValue;
}
