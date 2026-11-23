import { createHash } from 'node:crypto';
import { isObject } from './general.js';

/** Manifest sections whose items are tracked individually */
export type ManifestSection = 'contentTypes' | 'displayTemplates' | 'propertyGroups';

type Item = Record<string, unknown>;

const READ_ONLY_FIELDS = ['source', 'created', 'createdBy', 'lastModified', 'lastModifiedBy'];

// values GET /manifest returns for fields the config left out (probed 2026-11)
const CONTENT_TYPE_DEFAULTS: Item = {
  isContract: false,
  sortOrder: 0,
  properties: {},
  mayContainTypes: [],
  mediaFileExtensions: [],
  compositionBehaviors: [],
  contracts: [],
};
const CONTRACT_DEFAULTS: Item = { ...CONTENT_TYPE_DEFAULTS, mayContainTypes: ['*'] };
const PROPERTY_DEFAULTS: Item = {
  isLocalized: false,
  isRequired: false,
  group: 'Content',
  sortOrder: 0,
  allowedTypes: [],
  restrictedTypes: [],
};
const RICH_TEXT_DEFAULTS: Item = { ...PROPERTY_DEFAULTS, editorSettings: { preset: 'expanded' } };
const ARRAY_ITEMS_DEFAULTS: Item = { allowedTypes: [], restrictedTypes: [] };
const DISPLAY_TEMPLATE_DEFAULTS: Item = { isDefault: false, settings: {} };

const sortKeys = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(sortKeys)
  : isObject(value) ?
    Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, sortKeys(value[key])]),
    )
  : value;

const isEqual = (a: unknown, b: unknown) =>
  JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

const isDefault = (defaults: Item, key: string, value: unknown) =>
  key in defaults && isEqual(value, defaults[key]);

const withoutServerFields = (item: Item): Item =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([key, value]) => value != null && !READ_ONLY_FIELDS.includes(key),
    ),
  );

// a field that is missing, null or equal to its default reads the same on both sides
const withoutDefaults = (item: Item, defaults: Item): Item =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([key, value]) => value != null && !isDefault(defaults, key, value),
    ),
  );

const mapValues = (item: Item, mapper: (value: Item) => Item): Item =>
  Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, isObject(value) ? mapper(value) : value]),
  );

const normalizeProperty = (property: Item): Item => {
  const normalized = withoutDefaults(
    property,
    property.type === 'richText' ? RICH_TEXT_DEFAULTS : PROPERTY_DEFAULTS,
  );

  return isObject(normalized.items) ?
      { ...normalized, items: withoutDefaults(normalized.items, ARRAY_ITEMS_DEFAULTS) }
    : normalized;
};

const normalizeContentType = (contentType: Item): Item => {
  const normalized = withoutDefaults(
    contentType,
    contentType.isContract === true ? CONTRACT_DEFAULTS : CONTENT_TYPE_DEFAULTS,
  );

  return isObject(normalized.properties) ?
      { ...normalized, properties: mapValues(normalized.properties, normalizeProperty) }
    : normalized;
};

// property groups have no defaults: the local mapper always sends every field
const NORMALIZERS: Partial<Record<ManifestSection, (item: Item) => Item>> = {
  contentTypes: normalizeContentType,
  displayTemplates: item => withoutDefaults(item, DISPLAY_TEMPLATE_DEFAULTS),
};

const identity = (item: Item) => item;

/**
 * Brings a local or server manifest item to one comparable shape: read-only fields,
 * nulls and server defaults removed, keys sorted.
 */
export const normalizeItem = (section: ManifestSection, item: Item): Item => {
  const removeDefaults = NORMALIZERS[section] ?? identity;

  return sortKeys(removeDefaults(withoutServerFields(item))) as Item;
};

/** Hashes the normalised item, so a local item and its server copy hash equally when in sync. */
export const hashItem = (section: ManifestSection, item: Item): string =>
  createHash('sha256')
    .update(JSON.stringify(normalizeItem(section, item)))
    .digest('hex');
