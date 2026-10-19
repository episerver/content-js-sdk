import type { DamMode, TaxonomyMode } from './options.js';
import type { PlatformAdapter } from './platform.js';
import { createMultipleContentQuery, createSingleContentQuery } from './createQuery.js';
import { getMetadataQuery, liftSectionNodes, removeTypePrefix } from './queries.js';

const resolveMode = (mode: DamMode | TaxonomyMode, detected: boolean): boolean =>
  mode === 'on' ? true
  : mode === 'off' ? false
  : detected;

// A copy of `saasPlatform`, not a spread of it, so SaaS changes don't reach PaaS.
/** Optimizely CMS 13 PaaS, selected with `platform: 'paas'`. */
export const paasPlatform: PlatformAdapter = {
  name: 'paas',

  metadataQuery: getMetadataQuery,

  readMetadata(data, { dam, taxonomy }) {
    const hasCategoriesField =
      Array.isArray(data.taxonomyType?.fields) &&
      data.taxonomyType.fields.some(
        (field: { name: string }) => field.name === 'categories',
      );

    return {
      contentTypeName: data._Content?.item?._metadata?.types?.[0],
      damEnabled: resolveMode(dam, data.damAssetType !== null),
      taxonomyEnabled: resolveMode(taxonomy, hasCategoriesField),
      formsOnPage: (data.formsOnPage?.total ?? 0) > 0,
    };
  },

  contentQuery: (kind, contentType, options) =>
    kind === 'single' ?
      createSingleContentQuery(contentType, options)
    : createMultipleContentQuery(contentType, options),

  normalize: item => liftSectionNodes(removeTypePrefix(item)),
};
