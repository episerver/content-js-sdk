import { createQuery } from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
} from './error.js';
import {
  ContentInput,
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

/** Arguments for the method `fetchContent` */
type PathOrOptions =
  | string
  | {
      path: string;
      variation: string;
    };

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
  async request(query: string, variables: ContentInput, previewToken?: string) {
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

  /** Fetches the content type of a content. Returns `undefined` if the content doesn't exist */
  private async fetchContentType(input: ContentInput, previewToken?: string) {
    const data = await this.request(
      FETCH_CONTENT_TYPE_QUERY,
      input,
      previewToken
    );

    return data._Content?.item?._metadata?.types?.[0];
  }

  /** Fetches a content given its path */
  async fetchContent(options: PathOrOptions) {
    let input: ContentInput;

    if (typeof options === 'string') {
      input = pathFilter(options);
    } else {
      input = {
        ...pathFilter(options.path),
        ...variationsFilter(options.variation),
      };
    }

    const contentTypeName = await this.fetchContentType(input);

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
    const contentTypeName = await this.fetchContentType(
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
