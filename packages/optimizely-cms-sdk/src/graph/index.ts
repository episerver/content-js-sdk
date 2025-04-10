import { AnyContentType } from '../model/contentTypes';
import { createFragment } from './createFragment';

/** Filters that can be passed to a Graph query */
type GraphFilter = any;

/** Callback function. Returns the content type ({@link AnyContentType}) given its name */
type Importer = (contentTypeName: string) => Promise<any>;

const GRAPHQL_URL = 'https://cg.optimizely.com/content/v2';

/** Query to fetch content with filters */
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

/**
 * Creates a GraphQL query for a particular content type
 * @param contentType The content type
 */
export async function createQuery(contentType: string, customImport: Importer) {
  const fragment = await createFragment(contentType, customImport);

  return `${fragment}
query FetchContent($filter: _ContentWhereInput) {
  _Content(where: $filter) {
    item {
      ...${contentType}
    }
  }
}
  `;
}

/** Fetches a content given its filters */
export async function fetchContent(
  key: string,
  filter: GraphFilter,
  customImport: Importer
) {
  const url = new URL(GRAPHQL_URL);
  url.searchParams.append('auth', key);
  // 1. Perform the `FETCH_CONTENT_QUERY` to get the content type
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: FETCH_CONTENT_QUERY,
      variables: {
        filter,
      },
    }),
  }).then((r) => r.json());

  if (response.errors) {
    throw new Error('GRAPHQL ERROR');
  }

  // TODO: error handling
  const type = response.data._Content.item._metadata.types[0];

  const query = createQuery(type, customImport);
  const response2 = await fetch(url, {
    method: 'POST',
    headers: {},
    body: JSON.stringify({
      query,
      variables: {
        filter,
      },
    }),
  })
    .then((r) => r.json())
    .then((json) => json.data._Content.item);

  return response2;
}
