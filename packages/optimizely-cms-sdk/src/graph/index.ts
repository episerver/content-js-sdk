import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
  GraphResponseParseError,
} from './error.js';
import { createFragment } from './createQuery.js';
import { GraphQueryArguments, pathFilter, previewFilter } from './filters.js';
import { MetadataResponse } from './metadata.js';

const VARIABLES_TYPES = [
  '$cursor: String',
  '$ids: String[]',
  '$limit: number',
  '$locale: string[]',
  '$orderBy: _ContentOrderByInput',
  '$skip: int! = 20',
  '$variation: VariationInput',
  '$where: _ContentWhereInput',
].join(',');

const VARIABLES_MAPPING = [
  'cursor: $cursor',
  'ids: $ids',
  'limit: $limit',
  'locale: $locale',
  'orderBy: $orderBy',
  'skip: $skip',
  'variation: $variation',
  'where: $where',
].join(',');

const METADATA_FIELDS = `_metadata { key locale fallbackForLocale version displayName url {type default hierarchical internal graph} types published status changeset created lastModified sortOrder variation }`;

function itemMetadataQuery() {
  return `
  query GetItemMetadata(${VARIABLES_TYPES}) {
    _Content(${VARIABLES_MAPPING}) {
      item {
        ${METADATA_FIELDS}
      }
    }
  }`;
}

function itemContentQuery(fragmentName: string, fragments: string[]) {
  return `
  ${fragments.join('\n')}
  query GetItemContent(${VARIABLES_TYPES}) {
    _Content(${VARIABLES_MAPPING}) {
      item { __typename ${fragmentName} }
    }
  }
  `;
}

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

/** Adds an extra `__context` property next to each `__typename` property */
function decorateWithContext(
  obj: any,
  params: { ctx: string; preview_token: string }
): any {
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
  keyType: 'preview_token' | 'single_key';
  ctx: string;
  graphUrl: string;

  /**
   * Constructs a new instance of GraphClient
   *
   * @param key - Either a string representing a single API key, or a `PreviewParams` object containing a preview token and context.
   * @param options - Optional configuration for the graph client.
   * @param options.graphUrl - The URL of the graph API. Defaults to `'https://cg.optimizely.com/content/v2'` if not provided.
   *
   * If `key` is a string, it is treated as a single API key. If `key` is a `PreviewParams` object,
   * the preview token and context are extracted for preview mode.
   */
  constructor(key: string | PreviewParams, options: GraphOptions = {}) {
    if (typeof key === 'string') {
      this.key = key;
      this.keyType = 'single_key';
      this.ctx = '';
    } else {
      this.ctx = key.ctx;
      this.key = key.preview_token;
      this.keyType = 'preview_token';
    }
    this.graphUrl = options.graphUrl ?? 'https://cg.optimizely.com/content/v2';
  }

  /** Perform a GraphQL query with variables */
  async request(query: string, variables: GraphQueryArguments) {
    const url = new URL(this.graphUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.keyType === 'single_key') {
      url.searchParams.append('auth', this.key);
    } else {
      headers['Authorization'] = `Bearer ${this.key}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
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

  async getItemContentType(variables: GraphQueryArguments) {
    const data = await this.getItemMetadata(variables);
    const query = itemMetadataQuery();

    if (!data.types) {
      throw new GraphResponseParseError(
        'The item has a non-null `key` but `types` are null',
        { request: { query, variables: variables }, response: data }
      );
    }

    const nonNullTypes = data.types.filter((t) => t !== null);

    if (nonNullTypes.length === 0) {
      throw new GraphResponseParseError(
        'The `types` field is either empty or all its elements are `null`',
        { request: { query, variables: variables }, response: data }
      );
    }

    return nonNullTypes[0];
  }

  async getItem(variables: GraphQueryArguments) {
    const type = await this.getItemContentType(variables);

    return this.getItemContent(type, variables);
  }

  async getItemMetadata(variables: GraphQueryArguments) {
    const query = itemMetadataQuery();
    const response = await this.request(query, variables);
    const metadata = response._Content?.item?._metadata as MetadataResponse;

    if (!metadata.key) {
      throw new GraphResponseError('No item found', {
        request: { query, variables: variables },
      });
    }

    return metadata;
  }

  async getItemContent(
    contentTypeName: string,
    variables: GraphQueryArguments = {}
  ) {
    const fragments = createFragment(contentTypeName);
    const query = itemContentQuery(contentTypeName, fragments);
    const response = await this.request(query, variables);

    if (this.keyType === 'preview_token') {
      return decorateWithContext(response?._Content?.item, {
        ctx: this.ctx,
        preview_token: this.key,
      });
    }

    return response?._Content?.item;
  }

  /** Fetches a content given its path. */
  async fetchContent(path: string) {
    return this.getItem(pathFilter(path));
  }

  /** Fetches a content given the preview parameters (preview_token, ctx, ver, loc, key) */
  async fetchPreviewContent(params: { key: string; loc: string; ver: string }) {
    return this.getItem(previewFilter(params));
  }
}
