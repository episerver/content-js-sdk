import { createQuery } from './createQuery';

/** Options for Graph */
type GraphOptions = {
  /** Graph instance URL. `https://cg.optimizely.com/content/v2` */
  graphUrl?: string;
};

type PreviewParams = {
  preview_token: string;
  key: string;
  ctx: string;
  ver: string;
  loc: string;
};

const FETCH_CONTENT_QUERY = `
query FetchContent($filter: _ContentWhereInput) {
  _Content(where: $filter) {
    item {
      _metadata {
        types
      }
    }
  }
}
`;

function getFilterFromPreviewParams(params: PreviewParams) {
  return {
    _metadata: {
      key: { eq: params.key },
      version: { eq: params.ver },
      locale: { eq: params.loc },
    },
  };
}

function getFilterFromPath(path: string) {
  return {
    _metadata: {
      url: {
        default: { eq: path },
      },
    },
  };
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
      // TODO: Handle HTTP errors
    }

    // TODO:
    const json = await response.json();

    if (json.errors) {
      // TODO: handle errors sent by Graph
    }

    return json.data;
  }

  /** Fetches the content type of a content. Returns `undefined` if the content doesn't exist */
  async fetchContentType(path: string) {
    const filter = getFilterFromPath(path);
    const data = await this.request(FETCH_CONTENT_QUERY, { filter });

    return data._Content?.item?._metadata?.types?.[0];
  }

  /** Fetches a content given its path */
  async fetchContent(path: string) {
    const filter = getFilterFromPath(path);
    const contentTypeName = await this.fetchContentType(path);

    if (!contentTypeName) {
      throw new Error(`No content found for [${path}]`);
    }

    const query = createQuery(contentTypeName);

    const response = await this.request(query, { filter });

    return response?._Content?.item;
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async fetchPreviewContent(params: PreviewParams) {
    // TODO: Check that searchParams are correctly defined
    const filter = getFilterFromPreviewParams(params);

    // 1. Get content type
    const data = await this.request(
      FETCH_CONTENT_QUERY,
      { filter },
      params.preview_token
    );
    const contentTypeName = data._Content?.item?._metadata?.types?.[0];

    if (!contentTypeName) {
      throw new Error(`No content found for key [${params.key}]`);
    }

    const query = createQuery(contentTypeName);
    const response = await this.request(
      query,
      { filter },
      params.preview_token
    );

    return response?._Content?.item;
  }
}
