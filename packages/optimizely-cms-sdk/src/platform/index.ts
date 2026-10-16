/**
 * Building blocks for CMS platform packages such as `@optimizely/cms-sdk-paas`.
 *
 * Not for application code. Released in lockstep with those packages, so it
 * may change in a minor version.
 *
 * @module
 */

export type { GraphPlatform, ContentMetadata } from '../graph/platform.js';
export type { DamMode, TaxonomyMode } from '../graph/options.js';

// Query building
export {
  type QueryOptions,
  createSingleContentQuery,
  createMultipleContentQuery,
} from '../graph/createQuery.js';
export { getMetadataQuery } from '../graph/queries.js';

// Response normalisation
export { liftSectionNodes, removeTypePrefix } from '../graph/queries.js';
