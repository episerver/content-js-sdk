import {
  type DamMode,
  type GraphPlatform,
  type TaxonomyMode,
  createMultipleContentQuery,
  createSingleContentQuery,
  getMetadataQuery,
  liftSectionNodes,
  removeTypePrefix,
} from '@optimizely/cms-sdk/platform';

const resolveMode = (mode: DamMode | TaxonomyMode, detected: boolean): boolean =>
  mode === 'on' ? true
  : mode === 'off' ? false
  : detected;

// A copy of the SDK's SaaS platform, not a spread of it, so SaaS changes don't reach PaaS.
const paasPlatform: GraphPlatform = {
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

/**
 * Optimizely CMS 13 PaaS. Pass to `config()` or `getClient()` as `platform`.
 *
 * @example
 * ```ts
 * import { config } from '@optimizely/cms-sdk';
 * import { paas } from '@optimizely/cms-sdk-paas';
 *
 * config({ apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, platform: paas() });
 * ```
 */
export const paas = (): GraphPlatform => paasPlatform;
