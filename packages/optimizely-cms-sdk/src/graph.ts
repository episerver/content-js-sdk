import { AnyProperty } from './model/contentTypeProperties';
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

/** Converts a property into a GraphQL field */
function expandProperty(name: string, options: AnyProperty) {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  if (options.type === 'content') {
    extraFragments.push(...options.views.map(createFragment));
    const subfields = options.views.map((view) => `...${view.key}`).join(' ');

    fields.push(`${name} { ${subfields} }`);
  } else if (options.type === 'richText') {
    fields.push(`${name} { html, json }`);
  } else if (options.type === 'url') {
    fields.push(`${name} { type, default }`);
  } else if (options.type === 'link') {
    fields.push(`${name} { url { type, default }}`);
  } else if (options.type === 'contentReference') {
    // do nothing for now
  } else if (options.type === 'array') {
    // Call recursively
    const f = expandProperty(name, options.items);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
  } else {
    fields.push(name);
  }

  return {
    fields,
    extraFragments,
  };
}

function getFields(contentType: AnyContentType): {
  fields: string[];
  extraFragments: string[];
} {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    const f = expandProperty(key, property);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
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
