import { ManifestContentType } from './manifest.js';
import { extractKeyName } from '../service/utils.js';
import { isKeyInvalid } from './validate.js';
import { ContentTypes } from '@optimizely/cms-sdk';

/**
 * Normalizes the `mayContainTypes` field of a content type object.
 */
export const normalizeMayContainTypes = (
  contentType: Record<string, any>,
  allowedKeys?: Set<string>,
): any => {
  const { mayContainTypes, key, ...rest } = contentType;

  if (!Array.isArray(mayContainTypes)) return { ...rest, key };

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const invalid: string[] = [];
  const normalized: string[] = [];

  mayContainTypes.forEach((entry: any) => {
    const extractedKey = extractKeyName(entry, key);

    if (shouldValidateKey(extractedKey) && allowedKeys && !allowedKeys.has(extractedKey))
      invalid.push(extractedKey);
    if (seen.has(extractedKey)) duplicates.push(extractedKey);
    else seen.add(extractedKey);

    normalized.push(extractedKey);
  });

  if (duplicates.length > 0)
    throw new Error(
      `❌ [optimizely-cms-cli] Duplicate entries in mayContainTypes for content type "${contentType.key}": ${duplicates.join(', ')}`,
    );

  if (invalid.length > 0)
    throw new Error(
      `❌ [optimizely-cms-cli] Invalid mayContainTypes for content type "${contentType.key}". Unknown content types: ${invalid.join(', ')}`,
    );

  return {
    ...rest,
    key,
    mayContainTypes: normalized,
  };
};

const shouldValidateKey = (key: string): boolean => key !== '*' && !key.startsWith('_');

/**
 * Transforms the properties of an object by applying a transformation function to each property value.
 */
export const transformProperties = (
  properties: Record<string, any>,
  parentKey: string,
): Record<string, any> =>
  Object.entries(properties).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: transformProperty(value, parentKey),
    }),
    {} as Record<string, any>,
  );

const transformProperty = (property: any, parentKey: string): any => {
  const handlers = [
    handleComponentType,
    handleArrayType,
    handleContentReferenceType,
    (prop: any) => mapAllowedRestrictedTypes(prop, parentKey),
  ];

  return handlers.reduce((prop, handler) => handler(prop), property);
};

/**
 * Throws an error if the key is invalid.
 */
export const validateContentTypeKey = (key: string): void => {
  if (isKeyInvalid(key))
    throw new Error(
      `❌ [optimizely-cms-cli] Invalid content type key: "${key}". Keys must be alphanumeric and cannot start with a special character or number.`,
    );
};

const handleComponentType = (property: any): any =>
  property.type === 'component' && property.contentType?.key ?
    { ...property, contentType: property.contentType.key }
  : property;

const handleArrayType = (property: any): any => {
  if (property.type !== 'array' || !property.items) return property;

  const itemType = property.items.type;

  if (itemType === 'link') return { ...property, format: 'LinkCollection' };

  if (itemType === 'component' && property.items.contentType?.key)
    return {
      ...property,
      items: { ...property.items, contentType: property.items.contentType.key },
    };

  if (itemType === 'contentReference')
    return { ...property, items: transformContentReference(property.items) };

  return property;
};

const handleContentReferenceType = (property: any): any =>
  property.type === 'contentReference' ? transformContentReference(property) : property;

const transformContentReference = (reference: any): any =>
  hasContentTypeWithKey(reference) ?
    { ...reference, contentType: reference.contentType.key }
  : reference;

const hasContentTypeWithKey = (obj: any): boolean =>
  'contentType' in obj &&
  typeof obj.contentType === 'object' &&
  obj.contentType !== null &&
  'key' in obj.contentType;

const mapAllowedRestrictedTypes = (updatedValue: any, parentKey: string): any => {
  const value = { ...updatedValue };

  if (value.type === 'array' && value.items)
    value.items = mapAllowedRestrictedTypes(value.items, parentKey);

  if (['contentReference', 'content'].includes(value.type)) {
    if (Array.isArray(value.allowedTypes))
      value.allowedTypes = value.allowedTypes.map((input: any) =>
        extractKeyName(input, parentKey),
      );

    if (Array.isArray(value.restrictedTypes))
      value.restrictedTypes = value.restrictedTypes.map((input: any) =>
        extractKeyName(input, parentKey),
      );
  }

  return value;
};

const BUILTIN_TYPES = ['BlankExperience', 'BlankSection'] as const;

/**
 * Filters out built-in content types (i.e. BlankExperience and BlankSection).
 */
export const filterOutBuiltinTypes = (
  contentTypes: ManifestContentType[],
): ManifestContentType[] =>
  contentTypes.filter(contentType => !BUILTIN_TYPES.includes(contentType.key as any));

/**
 * Converts contract into manifest shape
 */
export const contractToManifest = ({
  key,
  displayName,
  properties,
}: ContentTypes.Contract): ManifestContentType => ({
  key,
  displayName,
  isContract: true,
  properties: properties ? transformProperties(properties, key) : undefined,
});
