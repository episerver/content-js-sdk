/**
 * This module contains the TypeScript definitions of a Graph Query
 * and functions to build those filters based on path,
 * preview parameters, etc.
 *
 * This is used internally in the SDK
 */

/** Returns two versions of the same path. One with trailing slash and one without it */
function normalizePath(path: string) {
  if (path.endsWith('/')) {
    return {
      pathWithTrailingSlash: path,
      pathWithoutTrailingSlash: path.slice(0, -1),
    };
  } else {
    return {
      pathWithTrailingSlash: path + '/',
      pathWithoutTrailingSlash: path,
    };
  }
}

export type GraphVariationInput =
  | { include: 'NONE' }
  | { include: 'ALL' }
  | {
      include: 'SOME';
      value: string[];
      includeOriginal?: boolean;
    };

// --- Scalar filter types for query caching ---

export type FilterShape = 'by-key' | 'by-path';

export type ScalarFilter = {
  filterShape: FilterShape;
  variables: Record<string, string | string[] | undefined>;
};

export type VariationMode =
  | 'none'
  | 'all'
  | { count: number; includeOriginal?: boolean };

export function pathScalarFilter(path: string, host?: string): ScalarFilter {
  const { pathWithTrailingSlash, pathWithoutTrailingSlash } = normalizePath(path);
  return {
    filterShape: 'by-path',
    variables: {
      path: pathWithTrailingSlash,
      pathNoSlash: pathWithoutTrailingSlash,
      ...(host ? { host } : {}),
    },
  };
}

export function previewScalarFilter(params: {
  key: string;
  ver: string;
  loc: string;
}): ScalarFilter {
  return {
    filterShape: 'by-key',
    variables: {
      key: params.key,
      version: params.ver,
      metadataLocale: params.loc,
    },
  };
}

/**
 * Converts a BCP-47 locale to the `Locales` enum's identifier syntax, in the
 * casing the enum uses: `en-BE` and `en-be` both become `en_BE`.
 *
 * A tag without subtags is left alone, so `ALL` and `NEUTRAL` survive.
 */
export function toLocaleEnumValues(locales?: string[]): string[] | undefined {
  return locales?.map(locale =>
    locale.includes('-') ? canonicalLocale(locale).replace(/-/g, '_') : locale,
  );
}

/** A locale in its canonical BCP-47 casing, or unchanged if it is not a valid tag. */
function canonicalLocale(locale: string): string {
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return locale;
  }
}

/**
 * The filter identifying one content item by key.
 *
 * The locale goes to the `locale:` field argument, not to a `_metadata.locale`
 * predicate, which would exclude language fallbacks.
 */
export function referenceScalarFilter(reference: {
  key: string;
  locale?: string;
  version?: string;
}): ScalarFilter {
  return {
    filterShape: 'by-key',
    variables: {
      key: reference.key,
      ...(reference.version ? { version: reference.version } : {}),
      ...(reference.locale ? { locale: toLocaleEnumValues([reference.locale]) } : {}),
    },
  };
}

export function getVariationMode(variation?: GraphVariationInput): VariationMode {
  if (!variation || variation.include === 'NONE') return 'none';
  if (variation.include === 'ALL') return 'all';
  return { count: variation.value.length, includeOriginal: variation.includeOriginal };
}

export function getVariationVariables(
  variation?: GraphVariationInput,
): Record<string, string> {
  if (!variation || variation.include !== 'SOME') return {};
  const vars: Record<string, string> = {};
  for (let i = 0; i < variation.value.length; i++) {
    vars[`v${i + 1}`] = variation.value[i];
  }
  return vars;
}

const FILTER_PREDICATES: Record<FilterShape, string> = {
  'by-key': `{ _metadata: { key: { eq: $key }, version: { eq: $version }, locale: { eq: $metadataLocale } } }`,
  'by-path': `{ _or: [{ _metadata: { url: { base: { eq: $host }, default: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, default: { eq: $pathNoSlash } } } }, { _metadata: { url: { base: { eq: $host }, hierarchical: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, hierarchical: { eq: $pathNoSlash } } } }] }`,
};

/** Live content, as opposed to a draft or a version that has been superseded. */
const PUBLISHED_PREDICATE = `{ _metadata: { status: { eq: "Published" } } }`;

export function getFilterVarDecls(shape: FilterShape): string {
  switch (shape) {
    case 'by-key':
      return '$key: String, $version: String, $metadataLocale: String, $locale: [Locales]';
    case 'by-path':
      return '$host: String, $path: String, $pathNoSlash: String, $locale: [Locales]';
  }
}

/**
 * The `locale:` field argument, which resolves language fallback. Always
 * emitted: a null `$locale` means "any locale", so one query template covers
 * both the localized and the locale-agnostic lookup.
 */
export const LOCALE_CLAUSE = ', locale: $locale';

/**
 * The `where` argument identifying the content a query is about.
 *
 * @param publishedOnly - Narrow to content whose `_metadata.status` is `Published`.
 * @param extra - Further predicates to combine with the identity filter.
 */
export function getFilterWhereClause(
  shape: FilterShape,
  publishedOnly = false,
  extra: string[] = [],
): string {
  const predicates = [
    FILTER_PREDICATES[shape],
    ...(publishedOnly ? [PUBLISHED_PREDICATE] : []),
    ...extra,
  ];

  // Kept unwrapped in the common case so the generated query text does not change
  // for anyone who is not filtering.
  return predicates.length === 1 ?
      `where: ${predicates[0]}`
    : `where: { _and: [${predicates.join(', ')}] }`;
}

export function getVariationVarDecls(mode: VariationMode): string {
  if (mode === 'none' || mode === 'all') return '';
  return Array.from({ length: mode.count }, (_, i) => `$v${i + 1}: String`).join(', ');
}

export function getVariationClause(mode: VariationMode): string {
  if (mode === 'none') return '';
  if (mode === 'all') return ', variation: { include: ALL }';
  const values = Array.from({ length: mode.count }, (_, i) => `$v${i + 1}`).join(', ');
  const original = mode.includeOriginal ? ', includeOriginal: true' : '';
  return `, variation: { include: SOME, value: [${values}]${original} }`;
}
