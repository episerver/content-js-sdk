import { createQuery } from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
} from './error.js';
import {
  ContentInput as GraphVariables,
  pathFilter,
  previewFilter,
  variationsFilter,
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

/** Arguments for the public methods `fetchContent`, `fetchContentType` */
type FetchContentOptions = {
  path?: string;
  variation?: string;
};

/**
 * Builds the variables object for a GraphQL query based on the provided options.
 *
 * If a string is provided, it is treated as a path and passed to `pathFilter`.
 * If an object is provided, it may contain `path` and/or `variation` properties,
 * which are processed by `pathFilter` and `variationsFilter` respectively.
 *
 * @param options - Either a string representing the content path, or an object containing fetch options.
 * @returns A `GraphVariables` object containing the appropriate filters for the query.
 */
function buildGraphVariables(
  options: string | FetchContentOptions
): GraphVariables {
  if (typeof options === 'string') {
    return pathFilter(options);
  }

  return {
    ...(options.path && pathFilter(options.path)),
    ...(options.variation && variationsFilter(options.variation)),
  };
}

const FETCH_CONTENT_TYPE_QUERY = `
query FetchContentType($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    item {
      _metadata {
        types
      }
    }
  }
}
`;

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
  async request(
    query: string,
    variables: GraphVariables,
    previewToken?: string
  ) {
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

    const json = await response.json();

    return json.data;
  }

  /**
   * Fetches the content type metadata for a given content input.
   *
   * @param input - The content input used to query the content type.
   * @param previewToken - Optional preview token for fetching preview content.
   * @returns A promise that resolves to the first content type metadata object, or `undefined` if not found.
   */
  private async getContentType(input: GraphVariables, previewToken?: string) {
    const data = await this.request(
      FETCH_CONTENT_TYPE_QUERY,
      input,
      previewToken
    );

    return data._Content?.item?._metadata?.types?.[0];
  }

  /**
   * Fetches a content type from the CMS using the provided options.
   *
   * @param options - A string representing the content path,
   *   or an {@linkcode FetchContentOptions} containing path and variation filters.
   * @returns A promise that resolves to the requested content type.
   */
  async fetchContentType(options: string | FetchContentOptions) {
    let input: GraphVariables = buildGraphVariables(options);

    return this.getContentType(input);
  }

  /**
   * Fetches content from the CMS based on the provided path or options.
   *
   * If a string is provided, it is treated as a content path. If an object is provided,
   * it may include both a path and a variation to filter the content.
   *
   * @param options - A string representing the content path,
   *   or an {@linkcode FetchContentOptions} containing path and variation filters.
   *
   * @returns A promise that resolves to the fetched content item.
   */
  async fetchContent(options: string | FetchContentOptions) {
    const input: GraphVariables = buildGraphVariables(options);
    const contentTypeName = await this.getContentType(input);

    if (!contentTypeName) {
      throw new GraphResponseError(`No content found.`, {
        request: { variables: input, query: FETCH_CONTENT_TYPE_QUERY },
      });
    }

    const query = createQuery(contentTypeName);
    const response = await this.request(query, input);

    return response?._Content?.item;
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async fetchPreviewContent(params: PreviewParams) {
    const input = previewFilter(params);
    const contentTypeName = await this.getContentType(
      input,
      params.preview_token
    );

    if (!contentTypeName) {
      throw new GraphResponseError(
        `No content found for key [${params.key}]. Check that your CMS contains something there`,
        { request: { variables: input, query: FETCH_CONTENT_TYPE_QUERY } }
      );
    }
    const query = createQuery(contentTypeName);
    const response = await this.request(query, input, params.preview_token);

    return decorateWithContext(response?._Content?.item, params);
  }
}
