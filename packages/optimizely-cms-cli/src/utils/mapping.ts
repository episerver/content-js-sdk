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
    if (Array.isArray(value.allowedTypes)) {
      const mappedTypes = value.allowedTypes
        .map((input: any) => extractKeyName(input, parentKey))
        .filter((key: string) => key !== '*');
      if (mappedTypes.length > 0) {
        value.allowedTypes = mappedTypes;
      } else {
        delete value.allowedTypes;
      }
    }

    if (Array.isArray(value.restrictedTypes)) {
      const mappedTypes = value.restrictedTypes
        .map((input: any) => extractKeyName(input, parentKey))
        .filter((key: string) => key !== '*');
      if (mappedTypes.length > 0) {
        value.restrictedTypes = mappedTypes;
      } else {
        delete value.restrictedTypes;
      }
    }
  }

  return value;
};

/**
 * Validates `content` and `contentReference` properties (including array items).
 *
 * Every such property must declare exactly one form of type constraint: either
 * `contentType`, or a non-empty `allowedTypes`/`restrictedTypes`. Declaring both is a
 * conflict, declaring neither leaves the property unbounded and causes excessive GraphQL
 * fragment generation at runtime.
 */
export const validateContentAreaConstraints = (
  contentTypes: ContentTypes.AnyContentType[],
): { errors: string[] } => {
  const errors: string[] = [];

  for (const ct of contentTypes) {
    if (!ct.properties) continue;

    for (const [propName, prop] of Object.entries(ct.properties)) {
      // an array delegates its constraints to `items`
      const target: any = prop.type === 'array' ? (prop as any).items : prop;
      if (!target || !['content', 'contentReference'].includes(target.type)) continue;

      const location = `Content type "${ct.key}", property "${propName}" (${target.type})`;
      const hasConstraints = hasTypeConstraints(target);
      const emptyLists = ['allowedTypes', 'restrictedTypes'].filter(
        name => Array.isArray(target[name]) && target[name].length === 0,
      );

      if (emptyLists.length > 0) {
        errors.push(
          `${location}: empty type constraints. ` +
            `${emptyLists.map(name => `"${name}"`).join(' and ')} must list at least one content type, or be removed.`,
        );
      } else if (target.contentType && hasConstraints) {
        errors.push(
          `${location}: conflicting type constraints. ` +
            `"contentType" cannot be combined with "allowedTypes" or "restrictedTypes", declare only one of them.`,
        );
      } else if (!target.contentType && !hasConstraints) {
        errors.push(
          `${location}: missing type constraints. ` +
            `Declare "contentType", or "allowedTypes"/"restrictedTypes", to define which content types are permitted.`,
        );
      }
    }
  }

  return { errors };
};

const hasTypeConstraints = (prop: any): boolean =>
  (Array.isArray(prop.allowedTypes) && prop.allowedTypes.length > 0) ||
  (Array.isArray(prop.restrictedTypes) && prop.restrictedTypes.length > 0);

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
