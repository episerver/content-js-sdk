import type { PlatformAdapter } from './platform.js';
import { createMultipleContentQuery, createSingleContentQuery } from './createQuery.js';
import {
  dropUnsetReferences,
  getMetadataQuery,
  liftSectionNodes,
  removeTypePrefix,
} from './queries.js';

// A copy of `saasPlatform`, not a spread of it, so SaaS changes don't reach PaaS.
/** Optimizely CMS 13 PaaS, selected with `platform: 'paas'`. */
export const paasPlatform: PlatformAdapter = {
  name: 'paas',

  metadataQuery: getMetadataQuery,

  readMetadata: data => ({
    contentTypeName: data._Content?.item?._metadata?.types?.[0],
    damDetected: data.damAssetType !== null,
    taxonomyDetected:
      Array.isArray(data.taxonomyType?.fields) &&
      data.taxonomyType.fields.some(
        (field: { name: string }) => field.name === 'categories',
      ),
    formsOnPage: (data.formsOnPage?.total ?? 0) > 0,
  }),

  contentQuery: (kind, contentType, options) =>
    kind === 'single' ?
      createSingleContentQuery(contentType, options)
    : createMultipleContentQuery(contentType, options),

  normalize: item => liftSectionNodes(dropUnsetReferences(removeTypePrefix(item))),
};
