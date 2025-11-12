import {
  createSingleContentQuery,
  ItemsResponse,
  createMultipleContentQuery,
} from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
} from './error.js';
import {
  ContentInput as GraphVariables,
  pathFilter,
  previewFilter,
  GraphVariationInput,
  localeFilter,
} from './filters.js';

/** Options for Graph */
type GraphOptions = {
  /** Graph instance URL. `https://cg.optimizely.com/content/v2` */
  graphUrl?: string;
};

export type PreviewParams = {
  preview_token: string;
  key: string;
  ctx: string;
  ver: string;
  loc: string;
};

export type GraphGetContentOptions = {
  variation?: GraphVariationInput;
  host?: string;
};

export type GraphGetLinksOptions = {
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
}
`;

const GET_PATH_QUERY = `
query GetPath($where: _ContentWhereInput, $locale: [Locales]) {
  _Content(where: $where, locale: $locale) {
    item {
      _id
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
 */
function removeTypePrefix(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((e) => removeTypePrefix(e));
  }

  if (typeof obj === 'object' && obj !== null) {
    const obj2: Record<string, any> = {};
    if ('__typename' in obj) {
      // Do something special with the object
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

  constructor(key: string, options: GraphOptions = {}) {
    this.key = key;
    this.graphUrl = options.graphUrl ?? 'https://cg.optimizely.com/content/v2';
  }

  /** Perform a GraphQL query with variables */
  async request(query: string, variables: any, previewToken?: string) {
    const url = new URL(this.graphUrl);

    if (!previewToken) {
      url.searchParams.append('auth', this.key);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: previewToken ? `Bearer ${previewToken}` : '',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
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
  private async getContentType(input: GraphVariables, previewToken?: string) {
    const data = await this.request(
      GET_CONTENT_METADATA_QUERY,
      input,
      previewToken
    );

    const type = data._Content?.item?._metadata?.types?.[0];

    if (!type) {
      return null;
    }

    if (typeof type !== 'string') {
      throw new GraphResponseError(
        "Returned type is not 'string'. This might be a bug in the SDK. Try again later. If the error persists, contact Optimizely support",
        {
          request: {
            query: GET_CONTENT_METADATA_QUERY,
            variables: input,
          },
        }
      );
    }

    return type;
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
    options?: GraphGetContentOptions
  ) {
    const input: GraphVariables = {
      ...pathFilter(path, options?.host),
      variation: options?.variation,
    };
    const contentTypeName = await this.getContentType(input);

    if (!contentTypeName) {
      return [];
    }

    const query = createMultipleContentQuery(contentTypeName);
    const response = (await this.request(query, input)) as ItemsResponse<T>;

    return response?._Content?.items.map(removeTypePrefix);
  }

  /**
   * Given the path of a page, return its "path" (i.e. a list of ancestor pages).
   *
   * @param path The URL of the current page
   * @returns A list with the metadata information of all ancestors sorted
   * from the top-most to the current
   */
  async getPath(path: string, options?: GraphGetLinksOptions) {
    const data = (await this.request(GET_PATH_QUERY, {
      ...pathFilter(path, options?.host),
      ...localeFilter(options?.locales),
    })) as GetLinksResponse;

    // Check if the page itself exist.
    if (!data._Content.item._id) {
      return null;
    }

    const links = data?._Content?.item._link._Page.items;

    // Return sorted by "hierarchical"
    return links.toSorted((a, b) => {
      const ha = a?._metadata?.url?.hierarchical ?? '';
      const hb = b?._metadata?.url?.hierarchical ?? '';

      if (ha > hb) {
        return 1;
      }
      if (ha < hb) {
        return -1;
      }
      return 0;
    });
  }

  /**
   * Given the path of a page, get its "items" (i.e. the children pages)
   *
   * @param path The URL of the current page
   * @returns A list with the metadata information of all child/descendant pages
   */
  async getItems(path: string, options?: GraphGetLinksOptions) {
    const data = (await this.request(GET_ITEMS_QUERY, {
      ...pathFilter(path, options?.host),
      ...localeFilter(options?.locales),
    })) as GetLinksResponse;

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
    const contentTypeName = await this.getContentType(
      input,
      params.preview_token
    );

    if (!contentTypeName) {
      throw new GraphResponseError(
        `No content found for key [${params.key}]. Check that your CMS contains something there`,
        { request: { variables: input, query: GET_CONTENT_METADATA_QUERY } }
      );
    }
    const query = createSingleContentQuery(contentTypeName);
    const response = await this.request(query, input, params.preview_token);

    return decorateWithContext(
      removeTypePrefix(response?._Content?.item),
      params
    );
  }
}
