import { AnyProperty } from '../model/contentTypeProperties';
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
 * Finds the content type within an array of content types given the `__typename` obtained from GraphQL
 */
function findContentType(
  contentTypes: AnyContentType[] | AnyContentType,
  typeName?: string
): AnyContentType | undefined {
  if (!Array.isArray(contentTypes)) {
    return contentTypes;
  }

  if (!typeName) {
    throw new Error("Can't detect view. __typename was null or undefined");
  }

  // Note: this function does not handle cases where more than one content types are found
  return contentTypes.find((c) => c.key === typeName);
}

/**
 * Parses one property on the GraphQL response.
 *
 * Adds `__viewname` and `__typename` accordingly
 *
 * @param property
 * @param value
 * @returns
 */
export function parseResponseProperty(property: AnyProperty, value: any) {
  if (property.type === 'content') {
    const foundContentType = findContentType(property.views, value.__typename);

    if (!foundContentType) {
      return null;
    }

    return {
      ...parseResponse(foundContentType, value),
      __typename: value.__typename,
      __viewname: foundContentType.key,
    };
  } else if (property.type === 'array') {
    return value.map((r: any) => parseResponseProperty(property.items, r));
  } else {
    return value;
  }
}

/** Parses the GraphQL response */
export function parseResponse(contentType: AnyContentType, response: any) {
  const values: any = {};

  for (const [k, v] of Object.entries(contentType.properties ?? {})) {
    values[k] = parseResponseProperty(v, response[k]);
  }

  return {
    ...response,
    ...values,
  };
}

/**
 * Creates a GraphQL query for a particular content type
 * @param contentType The content type
 */
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
    throw new Error('GRAPHQL ERROR');
  }

  // TODO: error handling
  const type = response.data._Content.item._metadata.types[0];

  // 2. Perform the same query but with the right fragments
  const contentType = await customImport(type);
  const query = createQuery(contentType);
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
    .then((json) => {
      return parseResponse(contentType, json.data._Content.item);
    });

  return response2;
}
