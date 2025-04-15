import { createQuery, Importer } from './createQuery';

const GRAPHQL_URL = 'https://cg.optimizely.com/content/v2';

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
  customImport: Importer;

  constructor(key: string, customImport: Importer) {
    this.key = key;
    this.customImport = customImport;
  }

  /** Perform a GraphQL query with variables */
  async request(query: string, variables: any) {
    const url = new URL(GRAPHQL_URL);

    // TODO: handle "preview"
    url.searchParams.append('auth', this.key);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ``,
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

  /** Fetches the content type of a content */
  async fetchContentType(path: string) {
    const filter = getFilterFromPath(path);
    const data = await this.request(FETCH_CONTENT_QUERY, { filter });

    return data._Content?.item?._metadata?.types?.[0];
  }

  /** Fetches a content given its path */
  async fetchContent(path: string) {
    const filter = getFilterFromPath(path);
    const contentTypeName = await this.fetchContentType(path);
    const query = await createQuery(contentTypeName, this.customImport);

    const response = await this.request(query, { filter });

    return response?._Content?.item;
  }
}
