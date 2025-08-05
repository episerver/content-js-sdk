import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
} from './error.js';
import { createFragment, createQuery } from './createQuery.js';
import {
  filterHeading,
  filterVariables,
  GraphQueryFilters,
  pathFilter,
  previewFilter,
} from './filters.js';
import { metadataQueryBody, MetadataResponse } from './metadata.js';

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

// TODO: this type definition is provisional
export type GraphFilter = {
  _metadata: {
    [key: string]: any;
  };
};

export type GraphVariables = {
  filter: GraphFilter;
};

const FETCH_CONTENT_TYPE_QUERY = `
query FetchContentType($filter: _ContentWhereInput) {
  _Content(where: $filter) {
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
  key: string | PreviewParams;
  graphUrl: string;

  constructor(key: string | PreviewParams, options: GraphOptions = {}) {
    this.key = key;
    this.graphUrl = options.graphUrl ?? 'https://cg.optimizely.com/content/v2';
  }

  /** Perform a GraphQL query with variables */
  async request(query: string, variables: GraphQueryFilters) {
    const url = new URL(this.graphUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof this.key === 'string') {
      url.searchParams.append('auth', this.key);
    } else {
      headers['Authorization'] = `Bearer ${this.key?.preview_token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
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

  /** Fetches the content type of a content. Returns `undefined` if the content doesn't exist */
  async fetchContentType(filters: GraphQueryFilters) {
    const data = await this.getItemMetadata(filters);

    return data.types?.[0];
  }

  async getItem(filters: GraphQueryFilters) {
    const metadata = await this.getItemMetadata(filters);
    const type = metadata?.types?.[0];

    if (!type) {
      throw new Error(`No content found`);
    }

    return this.getItemContent(type, filters);
  }

  async getItemMetadata(filters: GraphQueryFilters) {
    const query = `
      query GetItemMetadata(${filterVariables}) {
        _Content(${filterHeading}) {
          item {
            ${metadataQueryBody}
          }
        }
      }
    `;
    const response = await this.request(query, filters);

    return response._Content?.item?._metadata as MetadataResponse;
  }

  async getItemContent(
    contentTypeName: string,
    filters: GraphQueryFilters = {}
  ) {
    const fragments = createFragment(contentTypeName);
    const query = `
      ${fragments.join('\n')}
      query GetItemContent(${filterVariables}) {
        _Content(${filterHeading}) {
          item { __typename ${contentTypeName} }
        }
      }
    `;

    const response = await this.request(query, filters);

    if (typeof this.key !== 'string') {
      return decorateWithContext(response?._Content?.item, this.key);
    }

    return response?._Content?.item;
  }

  async listItemsMetadata(filters: GraphQueryFilters = {}) {
    const query = `
      query ListItemsMetadata(${filterVariables}) {
        _Content(${filterHeading}) {
          items {
            ${metadataQueryBody}
          }
        }
      }
    `;

    const response = await this.request(query, filters);

    return response._Content?.items?.map(
      (item: any) => item?._metadata
    ) as MetadataResponse[];
  }

  /** Fetches a content given its path */
  async fetchContent(path: string) {
    const filter = pathFilter(path);
    const contentTypeName = await this.fetchContentType(filter);

    if (!contentTypeName) {
      throw new GraphResponseError(
        `No content found for path [${path}]. Check that your CMS contains something in the given path`,
        { request: { variables: filter, query: FETCH_CONTENT_TYPE_QUERY } }
      );
    }

    const query = createQuery(contentTypeName);
    const response = await this.request(query, filter);

    return response?._Content?.item;
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async fetchPreviewContent(params: PreviewParams) {
    const filter = previewFilter(params);
    const contentTypeName = await this.fetchContentType(filter);

    if (!contentTypeName) {
      throw new GraphResponseError(
        `No content found for key [${params.key}]. Check that your CMS contains something there`,
        { request: { variables: filter, query: FETCH_CONTENT_TYPE_QUERY } }
      );
    }
    return this.getItemContent(contentTypeName, filter);
  }
}
