/**
 * This module contains the TypeScript definitions of a Graph Query
 * and functions to build those filters based on path,
 * preview parameters, etc.
 *
 * This is used internally in the SDK
 */

/**
 * Normalizes a host value for matching against `_metadata.url.base` in
 * Optimizely Graph, which stores base URLs **with scheme**
 * (e.g., `"https://www.example.com"`).
 *
 * - Bare hostnames get `https://` prepended (`"example.com"` → `"https://example.com"`)
 * - Existing schemes are preserved (`"http://localhost:3000"` stays as-is)
 * - Trailing slashes are stripped
 * - The result is lowercased
 *
 * @param host - The host value to normalize. Accepts bare hostnames
 *   (`"www.example.com"`), full URLs (`"https://www.example.com/"`), or any
 *   scheme/case/slash variation. **Do not** pass the platform's internal
 *   hostname (e.g., `app-xxxxx.cms.optimizely.com`) — use your site's public
 *   hostname instead.
 * @returns The normalized host with scheme, or `undefined` if empty.
 */
export function normalizeHost(host?: string): string | undefined {
  if (!host) return undefined;

  const trimmed = host.trim();
  if (!trimmed) return undefined;

  let normalized = trimmed.toLowerCase();
  normalized = normalized.replace(/\/+$/, '');

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

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

export type VariationMode = 'none' | 'all' | { count: number };

export function pathScalarFilter(path: string, host?: string): ScalarFilter {
  const { pathWithTrailingSlash, pathWithoutTrailingSlash } = normalizePath(path);
  const normalized = normalizeHost(host);
  return {
    filterShape: 'by-path',
    variables: {
      path: pathWithTrailingSlash,
      pathNoSlash: pathWithoutTrailingSlash,
      ...(normalized ? { host: normalized } : {}),
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
      ...(reference.locale ? { metadataLocale: reference.locale } : {}),
    },
  };
}

export function getVariationMode(variation?: GraphVariationInput): VariationMode {
  if (!variation || variation.include === 'NONE') return 'none';
  if (variation.include === 'ALL') return 'all';
  return { count: variation.value.length };
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

const PATH_WHERE = `where: { _or: [{ _metadata: { url: { base: { eq: $host }, default: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, default: { eq: $pathNoSlash } } } }, { _metadata: { url: { base: { eq: $host }, hierarchical: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, hierarchical: { eq: $pathNoSlash } } } }] }`;

export function getFilterVarDecls(shape: FilterShape): string {
  switch (shape) {
    case 'by-key': return '$key: String, $version: String, $metadataLocale: String';
    case 'by-path': return '$host: String, $path: String, $pathNoSlash: String';
  }
}

export function getFilterWhereClause(shape: FilterShape): string {
  switch (shape) {
    case 'by-key':
      return 'where: { _metadata: { key: { eq: $key }, version: { eq: $version }, locale: { eq: $metadataLocale } } }';
    case 'by-path':
      return PATH_WHERE;
  }
}

export function getVariationVarDecls(mode: VariationMode): string {
  if (mode === 'none' || mode === 'all') return '';
  return Array.from({ length: mode.count }, (_, i) => `$v${i + 1}: String`).join(', ');
}

export function getVariationClause(mode: VariationMode): string {
  if (mode === 'none') return '';
  if (mode === 'all') return ', variation: { include: ALL }';
  const values = Array.from({ length: mode.count }, (_, i) => `$v${i + 1}`).join(', ');
  return `, variation: { include: SOME, value: [${values}] }`;
}

