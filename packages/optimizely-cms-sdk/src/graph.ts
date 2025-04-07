import { AnyContentType } from './model/contentTypes';

const GRAPHQL_URL = '';

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
})
`;

function getFields(contentType: AnyContentType) {
  return Object.entries(contentType.properties ?? {}).map(
    ([key, value]) => key
  );
}

function createFragment(contentType: AnyContentType) {
  const fragmentName = contentType.key;
  const fields = getFields(contentType);

  return `fragment ${fragmentName} on ${fragmentName} { ${fields.join(' ')} }`;
}

// Returns a "parser", a function that parses the GraphQL response.
function createParser(contentType: AnyContentType) {
  // Don't do anything special for "regular" fields
  return (data: any) => data;
}

export function createQuery(contentType: AnyContentType) {
  const fragment = createFragment(contentType);

  return `
${fragment}
query FetchContent($filter: _ContentWhereInput) {
  __Content(where: $filter) {
    ...${contentType.key}
  }
}
  `;
}

/** Fetches a content given its filters */
export async function fetchContent(filter: any) {
  // 1. Perform the `FETCH_CONTENT_QUERY` to get the content type
  const response = await fetch(GRAPHQL_URL, {
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

  // TODO: error handling
  const type = response.data._Content.item._metadata.types[0];

  // 2. Perform the same query but with the right fragments
  const contentType = {} as any;
  const fragment = createFragment(contentType);
  const parser = createParser(contentType);

  const query2 = `
  ${fragment}
  `;

  const response2 = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {},
    body: JSON.stringify({
      query: query2,
      variables: {
        filter,
      },
    }),
  })
    .then((r) => r.json())
    .then((json) => parser(json.data));

  return response2;
}

function parser2() {}

const parser = [
  'f1',
  'f2',
  'f3',
  {
    name: 'f4',
    p: parser2,
  },
];
