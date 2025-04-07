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

function getFields(contentType: AnyContentType): {
  fields: string[];
  extraFragments: string[];
} {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    if (property.type === 'content') {
      extraFragments.push(...property.views.map(createFragment));
      const subfields = property.views
        .map((view) => `...${view.key}`)
        .join(' ');

      fields.push(`${key} { ${subfields} }`);
    } else if (property.type === 'richText') {
      fields.push(`${key} { html, json }`);
    } else if (property.type === 'url') {
      fields.push(`${key} { type, default }`);
    } else if (property.type === 'link') {
      fields.push(`${key} { url { type, default }}`);
    } else {
      fields.push(key);
    }
  }

  return { fields, extraFragments };
}

function createFragment(contentType: AnyContentType): string {
  const fragmentName = contentType.key;
  const { fields, extraFragments } = getFields(contentType);

  return `${extraFragments}
fragment ${fragmentName} on ${fragmentName} { ${fields.join(' ')} }`;
}

// Returns a "parser", a function that parses the GraphQL response.
function createParser(contentType: AnyContentType) {
  // Don't do anything special for "regular" fields
  return (data: any) => data;
}

export function createQuery(contentType: AnyContentType) {
  const fragment = createFragment(contentType);

  return `${fragment}
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
