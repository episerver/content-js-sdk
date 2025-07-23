import { MetadataResponse } from './metadata.js';

export function pathFilter(path: string): GraphQueryFilters {
  return {
    where: {
      _metadata: {
        url: {
          default: {
            eq: path,
          },
        },
      },
    },
  };
}

export function variationsFilter(
  values?: string | (string | undefined | null)[],
  includeOriginal?: boolean
): GraphQueryFilters {
  if (!values) {
    return {
      variation: {
        include: 'ALL',
      },
    };
  }

  if (typeof values === 'string') {
    return {
      variation: {
        include: 'SOME',
        value: [values],
        includeOriginal: includeOriginal ?? true,
      },
    };
  }

  const notNulls = values.filter((v) => typeof v === 'string');

  return {
    variation: {
      include: 'SOME',
      value: notNulls,
      includeOriginal: notNulls.length !== values.length,
    },
  };
}

export function metadataFilter(metadata: MetadataResponse): GraphQueryFilters {
  return {
    where: {
      _metadata: {
        key: { eq: metadata.key },
        version: { eq: metadata.version },
      },
    },
  };
}

export type GraphQueryFilters = {
  cursor?: string;
  ids?: string[];
  limit?: number;
  locale?: string[];
  orderBy?: _ContentOrderByInput;
  skip?: number;
  variation?: VariationInput;
  where?: ContentWhereInput;
};

export const filterVariables =
  '$cursor: String, $ids: String[], $limit: number, $locale: string[], $orderBy: _ContentOrderByInput, $skip: int! = 20, $variation: VariationInput, $where: _ContentWhereInput';

export const filterHeading =
  'cursor: $cursor, ids: $ids, limit: $limit, locale: $locale, orderBy: $orderBy, skip: $skip, variation: $variation, where: $where';

type OrderBy = 'ASC' | 'DESC';

type _ContentOrderByInput = {
  _ranking?: 'RELEVANCE' | 'SEMANTIC' | 'BOOST_ONLY' | 'DOC';
  _modified?: OrderBy;
  _minimumScore?: number;
  _semanticWeight?: number;
  _metadata?: IContentMetadataOrderByInput;
};

type IContentMetadataOrderByInput = {
  key?: OrderBy;
  locale?: OrderBy;
  fallbackForLocale?: OrderBy;
  version?: OrderBy;
  url?: ContentUrlInput<OrderBy>;
  types?: OrderBy;
  published?: OrderBy;
  status?: OrderBy;
  changeset?: OrderBy;
  created?: OrderBy;
  lastModified?: OrderBy;
  sortOrder?: OrderBy;
  variation?: OrderBy;
};

type VariationInput = {
  include?: VariationIncludeMode;
  value?: string[];
  includeOriginal?: boolean;
};

type VariationIncludeMode = 'ALL' | 'SOME' | 'NONE';

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
