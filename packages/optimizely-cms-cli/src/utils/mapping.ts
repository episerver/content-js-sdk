import { ManifestContentType } from './manifest.js';
import { extractKeyName } from '../service/utils.js';
import { isKeyInvalid } from './validate.js';
import { ContentTypes, Properties } from '@optimizely/cms-sdk';

/**
 * Normalizes the `mayContainTypes` field of a content type object.
 */
const CONTAINER_BASE_TYPES = ['_page', '_experience', '_folder', '_component'];

export const normalizeMayContainTypes = (
  contentType: Record<string, any>,
  allowedKeys?: Set<string>,
): any => {
  const { mayContainTypes, key, ...rest } = contentType;

  if (!Array.isArray(mayContainTypes)) {
    if (CONTAINER_BASE_TYPES.includes(contentType.baseType))
      return { ...rest, key, mayContainTypes: ['*'] };
    return { ...rest, key };
  }

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
  ['component', 'content'].includes(property.type) && property.contentType?.key ?
    { ...property, contentType: property.contentType.key }
  : property;

const handleArrayType = (property: any): any => {
  if (property.type !== 'array' || !property.items) return property;

  const itemType = property.items.type;

  if (itemType === 'link') return { ...property, format: 'LinkCollection' };

  if (['component', 'content'].includes(itemType) && property.items.contentType?.key)
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

/**
 * Rewrites `allowedTypes`/`restrictedTypes` in place to the keys the API takes.
 * A wildcard is dropped, and a list left empty by that is removed: the API
 * expresses "anything" as no list at all.
 */
const flattenTypeLists = (value: any, parentKey: string): void => {
  for (const name of ['allowedTypes', 'restrictedTypes']) {
    if (!Array.isArray(value[name])) continue;

    const keys = value[name]
      .map((input: any) => extractKeyName(input, parentKey))
      .filter((key: string) => key !== '*');

    if (keys.length > 0) value[name] = keys;
    else delete value[name];
  }
};

const mapAllowedRestrictedTypes = (updatedValue: any, parentKey: string): any => {
  const value = { ...updatedValue };

  if (value.type === 'array' && value.items)
    value.items = mapAllowedRestrictedTypes(value.items, parentKey);

  if (['contentReference', 'content', 'composition'].includes(value.type))
    flattenTypeLists(value, parentKey);

  return value;
};

/**
 * Maps the built-in composition configuration of an `_experience` or `_section`
 * to the API shape. It is not a property — the CMS reserves the key
 * `composition` — so it travels beside `properties` on the content type.
 */
export const transformCompositionConfiguration = (
  composition: any,
  parentKey: string,
): any => {
  const value = { ...composition };
  flattenTypeLists(value, parentKey);
  return value;
};

/**
 * Validates `content` and `contentReference` properties (including array items).
 *
 * Every such property must declare exactly one form of type constraint: either
 * `contentType`, or a non-empty `allowedTypes`/`restrictedTypes`. Declaring both is a
 * conflict, declaring neither leaves the property unbounded and causes excessive GraphQL
 * fragment generation at runtime.
 *
 * Also validates `format`: a `composition` property must declare one of
 * `COMPOSITION_FORMATS`, and those values are reserved — no other property type may use
 * them, though other types remain free to use any other format.
 */
export const validateContentAreaConstraints = (
  contentTypes: ContentTypes.AnyContentType[],
): { errors: string[] } => {
  const errors: string[] = [];
  const byKey = new Map(contentTypes.map(ct => [ct.key, ct as any]));

  for (const ct of contentTypes) {
    const builtIn = (ct as any).composition;
    if (builtIn?.format !== undefined && !isKnownFormat(builtIn.format)) {
      errors.push(
        `Content type "${ct.key}", built-in composition: invalid "format" ` +
          `"${builtIn.format}". Must be ${formatList()}.`,
      );
    }
    if (builtIn) {
      checkAllowedTypeFormats(
        builtIn,
        `Content type "${ct.key}", built-in composition`,
        byKey,
        errors,
      );
    }

    if (!ct.properties) continue;

    for (const [propName, prop] of Object.entries(ct.properties)) {
      // an array delegates its constraints to `items`
      const target: any = prop.type === 'array' ? (prop as any).items : prop;
      if (!target) continue;

      const location = `Content type "${ct.key}", property "${propName}" (${target.type})`;
      const formats = formatList();

      // `format` is mandatory on a composition. TypeScript enforces this already, so the
      // check is here for plain JS configs and casts.
      if (target.type === 'composition') {
        const baseType = (ct as any).baseType;
        const isReservedKey = propName === 'composition';

        // A `sectionEnabled` component models the canvas it inherits under the
        // reserved key, and the CMS accepts that one case.
        const inheritedOnComponent =
          baseType === '_component' &&
          isReservedKey &&
          ((ct as any).compositionBehaviors ?? []).includes('sectionEnabled');

        if (baseType !== '_experience' && !inheritedOnComponent) {
          errors.push(
            `${location}: a composition property is only supported on an ` +
              `"_experience" content type, not "${baseType}". Use a content area ` +
              `("type": "array" of "type": "content") instead, or — on a ` +
              `"sectionEnabled" component — the reserved key "composition" to ` +
              `model the one it inherits.`,
          );
        }

        // An experience already has a built-in composition under that key
        if (isReservedKey && !inheritedOnComponent) {
          errors.push(
            `Content type "${ct.key}": the property name "composition" is reserved ` +
              `for the built-in composition. Give the property another key, or ` +
              `configure the built-in one with "composition" beside "properties".`,
          );
        }

        // There is no array of compositions in the CMS
        if (prop.type === 'array') {
          errors.push(
            `${location}: a composition cannot be an array item. Declare ` +
              `"type": "composition" on the property itself.`,
          );
        }

        if (target.format === undefined) {
          errors.push(`${location}: missing "format". Declare ${formats}.`);
        } else if (!isKnownFormat(target.format)) {
          errors.push(`${location}: invalid "format" "${target.format}". Must be ${formats}.`);
        }
        checkAllowedTypeFormats(target, location, byKey, errors);
        continue;
      }

      // The composition formats are reserved. Any other property type may carry a
      // `format`, just not one of these. TypeScript cannot catch this: `format` is typed
      // `string` on the base property, so the literal is widened away before inference.
      if (isKnownFormat(target.format)) {
        errors.push(
          `${location}: "format" "${target.format}" is reserved for composition properties. ` +
            `Use "type": "composition", or choose a different format.`,
        );
      }

      if (!['content', 'contentReference'].includes(target.type)) continue;

      const hasConstraints = hasTypeConstraints(target);
      const emptyLists = ['allowedTypes', 'restrictedTypes'].filter(
        name => Array.isArray(target[name]) && target[name].length === 0,
      );

      // empty lists dropped only when unconstrained otherwise
      if (emptyLists.length > 0 && !hasConstraints) {
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

/**
 * Which layouts a type may appear in, because the two hold different things: a
 * `grid` is rows and columns of elements, an `outline` a flat list of sections.
 *
 * `undefined` means the type is not in this configuration — an external or
 * not-yet-pushed key — so the CMS is left to judge it. A known type that is
 * neither an element nor a section returns an empty list: no layout can hold
 * it, which is reported rather than skipped.
 */
const permittedFormats = (
  entry: any,
  byKey: Map<string, any>,
): Properties.CompositionFormat[] | undefined => {
  const key = typeof entry === 'string' ? entry : entry?.key;
  if (typeof key !== 'string') return undefined;

  // A base type names a family rather than a content type
  if (key === '_component') return ['grid', 'outline'];
  if (key === '_section') return ['outline'];
  if (key.startsWith('_')) return undefined;

  const target = typeof entry === 'object' && 'baseType' in entry ? entry : byKey.get(key);
  if (!target) return undefined;

  if (target.baseType === '_section') return ['outline'];

  const behaviors: string[] = target.compositionBehaviors ?? [];
  const formats: Properties.CompositionFormat[] = [];
  if (behaviors.includes('elementEnabled')) formats.push('grid');
  if (behaviors.includes('sectionEnabled')) formats.push('outline');

  return formats;
};

/**
 * Reports an `allowedTypes` entry the layout cannot hold, which the CMS rejects
 * on push with `The type 'X' cannot be used in a '<format>' layout composition.`
 *
 * Only `allowedTypes` is checked: the CMS accepts a `restrictedTypes` entry
 * whatever the layout, since excluding a type that could never appear is
 * harmless.
 */
const checkAllowedTypeFormats = (
  composition: any,
  location: string,
  byKey: Map<string, any>,
  errors: string[],
): void => {
  const format = composition?.format;
  // Without a format the base type's default applies, and that is the CMS's to know
  if (!isKnownFormat(format) || !Array.isArray(composition.allowedTypes)) return;

  const other = format === 'grid' ? 'outline' : 'grid';

  for (const entry of composition.allowedTypes) {
    const formats = permittedFormats(entry, byKey);
    if (!formats || formats.includes(format)) continue;

    const key = typeof entry === 'string' ? entry : entry.key;
    const kind = format === 'grid' ? 'elements' : 'sections';

    // Usable in neither layout, so pointing at the other one would not help
    if (formats.length === 0) {
      errors.push(
        `${location}: "${key}" cannot be used in any composition. Declare ` +
          `"compositionBehaviors": ["elementEnabled"] on it to allow it in a ` +
          `"grid", or ["sectionEnabled"] to allow it in an "outline".`,
      );
      continue;
    }

    errors.push(
      `${location}: "${key}" cannot be used in a "${format}" layout composition, ` +
        `which holds ${kind}. Use "format": "${other}", or allow a type that is ` +
        `valid in a "${format}" layout.`,
    );
  }
};

const isKnownFormat = (format: unknown): boolean =>
  Properties.COMPOSITION_FORMATS.includes(format as Properties.CompositionFormat);

const formatList = (): string =>
  Properties.COMPOSITION_FORMATS.map(f => `"${f}"`).join(' or ');

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
