import { AnyContentType } from './model/contentTypes';

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
    } else if (property.type === 'contentReference') {
      // do nothing for now
    } else if (property.type === 'array') {
      // do nothing for now
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
export function createParser(contentType: AnyContentType) {
  return function parser(data: any) {
    console.log(data);

    return {
      ...data,
      __viewname: contentType.key,
    };
  };
}

export function createQuery(contentType: AnyContentType) {
  const fragment = createFragment(contentType);

  return `${fragment}
query FetchContent($filter: _ContentWhereInput) {
  _Content(where: $filter) {
    item {
      ...${contentType.key}
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
    console.log(JSON.stringify(response.errors, null, 2));
    throw new Error('GRAPHQL ERROR');
  }

  console.log(JSON.stringify(response.data, null, 2));

  // TODO: error handling
  const type = response.data._Content.item._metadata.types[0];

  console.log(type);

  // 2. Perform the same query but with the right fragments
  const contentType = await customImport(type);

  console.log(contentType);
  const parser = createParser(contentType);
  const query = createQuery(contentType);

  console.log(query);

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
    .then((json) => parser(json.data));

  return response2;
}
