import { createHash } from 'node:crypto';
import { isObject } from './general.js';

/** Manifest sections whose items are tracked individually */
export type ManifestSection = 'contentTypes' | 'displayTemplates' | 'propertyGroups';

type Item = Record<string, unknown>;
type AnyManifest = Partial<Record<ManifestSection, Item[] | null>>;

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

// keys sorted and null fields dropped at every level, so equal content serialises equally
const canonical = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(canonical)
  : isObject(value) ?
    Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(key => value[key] != null)
        .map(key => [key, canonical(value[key])]),
    )
  : value;

const isEqual = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const digest = (text: string) => createHash('sha256').update(text).digest('hex');

const withoutReadOnlyFields = (item: Item): Item =>
  Object.fromEntries(Object.entries(item).filter(([key]) => !READ_ONLY_FIELDS.includes(key)));

const withoutDefaults = (item: Item, defaults: Item): Item =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([key, value]) => !(key in defaults && isEqual(value, defaults[key])),
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

const NORMALIZERS: Record<ManifestSection, (item: Item) => Item> = {
  contentTypes: normalizeContentType,
  displayTemplates: item => withoutDefaults(item, DISPLAY_TEMPLATE_DEFAULTS),
  // the local mapper always sends every property group field
  propertyGroups: item => item,
};

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

/** Maps every item of a manifest, keyed by item id. */
export const mapItemsById = <T extends { key?: unknown }, R>(
  manifest: Partial<Record<ManifestSection, T[] | null>>,
  mapper: (item: T, section: ManifestSection) => R,
): Record<string, R> =>
  Object.fromEntries(
    SECTIONS.flatMap(section =>
      (manifest[section] ?? []).map(item => [itemId(section, item.key), mapper(item, section)]),
    ),
  );

/**
 * Brings a local or server manifest item to one comparable shape: read-only fields,
 * nulls and server defaults removed, keys sorted.
 */
export const normalizeItem = (section: ManifestSection, item: Item): Item =>
  canonical(NORMALIZERS[section](withoutReadOnlyFields(item))) as Item;

/** Normalises every item of a local or server manifest, keyed by item id. */
export const normalizeManifest = (manifest: AnyManifest): Record<string, Item> =>
  mapItemsById(manifest, (item, section) => normalizeItem(section, item));

/** Hashes any JSON value independently of key order. */
export const hashValue = (value: unknown): string =>
  digest(JSON.stringify(canonical(value)) ?? '');

/** Hashes the normalised item, so a local item and its server copy hash equally when in sync. */
export const hashItem = (section: ManifestSection, item: Item): string =>
  digest(JSON.stringify(normalizeItem(section, item)));

/** Hashes items that are already normalised, keyed like the input. */
export const hashItems = (items: Record<string, Item>): Record<string, string> =>
  Object.fromEntries(Object.entries(items).map(([id, item]) => [id, digest(JSON.stringify(item))]));

/** Hashes every item of a local or server manifest, keyed by item id. */
export const hashManifest = (manifest: AnyManifest): Record<string, string> =>
  hashItems(normalizeManifest(manifest));

/** Hashes the global settings synced outside the manifest. */
export const hashSettings = ({
  applications,
  content,
  locale,
}: {
  applications: unknown;
  content: unknown;
  locale: unknown;
}) => ({ applications: hashValue({ applications, content }), locales: hashValue(locale) });

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
): T => {
  const wanted = new Set(ids);

  return {
    ...manifest,
    ...Object.fromEntries(
      SECTIONS.map(section => [
        section,
        manifest[section].filter(item => wanted.has(itemId(section, item.key))),
      ]),
    ),
  };
};
