import type { GraphClient } from './index.js';
import type { ContentProps } from '../infer.js';
import type { AnyContentType } from '../model/contentTypes.js';
import type {
  GraphGetContentOptions,
  GraphGetItemOptions,
  GraphGetLinksOptions,
  GraphReference,
  MetadataOrderField,
  OrderDirection,
} from './options.js';
import { getAllContentTypes, getContentTypeByBaseType } from '../model/contentTypeRegistry.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A mapping of user-friendly keys to content type definitions. */
export type ContentTypeMap = Record<string, AnyContentType>;

/** Extract property keys from a content type definition. */
type PropertyKeys<CT extends AnyContentType> =
  CT extends { properties: infer P }
    ? P extends Record<string, any> ? keyof P & string : never
    : never;

/**
 * Typed `orderBy` clause for a specific content type.
 *
 * Content-type properties are at the top level, metadata fields go under `_metadata`:
 * ```ts
 * { heading: 'DESC', _metadata: { published: 'ASC' } }
 * ```
 */
export type TypedOrderBy<CT extends AnyContentType> = {
  [K in PropertyKeys<CT>]?: OrderDirection;
} & {
  _metadata?: { [K in MetadataOrderField]?: OrderDirection };
};

/** GraphGetLinksOptions with content-type-aware orderBy. */
type TypedGetLinksOptions<CT extends AnyContentType> = Omit<GraphGetLinksOptions, 'orderBy'> & {
  orderBy?: TypedOrderBy<CT>;
};

/** Methods available on each content-type namespace of a typed client. */
export type TypedContentMethods<CT extends AnyContentType> = {
  getContentByPath(
    path: string,
    options?: GraphGetContentOptions,
  ): Promise<ContentProps<CT>[]>;

  getContent(
    reference: string | GraphReference,
    options?: GraphGetItemOptions,
  ): Promise<ContentProps<CT> | null>;

  getItems(
    reference: string | GraphReference,
    options?: TypedGetLinksOptions<CT>,
  ): Promise<ContentProps<CT>[] | null>;

  getPath(
    reference: string | GraphReference,
    options?: TypedGetLinksOptions<CT>,
  ): Promise<ContentProps<CT>[] | null>;
};

/**
 * A typed client: one namespace per registered content type, each with
 * strongly-typed return values, plus a `graph` escape hatch to the raw client.
 */
export type TypedClient<TMap extends ContentTypeMap> = {
  [K in keyof TMap]: TypedContentMethods<TMap[K]>;
} & {
  /** The underlying GraphClient for operations not covered by the typed API. */
  graph: GraphClient;
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildNamespace<CT extends AnyContentType>(
  client: GraphClient,
  _contentType: CT,
): TypedContentMethods<CT> {
  return {
    getContentByPath: (path, options?) =>
      client.getContentByPath(path, options),
    getContent: (reference, options?) =>
      client.getContent(reference, options),
    getItems: (reference, options?) =>
      client.getItems(reference, options as GraphGetLinksOptions),
    getPath: (reference, options?) =>
      client.getPath(reference, options as GraphGetLinksOptions),
  } as TypedContentMethods<CT>;
}

// ---------------------------------------------------------------------------
// createClient — typed, from an explicit map
// ---------------------------------------------------------------------------

/**
 * Creates a typed client from an explicit content-type map.
 *
 * Every key in `types` becomes a namespace on the returned object, with methods
 * whose return types are inferred from the content type definition.
 *
 * @example
 * ```ts
 * import { getClient, createClient } from '@optimizely/cms-sdk';
 * import { NewsPageCT, ArticlePageCT } from './content-types';
 *
 * const client = createClient(getClient(), {
 *   news: NewsPageCT,
 *   article: ArticlePageCT,
 * });
 *
 * // Fully typed — return type is ContentProps<typeof NewsPageCT>[]
 * const items = await client.news.getItems('/blog', {
 *   orderBy: { published: 'DESC', _metadata: { sortOrder: 'ASC' } },
 * });
 * ```
 *
 * A future codegen CLI can generate the `types` map automatically from the
 * content type registry or source files.
 */
export function createClient<TMap extends ContentTypeMap>(
  client: GraphClient,
  types: TMap,
): TypedClient<TMap> {
  const typed = { graph: client } as TypedClient<TMap>;

  for (const [key, ct] of Object.entries(types)) {
    (typed as any)[key] = buildNamespace(client, ct);
  }

  return typed;
}

// ---------------------------------------------------------------------------
// createClientFromRegistry — untyped, from the content type registry
// ---------------------------------------------------------------------------

/**
 * Creates a client with namespaces for every content type currently in the
 * registry. Because the registry is populated at runtime, the returned object
 * is `Record<string, TypedContentMethods<AnyContentType>>` — no compile-time
 * narrowing. Use {@link createClient} (or a generated map) when you need full
 * type safety.
 *
 * Keys are derived from the content type `key` field, lowercased.
 *
 * @param client - A configured `GraphClient` instance
 * @param filter - Optional base-type filter (e.g. `'_page'`). When omitted,
 *   all registered content types are included.
 */
export function createClientFromRegistry(
  client: GraphClient,
  filter?: AnyContentType['baseType'],
): TypedClient<ContentTypeMap> & { graph: GraphClient } {
  const types: ContentTypeMap = {};
  const entries = filter ? getContentTypeByBaseType(filter) : getAllContentTypes();

  for (const entry of entries) {
    if (!('baseType' in entry)) continue;
    types[entry.key.toLowerCase()] = entry as AnyContentType;
  }

  return createClient(client, types);
}
