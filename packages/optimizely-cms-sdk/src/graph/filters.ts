/**
 * This module contains the TypeScript definitions of a Graph Query
 * and functions to build those filters based on path,
 * preview parameters, etc.
 *
 * This is used internally in the SDK
 */

/**
 * Creates a {@linkcode ContentInput} object that filters results by a specific URL path.
 *
 * @param path - The URL path to filter by.
 * @returns A `GraphQueryArguments` object with a `where` clause that matches the given path.
 */
export function pathFilter(path: string, host?: string): ContentInput {
  return {
    where: {
      _metadata: {
        url: {
          default: {
            eq: path,
          },
          base: host ? { eq: host } : undefined,
        },
      },
    },
  };
}

/**
 * Creates a {@linkcode ContentInput} object for previewing content based on key, version, and locale.
 *
 * @param params - An object containing the following properties:
 * @param params.key - The unique key identifying the content.
 * @param params.ver - The version of the content to preview.
 * @param params.loc - The locale of the content to preview.
 *
 * @returns A `GraphQueryArguments` object with a `where` clause filtering by key, version, and locale.
 */
export function previewFilter(params: {
  key: string;
  ver: string;
  loc: string;
}): ContentInput {
  return {
    where: {
      _metadata: {
        key: { eq: params.key },
        version: { eq: params.ver },
        locale: { eq: params.loc },
      },
    },
    variation: {
      include: 'ALL',
    },
  };
}

export function variationFilter(value: string): ContentInput {
  return {
    variation: {
      include: 'SOME',
      value: [value],
    },
  };
}

/**
 * Arguments for querying content via the Graph API.
 */
export type ContentInput = {
  variation?: GraphVariationInput;
  where?: ContentWhereInput;
};

export type GraphVariationInput =
  | { include: 'NONE' }
  | { include: 'ALL' }
  | {
      include: 'SOME';
      value: string[];
      includeOriginal?: boolean;
    };

type ContentWhereInput = {
  _and?: ContentWhereInput[];
  _or?: ContentWhereInput[];
  _fulltext?: StringFilterInput;
  _modified?: DateFilterInput;
  _metadata?: IContentMetadataWhereInput;
};

type StringFilterInput = ScalarFilterInput<string> & {
  like?: string;
  startsWith?: string;
  endsWith?: string;
  in?: string[];
  notIn?: string[];
  match?: string;
  contains?: string;
  synonyms?: ('ONE' | 'TWO')[];
  fuzzly?: boolean;
};

type DateFilterInput = ScalarFilterInput<string> & {
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
  decay?: {
    origin?: string;
    scale?: number;
    rate?: number;
  };
};

type IContentMetadataWhereInput = {
  key?: StringFilterInput;
  locale?: StringFilterInput;
  fallbackForLocale?: StringFilterInput;
  version?: StringFilterInput;
  displayName?: StringFilterInput;
  url?: ContentUrlInput<StringFilterInput>;
  types?: StringFilterInput;
  published?: DateFilterInput;
  status?: StringFilterInput;
  changeset?: StringFilterInput;
  created?: DateFilterInput;
  lastModified?: DateFilterInput;
  sortOrder?: IntFilterInput;
  variation?: StringFilterInput;
};

type IntFilterInput = ScalarFilterInput<number> & {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  in?: number[];
  notIn?: number[];
  factor?: {
    value?: number;
    modifier?: 'NONE' | 'SQUARE' | 'SQRT' | 'LOG' | 'RECIPROCAL';
  };
};

type ContentUrlInput<T> = {
  type?: T;
  default?: T;
  hierarchical?: T;
  internal?: T;
  graph?: T;
  base?: T;
};

type ScalarFilterInput<T> = {
  eq?: T;
  notEq?: T;
  exist?: boolean;
  boost?: number;
};
