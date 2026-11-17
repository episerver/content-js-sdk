import type { GraphClient } from './index.js';
import type { ContentProps } from '../infer.js';
import type { AnyContentType } from '../model/contentTypes.js';
import type {
  AnyProperty,
  ContentProperty,
  ContentReferenceProperty,
  FloatProperty,
  IntegerProperty,
  LinkProperty,
  RichTextProperty,
  UrlProperty,
} from '../model/properties.js';
import type {
  ContentMetadataOrderByInput,
  ChangesetMetadataOrderByInput,
  GraphGetContentOptions,
  GraphGetItemOptions,
  GraphGetLinksOptions,
  GraphReference,
  ItemMetadataOrderByInput,
  OrderDirection,
} from './options.js';
import { getAllContentTypes, getContentTypeByBaseType } from '../model/contentTypeRegistry.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A mapping of user-friendly keys to content type definitions. */
export type ContentTypeMap = Record<string, AnyContentType>;

/**
 * Maps a content type property to its GraphQL orderBy input type.
 * Based on which property types appear in Graph's orderBy schema.
 */
type PropertyOrderByInput<P extends AnyProperty> =
  P extends RichTextProperty ? { html?: OrderDirection }
  : P extends LinkProperty ? { text?: OrderDirection; title?: OrderDirection; target?: OrderDirection; url?: { [k: string]: OrderDirection } }
  : P extends ContentProperty ? Record<string, OrderDirection>
  : P extends ContentReferenceProperty ? Record<string, OrderDirection>
  : P extends UrlProperty ? { [k: string]: OrderDirection }
  : P extends IntegerProperty ? OrderDirection
  : P extends FloatProperty ? OrderDirection
  : never;

/** Extract orderable property keys (only property types Graph supports in orderBy). */
type OrderablePropertyKeys<CT extends AnyContentType> =
  CT extends { properties: infer P }
    ? P extends Record<string, AnyProperty>
      ? { [K in keyof P]: PropertyOrderByInput<P[K]> extends never ? never : K }[keyof P] & string
      : never
    : never;

/**
 * Typed `orderBy` clause for a specific content type, matching Graph schema.
 *
 * ```ts
 * { body: { html: 'ASC' }, _metadata: { published: 'DESC' } }
 * ```
 */
export type TypedOrderBy<CT extends AnyContentType> = {
  [K in OrderablePropertyKeys<CT>]?: CT extends { properties: infer P }
    ? P extends Record<string, AnyProperty> ? K extends keyof P ? PropertyOrderByInput<P[K]> : never : never
    : never;
} & {
  _metadata?: ContentMetadataOrderByInput;
  _itemMetadata?: ItemMetadataOrderByInput;
  _changesetMetadata?: ChangesetMetadataOrderByInput;
  _modified?: OrderDirection;
};

/** GraphGetLinksOptions with content-type-aware orderBy. */
type TypedGetLinksOptions<CT extends AnyContentType> = Omit<GraphGetLinksOptions, 'orderBy'> & {
  orderBy?: TypedOrderBy<CT>;
};

/** Methods available on each content-type namespace of a typed client. */
export type TypedContentMethods<CT extends AnyContentType> = {
  getByPath(
    path: string,
    options?: GraphGetContentOptions,
  ): Promise<ContentProps<CT>[]>;

  get(
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
 * strongly-typed return values. For operations not covered by the typed API
 * (such as `request()` or `getPreviewContent()`), use `getClient()` directly.
 */
export type TypedClient<TMap extends ContentTypeMap> = {
  [K in keyof TMap]: TypedContentMethods<TMap[K]>;
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function filterByType<T extends { _metadata?: { types?: string[] } }>(
  items: T[] | null,
  contentTypeKey: string,
): T[] | null {
  if (!items) return null;
  return items.filter(item => item._metadata?.types?.includes(contentTypeKey));
}

function buildNamespace<CT extends AnyContentType>(
  client: GraphClient,
  contentType: CT,
): TypedContentMethods<CT> {
  const key = contentType.key;
  return {
    getByPath: (path, options?) =>
      client.getContentByPath(path, options),
    get: (reference, options?) =>
      client.getContent(reference, options),
    getItems: async (reference, options?) => {
      const items = await client.getItems(reference, options as GraphGetLinksOptions);
      return filterByType(items, key);
    },
    getPath: async (reference, options?) => {
      const items = await client.getPath(reference, options as GraphGetLinksOptions);
      return filterByType(items, key);
    },
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
 * const typed = createClient(getClient(), {
 *   news: NewsPageCT,
 *   article: ArticlePageCT,
 * });
 *
 * // Fully typed — return type is ContentProps<typeof NewsPageCT>[]
 * const items = await typed.news.getItems('/blog', {
 *   orderBy: { _metadata: { published: 'DESC' } },
 * });
 *
 * // For untyped operations, use getClient() directly
 * const preview = await getClient().getPreviewContent(params);
 * ```
 *
 * Use `optimizely-cms-cli generate client` to generate the type map
 * automatically from your content type files.
 */
export function createClient<TMap extends ContentTypeMap>(
  client: GraphClient,
  types: TMap,
): TypedClient<TMap> {
  const typed = {} as TypedClient<TMap>;

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
): TypedClient<ContentTypeMap> {
  const types: ContentTypeMap = {};
  const entries = filter ? getContentTypeByBaseType(filter) : getAllContentTypes();

  for (const entry of entries) {
    if (!('baseType' in entry)) continue;
    types[entry.key.toLowerCase()] = entry as AnyContentType;
  }

  return createClient(client, types);
}
