import { cache } from 'react';
import {
  createSingleContentQuery,
  ItemsResponse,
  createMultipleContentQuery,
} from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
  GraphMissingContentTypeError,
  OptimizelyGraphError,
} from './error.js';
import {
  ContentInput as GraphVariables,
  pathFilter,
  previewFilter,
  GraphVariationInput,
  localeFilter,
  referenceFilter,
} from './filters.js';

/** Options for Graph */
export type GraphOptions = {
  /** Graph instance URL. `https://cg.optimizely.com/content/v2` */
  graphUrl?: string;
  /** Default maximum fragment threshold for GraphQL queries (default: 100) */
  maxFragmentThreshold?: number;
  /** Default application host for path filtering */
  host?: string;
  /**
   * Enable or disable server-side caching for all queries.
   * Can be overridden per request.
   * @default true
   */
  cache?: boolean;
  /**
   * Enable or disable stored (persisted) queries for all requests.
   * Can be overridden per request.
   * @default true
   */
  stored?: boolean;
  /**
   * Select which Graph engine version to query against for all requests.
   * Used during smooth rebuilds to test the new index before switching.
   * - `'Current'`: Query the active index (default)
   * - `'New'`: Query the new index being rebuilt
   * Can be overridden per request.
   */
  slot?: GraphSlot;
};

export type PreviewParams = {
  preview_token: string;
  key: string;
  ctx: string;
  ver: string;
  loc: string;
};

export type GraphReference = {
  /** Content key/GUID (required) */
  key: string;
  /** Content locale/language (optional) */
  locale?: string;
  /** Content version for preview mode (optional) */
  version?: string;
  /** Content type name (optional) */
  type?: string;
  /** Source identifier - unused for now (optional) */
  source?: string;
};

/** Slot values for selecting the Graph engine version */
export type GraphSlot = 'Current' | 'New';

/** Query options shared by all query methods */
export type GraphQueryOptions = {
  /**
   * Enable or disable server-side caching for this request.
   * Overrides the global `cache` setting in `GraphOptions`.
   */
  cache?: boolean;
  /**
   * Enable or disable stored (persisted) queries.
   * When true, Graph stores the query so subsequent requests can use a hash instead of the full query.
   * Overrides the global `stored` setting in `GraphOptions`.
   * @default true
   */
  stored?: boolean;
  /**
   * Select which Graph engine version to query against.
   * Used during smooth rebuilds to test the new index before switching.
   * - `'Current'`: Query the active index (default)
   * - `'New'`: Query the new index being rebuilt
   * Overrides the global `slot` setting in `GraphOptions`.
   */
  slot?: GraphSlot;
};

export type GraphGetContentOptions = GraphQueryOptions & {
  variation?: GraphVariationInput;
  host?: string;
};

export type GraphGetLinksOptions = GraphQueryOptions & {
  host?: string;
  locales?: string[];
};

export { GraphVariationInput };

const GET_CONTENT_METADATA_QUERY = `
query GetContentMetadata($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    item {
      _metadata {
        types
        variation
      }
    }
  }
  # Check if "cmp_Asset" type exists which indicates that DAM is enabled
  damAssetType: __type(name: "cmp_Asset") {
    __typename
  }
}
`;

const GET_PATH_QUERY = `
query GetPath($where: _ContentWhereInput, $locale: [Locales]) {
  _Content(where: $where, locale: $locale) {
    item {
      _id
      _metadata {
        ...on InstanceMetadata {
          path
        }
      }
      _link(type: PATH) {
        _Page {
          items {
            _metadata {
              key
              sortOrder
              displayName
              locale
              types
              url {
                base
                hierarchical
                default
              }
            }
          }
        }
      }
    }
  }
}`;

const GET_ITEMS_QUERY = `
query GetPath($where: _ContentWhereInput, $locale: [Locales]) {
  _Content(where: $where, locale: $locale) {
    item {
      _id
      _metadata {
        ...on InstanceMetadata {
          path
        }
      }
      _link(type: ITEMS) {
        _Page {
          items {
            _metadata {
              key
              sortOrder
              displayName
              locale
              types
              url {
                base
                hierarchical
                default
              }
            }
          }
        }
      }
    }
  }
}`;

type GetLinksResponse = {
  _Content: {
    item: {
      _id: string | null;
      _metadata: {
        path?: string[];
      };
      _link: {
        _Page: {
          items: Array<{
            _metadata?: {
              key: string;
              sortOrder?: number;
              displayName?: string;
              locale?: string;
              types: string[];
              url?: {
                base?: string;
                hierarchical?: string;
                default?: string;
              };
            };
          }>;
        };
      };
    };
  };
};

/**
 * Removes GraphQL alias prefixes from object keys in the response data.
 *
 * For objects with a `__typename` property, removes the `{typename}__` prefix
 * from all field names (e.g., `ContentType__p1` becomes `p1`).
 * This reverses the aliasing applied in query generation to prevent field
 * name collisions in GraphQL fragments.
 *
 * Traverses all keys in an object recursively, processing arrays and nested objects.
 *
 * @param obj - The object to process (typically a GraphQL response)
 * @returns A new object with prefixes removed, or the original value for primitives
 *
 * Note: this function is exported only on this level for testing purposes.
 * It should not be exported in the user-facing API
 */
export function removeTypePrefix(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((e) => removeTypePrefix(e));
  }

  if (typeof obj === 'object' && obj !== null) {
    const obj2: Record<string, any> = {};
    if ('__typename' in obj && typeof obj.__typename === 'string') {
      // Object has a GraphQL type, check for and remove aliased field prefixes
      const prefix = obj.__typename + '__';

      // Copy all properties, remove the typename from prefix
      for (const k in obj) {
        if (k.startsWith(prefix)) {
          obj2[k.slice(prefix.length)] = removeTypePrefix(obj[k]);
        } else {
          obj2[k] = removeTypePrefix(obj[k]);
        }
      }
    } else {
      // Traverse recursively
      for (const k in obj) {
        obj2[k] = removeTypePrefix(obj[k]);
      }
    }

    return obj2;
  }

  return obj;
}

/** Adds an extra `__context` property next to each `__typename` property */
function decorateWithContext(obj: any, params: PreviewParams): any {
  if (Array.isArray(obj)) {
    return obj.map((e) => decorateWithContext(e, params));
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const k in obj) {
      obj[k] = decorateWithContext(obj[k], params);
    }
    if ('__typename' in obj) {
      obj.__context = {
        edit: params.ctx === 'edit',
        preview_token: params.preview_token,
      };
    }
  }
  return obj;
}

export class GraphClient {
  key: string;
  graphUrl: string;
  maxFragmentThreshold: number;
  host?: string;
  cache: boolean;
  stored: boolean;
  slot?: GraphSlot;

  constructor(key: string, options: GraphOptions = {}) {
    this.key = key;
    this.graphUrl = options.graphUrl ?? 'https://cg.optimizely.com/content/v2';
    this.maxFragmentThreshold = options.maxFragmentThreshold ?? 100;
    this.host = options.host;
    this.cache = options.cache ?? true;
    this.stored = options.stored ?? true;
    this.slot = options.slot;
  }

  /** Perform a GraphQL query with variables */
  async request(
    query: string,
    variables: any,
    previewToken?: string,
    cache: boolean = true,
    stored: boolean = true,
    slot?: GraphSlot,
  ): Promise<any> {
    const url = new URL(this.graphUrl);

    if (!previewToken) {
      url.searchParams.append('auth', this.key);
    }

    // Append cache parameter to control caching behavior
    url.searchParams.append('cache', cache.toString());

    // Append stored parameter for persisted queries
    if (!stored) {
      url.searchParams.append('stored', 'false');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: previewToken ? `Bearer ${previewToken}` : '',
    };

    // Set slot header for smooth rebuild support
    if (slot === 'New') {
      headers['cg-query-new'] = 'true';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    }).catch((err) => {
      if (err instanceof TypeError) {
        const optiErr = new OptimizelyGraphError(
          'Error when calling `fetch`. Ensure the Graph URL is correct or try again later.',
        );
        optiErr.cause = err;
        throw optiErr;
      }
      throw err;
    });

    if (!response.ok) {
      const text = await response.text().catch((err) => {
        console.error('Error reading response text:', err);
        return response.statusText;
      });

      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        // When the response is not JSON
        throw new GraphHttpResponseError(text, {
          status: response.status,
          request: { query, variables },
        });
      }

      if (json.errors) {
        throw new GraphContentResponseError(json.errors, {
          status: response.status,
          request: { query, variables },
        });
      } else {
        throw new GraphHttpResponseError(response.statusText, {
          status: response.status,
          request: { query, variables },
        });
      }
    }

    const json = (await response.json()) as any;
    return json.data;
  }

  /**
   * Fetches the content type metadata for a given content input.
   *
   * @param input - The content input used to query the content type.
   * @param previewToken - Optional preview token for fetching preview content.
   * @returns A promise that resolves to the first content type metadata object
   */
  private async getContentMetaData(
    input: GraphVariables,
    previewToken?: string,
    cache?: boolean,
    stored?: boolean,
    slot?: GraphSlot,
  ) {
    const data = await this.request(
      GET_CONTENT_METADATA_QUERY,
      input,
      previewToken,
      cache ?? this.cache,
      stored ?? this.stored,
      slot ?? this.slot,
    );

    const contentTypeName = data._Content?.item?._metadata?.types?.[0];
    // Determine if DAM is enabled based on the presence of cmp_Asset type
    const damEnabled = data.damAssetType !== null;

    if (!contentTypeName) {
      return { contentTypeName: null, damEnabled };
    }

    if (typeof contentTypeName !== 'string') {
      throw new GraphResponseError(
        "Returned type is not 'string'. This might be a bug in the SDK. Try again later. If the error persists, contact Optimizely support",
        {
          request: {
            query: GET_CONTENT_METADATA_QUERY,
            variables: input,
          },
        },
      );
    }

    return { contentTypeName, damEnabled };
  }

  /**
   * Fetches content from the CMS based on the provided path or options.
   *
   * If a string is provided, it is treated as a content path. If an object is provided,
   * it may include both a path and a variation to filter the content.
   *
   * @param path - A string representing the content path
   * @param options - Options to include or exclude variations
   *
   * @param contentType - A string representing the content type. If omitted, the method
   *   will try to get the content type name from the CMS.
   *
   * @returns An array of all items matching the path and options. Returns an empty array if no content is found.
   */
  async getContentByPath<T = any>(
    path: string,
    options?: GraphGetContentOptions,
  ) {
    const input: GraphVariables = {
      ...pathFilter(path, options?.host ?? this.host), // Backwards compatibility: if host is not provided in options, use the client's default host
      variation: options?.variation,
    };

    const useCache = options?.cache ?? this.cache;
    const useStored = options?.stored ?? this.stored;
    const useSlot = options?.slot ?? this.slot;

    const { contentTypeName, damEnabled } =
      await this.getContentMetaData(input, undefined, useCache, useStored, useSlot);

    if (!contentTypeName) {
      return [];
    }

    try {
      const query = createMultipleContentQuery(
        contentTypeName,
        damEnabled,
        this.maxFragmentThreshold,
      );
      const response = (await this.request(query, input, undefined, useCache, useStored, useSlot)) as ItemsResponse<T>;

      return response?._Content?.items.map(removeTypePrefix);
    } catch (error) {
      // If content type is not registered, return empty array instead of throwing
      if (error instanceof GraphMissingContentTypeError) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Given the path or reference of a page, return its "path" (i.e. a list of ancestor pages).
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog/post-1`
   * - GraphReference: Object like `{ key: 'abc123', locale: 'en' }`
   * - String format: `graph://cms/Page/abc123?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all ancestors sorted from top-most to current
   *
   * @example
   * ```typescript
   * // Using path
   * const path = await client.getPath('/blog/post-1');
   *
   * // Using GraphReference
   * const path = await client.getPath({ key: 'abc123', locale: 'en' });
   *
   * // Using string format
   * const path = await client.getPath('graph://Page/abc123?loc=en');
   * ```
   */
  async getPath(
    input: string | GraphReference,
    options?: GraphGetLinksOptions,
  ) {
    let filter: GraphVariables;
    if (typeof input === 'string' && input.startsWith('graph://')) {
      const ref = this.parseGraphReference(input);
      filter = {
        ...referenceFilter(ref),
        ...localeFilter(options?.locales),
      };
    } else if (typeof input === 'string') {
      filter = {
        ...pathFilter(input, options?.host ?? this.host),
        ...localeFilter(options?.locales),
      };
    } else {
      filter = {
        ...referenceFilter(input),
        ...localeFilter(options?.locales),
      };
    }

    const useCache = options?.cache ?? this.cache;
    const useStored = options?.stored ?? this.stored;
    const useSlot = options?.slot ?? this.slot;

    const data = (await this.request(
      GET_PATH_QUERY,
      filter,
      undefined,
      useCache,
      useStored,
      useSlot,
    )) as GetLinksResponse;

    // Check if the page itself exist.
    if (!data._Content.item._id) {
      return null;
    }

    const links = data._Content.item._link._Page.items;
    const sortedKeys = data._Content.item._metadata.path;

    if (!sortedKeys) {
      // This is an error
      throw new GraphResponseError(
        'The `_metadata` does not contain any `path` field. Ensure that the path you requested is an actual page and not a block. If the problem persists, contact Optimizely support',
        {
          request: {
            query: GET_PATH_QUERY,
            variables: filter,
          },
        },
      );
    }

    // Return sorted by the "sortedKeys"
    const linkMap = new Map(links.map((link) => [link._metadata?.key, link]));
    return sortedKeys
      .map((key) => linkMap.get(key))
      .filter((item) => item !== undefined);
  }

  /**
   * Given the path or reference of a page, get its "items" (i.e. the children pages)
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog`
   * - GraphReference: Object like `{ key: 'abc123', locale: 'en' }`
   * - String format: `graph://Page/abc123?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all child/descendant pages
   *
   * @example
   * ```typescript
   * // Using path
   * const items = await client.getItems('/blog');
   *
   * // Using GraphReference
   * const items = await client.getItems({ key: 'abc123', locale: 'en' });
   *
   * // Using string format
   * const items = await client.getItems('graph://Page/abc123?loc=en');
   * ```
   */
  async getItems(
    input: string | GraphReference,
    options?: GraphGetLinksOptions,
  ) {
    let filter: GraphVariables;
    if (typeof input === 'string' && input.startsWith('graph://')) {
      const ref = this.parseGraphReference(input);
      filter = {
        ...referenceFilter(ref),
        ...localeFilter(options?.locales),
      };
    } else if (typeof input === 'string') {
      filter = {
        ...pathFilter(input, options?.host ?? this.host),
        ...localeFilter(options?.locales),
      };
    } else {
      filter = {
        ...referenceFilter(input),
        ...localeFilter(options?.locales),
      };
    }

    const useCache = options?.cache ?? this.cache;
    const useStored = options?.stored ?? this.stored;
    const useSlot = options?.slot ?? this.slot;

    const data = (await this.request(
      GET_ITEMS_QUERY,
      filter,
      undefined,
      useCache,
      useStored,
      useSlot,
    )) as GetLinksResponse;

    // Check if the page itself exist.
    if (!data._Content.item._id) {
      return null;
    }

    const links = data?._Content?.item._link._Page.items;

    return links;
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async getPreviewContent(params: PreviewParams) {
    const input = previewFilter(params);
    const { contentTypeName, damEnabled } = await this.getContentMetaData(
      input,
      params.preview_token,
      false, // Don't cache preview metadata
      this.stored,
      this.slot,
    );

    if (!contentTypeName) {
      throw new GraphResponseError(
        `No content found for key [${params.key}]. Check that your CMS contains something there`,
        { request: { variables: input, query: GET_CONTENT_METADATA_QUERY } },
      );
    }
    const query = createSingleContentQuery(
      contentTypeName,
      damEnabled,
      this.maxFragmentThreshold,
    );

    const response = await this.request(
      query,
      input,
      params.preview_token,
      false, // Don't cache preview content
      this.stored,
      this.slot,
    );

    return decorateWithContext(
      removeTypePrefix(response?._Content?.item),
      params,
    );
  }

  /**
   * Parse GraphReference from string format.
   * Supports format: `graph://source/type/key?loc=locale&ver=version`
   *
   * @param referenceString - String in graph:// format
   * @returns Parsed GraphReference object
   *
   * @example
   * ```typescript
   * parseGraphReference('graph://cms/Page/abc123?loc=en&ver=1.0')
   * // Returns: { source: 'cms', type: 'Page', key: 'abc123', locale: 'en', version: '1.0' }
   * ```
   */
  private parseGraphReference(referenceString: string): GraphReference {
    const graphProtocol = 'graph://';

    if (!referenceString.startsWith(graphProtocol)) {
      throw new Error(
        `Invalid graph reference format. Expected to start with "${graphProtocol}", got: "${referenceString}"`,
      );
    }

    const withoutProtocol = referenceString.slice(graphProtocol.length);
    const [pathPart, queryPart] = withoutProtocol.split('?');
    const pathSegments = pathPart.split('/').filter((s) => s.length > 0);

    if (pathSegments.length < 1) {
      throw new Error(
        `Invalid graph reference format. Expected at least key to be present, got: "${referenceString}"`,
      );
    }

    let source: string | undefined;
    let type: string | undefined;
    let key: string;

    if (pathSegments.length === 3) {
      [source, type, key] = pathSegments;
    } else if (pathSegments.length === 2) {
      [type, key] = pathSegments;
    } else {
      key = pathSegments[0];
    }

    let locale: string | undefined;
    let version: string | undefined;

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      locale = params.get('loc') || undefined;
      version = params.get('ver') || undefined;
    }

    return {
      key,
      ...(locale && { locale }),
      ...(version && { version }),
      ...(type && { type }),
      ...(source && { source }),
    };
  }

  /**
   * Unified content fetching method using GraphReference.
   * Fetches content by key with optional locale and version parameters.
   *
   * Supports both object and string formats:
   * - Object: `{ key: 'abc123', locale: 'en', version: '1.0' }`
   * - String: `graph://source/type/key?loc=en&ver=1.0`
   *
   * **Priority rules:**
   * - If `version` is specified, it takes priority (ignores locale-based filtering)
   * - If only `locale` is specified, fetches latest draft in that locale
   * - If neither specified, fetches latest published version
   *
   * @param reference - GraphReference object or string in graph:// format
   * @param previewToken - Optional preview token for preview mode
   * @returns The requested content item, or null if not found
   *
   * @example
   * ```typescript
   * // Fetch latest published content by key
   * const content = await client.getContent({ key: 'abc123' });
   *
   * // Fetch latest draft in specific locale
   * const content = await client.getContent({ key: 'abc123', locale: 'en' });
   *
   * // Fetch specific version (version has priority over locale)
   * const content = await client.getContent({
   *   key: 'abc123',
   *   version: '1.0',
   *   locale: 'en' // This will be ignored when version is specified
   * });
   *
   * // Using string format
   * const content = await client.getContent('graph://cms/Page/abc123?loc=en&ver=1.0');
   *
   * // With preview token
   * const content = await client.getContent({ key: 'abc123', version: '1.0' }, 'preview-token');
   * ```
   */
  async getContent(
    reference: GraphReference | string,
    previewToken?: string,
    options?: GraphQueryOptions,
  ) {
    const ref =
      typeof reference === 'string'
        ? this.parseGraphReference(reference)
        : reference;

    // When preview token is provided, default to no cache
    const useCache = options?.cache ?? (previewToken ? false : this.cache);
    const useStored = options?.stored ?? this.stored;
    const useSlot = options?.slot ?? this.slot;

    const input: GraphVariables = {
      where: {
        _metadata: {
          key: { eq: ref.key },
          ...(ref.version
            ? { version: { eq: ref.version } }
            : ref.locale
              ? { locale: { eq: ref.locale } }
              : {}),
        },
      },
    };

    const { contentTypeName, damEnabled } = await this.getContentMetaData(
      input,
      previewToken,
      useCache,
      useStored,
      useSlot,
    );

    if (!contentTypeName) {
      return null;
    }

    try {
      const query = createSingleContentQuery(
        contentTypeName,
        damEnabled,
        this.maxFragmentThreshold,
      );

      const response = await this.request(
        query,
        input,
        previewToken,
        useCache,
        useStored,
        useSlot,
      );

      return removeTypePrefix(response?._Content?.item);
    } catch (error) {
      if (error instanceof GraphMissingContentTypeError) {
        return null;
      }
      throw error;
    }
  }
}
