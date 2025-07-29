import { createQuery } from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
} from './error.js';

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

export const FETCH_CONTENT_TYPE_QUERY = `
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

export function getFilterFromPreviewParams(params: PreviewParams): GraphFilter {
  return {
    _metadata: {
      key: { eq: params.key },
      version: { eq: params.ver },
      locale: { eq: params.loc },
    },
  };
}

export function getFilterFromPath(path: string): GraphFilter {
  return {
    _metadata: {
      url: {
        default: { eq: path },
      },
    },
  };
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
      const text = await response.text().catch(() => response.statusText);

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
      }
    }

    const json = await response.json();

    return json.data;
  }

  /** Fetches the content type of a content. Returns `undefined` if the content doesn't exist */
  async fetchContentType(filter: GraphFilter, previewToken?: string) {
    const data = await this.request(
      FETCH_CONTENT_TYPE_QUERY,
      { filter },
      previewToken
    );

    return data._Content?.item?._metadata?.types?.[0];
  }

  /** Fetches a content given its path */
  async fetchContent(path: string) {
    const filter = getFilterFromPath(path);
    const contentTypeName = await this.fetchContentType(filter);

    if (!contentTypeName) {
      // throw new NotFound(filter, `No content found for [${path}]`);
    }

    const query = createQuery(contentTypeName);

    const response = await this.request(query, { filter });

    return response?._Content?.item;
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async fetchPreviewContent(params: PreviewParams) {
    const filter = getFilterFromPreviewParams(params);
    const contentTypeName = await this.fetchContentType(
      filter,
      params.preview_token
    );

    if (!contentTypeName) {
      // throw new NotFound(filter, `No content found for key [${params.key}]`);
    }

    const query = createQuery(contentTypeName);
    const response = await this.request(
      query,
      { filter },
      params.preview_token
    );

    return decorateWithContext(response?._Content?.item, params);
  }
}
