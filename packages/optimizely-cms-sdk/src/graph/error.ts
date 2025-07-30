/** Represents the request sent to graph */
type GraphRequest = {
  /** Query sent to Graph */
  query: string;

  /** Variables sent to Graph */
  variables: any;
};

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
    message: any,
    options: { status: number; request: GraphRequest }
  ) {
    if (typeof message === 'string') {
      super(message, options);
      this.status = options.status;
    } else {
      if ('code' in message && 'status' in message) {
        super(message.code, options);
      } else {
        super('HTTP Error', options);
      }

      this.status = message.status;
    }
  }
}

/** Thrown when the GraphQL server responded with a GraphQL related error (syntax, semantic errors...) */
export class GraphContentResponseError extends GraphHttpResponseError {
  errors: { message: string }[];

  constructor(
    errors: { message: string }[],
    options: { status: number; request: GraphRequest }
  ) {
    let message =
      errors.length === 1
        ? errors[0].message
        : `${errors.length} errors in the GraphQL query. Check "errors" object`;

    if (message.startsWith('Cannot query field')) {
      message += ` Ensure that the content types in the CMS are synced with the definitions in your app. You can use the "@episerver/cms-cli" CLI app to sync them`;
    } else if (message.startsWith('Syntax Error')) {
      message +=
        ' Try again later. If the error persists, contact Optimizely support';
    }

    super(message, options);

    this.errors = errors;
  }
}
