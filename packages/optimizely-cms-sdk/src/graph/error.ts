// import { FETCH_CONTENT_TYPE_QUERY, type GraphFilter } from '.';

/** Represents the request sent to graph */
type GraphRequest = {
  /** Query sent to Graph */
  query: string;

  /** Variables sent to Graph */
  variables: any;
};

type GraphResponseErrorCode =
  /** Thrown when the content can't be found */
  | 'not_found'
  /** Thrown when the query contains a syntax error, usually because it has more properties than the ones accepted */
  | 'invalid_query';

/** Super-class for all errors related to Optimizely Graph */
export class OptimizelyGraphError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Errors related to the Graph Query request step */
export class GraphRequestError extends OptimizelyGraphError {}

/** Errors that ocurred when creating the query */
export class QueryCreationError extends OptimizelyGraphError {}

/** Errors related to the response */
export class GraphResponseError extends OptimizelyGraphError {
  request: GraphRequest;
  constructor(message: string, options: { request: GraphRequest }) {
    super(message);
    this.request = options.request;
  }
}

/** Thrown when the GraphQL server responded with an HTTP error (401, 404...) */
export class GraphHttpResponseError extends GraphResponseError {
  status: number;

  constructor(
    message: string,
    options: { status: number; request: GraphRequest }
  ) {
    super(message, options);
    // this.message = message;
    this.status = options.status;
  }
}

/** Thrown when the GraphQL server responded with a GraphQL related error (syntax, semantic errors...) */
export class GraphContentResponseError extends GraphHttpResponseError {
  errors: { message: string }[];

  constructor(
    errors: { message: string }[],
    options: { status: number; request: GraphRequest }
  ) {
    const message =
      errors.length === 1
        ? errors[0].message
        : `${errors.length} errors in the GraphQL query. Check "errors" object`;

    super(message, options);

    this.errors = errors;
  }
}

// /** Error thrown when content is not found */
// export class NotFound extends OptimizelyGraphError {
//   hint: string = 'Check that your CMS contains something in the given path/key';

//   constructor(filter: GraphFilter, message?: string) {
//     super(message ?? 'Content not found', {
//       query: FETCH_CONTENT_TYPE_QUERY,
//       variables: { filter },
//     });
//   }
// }
