import { createHash } from 'node:crypto';
import { isObject } from './general.js';

/** Manifest sections whose items are tracked individually */
export type ManifestSection = 'contentTypes' | 'displayTemplates' | 'propertyGroups';

type Item = Record<string, unknown>;

/** Every manifest section, in upload order */
export const SECTIONS: ManifestSection[] = ['contentTypes', 'displayTemplates', 'propertyGroups'];

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

/** Hashes any JSON value independently of key order. */
export const hashValue = (value: unknown): string =>
  createHash('sha256')
    .update(JSON.stringify(sortKeys(value)) ?? '')
    .digest('hex');

/** Hashes the normalised item, so a local item and its server copy hash equally when in sync. */
export const hashItem = (section: ManifestSection, item: Item): string =>
  hashValue(normalizeItem(section, item));

/** Identifies a manifest item across sections, e.g. `contentTypes:Hero` */
export const itemId = (section: ManifestSection, key: unknown) => `${section}:${key}`;

/** Splits an item id back into its section and key. */
export const parseItemId = (id: string) => {
  const separator = id.indexOf(':');

  return {
    section: id.slice(0, separator) as ManifestSection,
    key: id.slice(separator + 1),
  };
};

type AnyManifest = Partial<Record<ManifestSection, Item[] | null>>;

/** Normalises every item of a local or server manifest, keyed by item id. */
export const normalizeManifest = (manifest: AnyManifest): Record<string, Item> =>
  Object.fromEntries(
    SECTIONS.flatMap(section =>
      (manifest[section] ?? []).map(item => [
        itemId(section, item.key),
        normalizeItem(section, item),
      ]),
    ),
  );

/** Hashes every item of a local or server manifest, keyed by item id. */
export const hashManifest = (manifest: AnyManifest): Record<string, string> =>
  Object.fromEntries(
    Object.entries(normalizeManifest(manifest)).map(([id, item]) => [id, hashValue(item)]),
  );

/** A field whose value differs between a local item and its server copy */
export type FieldDifference = { path: string; local: unknown; server: unknown };

/** Lists the fields that differ between two normalised items, by dotted path. */
export const diffItems = (local: unknown, server: unknown, path = ''): FieldDifference[] =>
  isObject(local) && isObject(server) ?
    [...new Set([...Object.keys(local), ...Object.keys(server)])]
      .sort()
      .flatMap(key => diffItems(local[key], server[key], path ? `${path}.${key}` : key))
  : isEqual(local, server) ? []
  : [{ path, local, server }];

/** Keeps only the manifest items with the given ids. */
export const pickItems = <T extends Record<ManifestSection, { key?: string }[]>>(
  manifest: T,
  ids: string[],
): T => ({
  ...manifest,
  ...Object.fromEntries(
    SECTIONS.map(section => [
      section,
      manifest[section].filter(item => ids.includes(itemId(section, item.key))),
    ]),
  ),
});
