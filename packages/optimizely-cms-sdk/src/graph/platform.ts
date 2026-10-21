import type { GraphPlatform } from './options.js';
import {
  type QueryOptions,
  createSingleContentQuery,
  createMultipleContentQuery,
} from './createQuery.js';
import { getMetadataQuery, liftSectionNodes, removeTypePrefix } from './queries.js';
import { OptimizelyGraphError } from './error.js';
import { paasPlatform } from './paas.js';

// TYPES

/** What the metadata query reveals about one piece of content and the instance serving it. */
type ContentMetadata = {
  /** The first entry of `_metadata.types`, unchecked. Absent when nothing matched. */
  contentTypeName: unknown;
  /** The schema exposes DAM assets. */
  damDetected: boolean;
  /** The schema exposes taxonomy categories. */
  taxonomyDetected: boolean;
  /** Graph found a form container among the page's top-level sections. */
  formsOnPage: boolean;
};

/**
 * Everything that differs between CMS products when talking to Graph: what to
 * ask for, and how to turn the answer into the shape renderers expect.
 */
export type PlatformAdapter = {
  /** Identifies the platform in telemetry. */
  readonly name: GraphPlatform;
  /** The query that finds a content item's type and the instance's capabilities. */
  metadataQuery: typeof getMetadataQuery;
  /** Reads the answer to {@linkcode PlatformAdapter.metadataQuery}. */
  readMetadata(data: any): ContentMetadata;
  /** The content query for a content type already resolved by the metadata query. */
  contentQuery(
    kind: 'single' | 'multiple',
    contentType: string,
    options: QueryOptions,
  ): string;
  /** One raw Graph item, turned into the shape renderers expect. */
  normalize(item: any): any;
};

// SAAS

/** Optimizely CMS SaaS, the default platform. */
export const saasPlatform: PlatformAdapter = {
  name: 'saas',

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

  normalize: item => liftSectionNodes(removeTypePrefix(item)),
};

// RESOLUTION

const ADAPTERS: Record<GraphPlatform, PlatformAdapter> = {
  saas: saasPlatform,
  paas: paasPlatform,
};

/** The adapter for a `platform` option. Throws for a name the SDK doesn't know. */
export function resolvePlatform(platform: GraphPlatform = 'saas'): PlatformAdapter {
  if (!Object.hasOwn(ADAPTERS, platform))
    throw new OptimizelyGraphError(
      `Unknown platform '${platform}'. Use 'saas' (the default) or 'paas'.`,
    );

  return ADAPTERS[platform];
}
