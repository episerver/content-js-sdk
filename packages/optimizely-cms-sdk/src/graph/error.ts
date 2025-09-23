import type { ContentInput } from './filters.js';

/** Represents the request sent to graph */
type GraphRequest = {
  /** Query sent to Graph */
  query: string;

  /** Variables sent to Graph */
  variables: ContentInput;
};

/** Super-class for all errors related to Optimizely Graph */
export class OptimizelyGraphError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Note: maybe we want to create an abstraction called `GraphCreateQueryError`
// to group all errors that happen before the request?

/**
 * Thrown when a content type is referred but can't be found by the SDK.
 */
export class GraphMissingContentTypeError extends OptimizelyGraphError {
  contentType: string;

  constructor(contentType: string) {
    super(
      `Content type "${contentType}" not included in the registry. Ensure that you called "initContentTypeRegistry()" with it before fetching content.`
    );
    this.contentType = contentType;
  }
}

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
    let message =
      errors.length === 1
        ? errors[0].message
        : `${errors.length} errors in the GraphQL query. Check "errors" object`;

    if (
      message.startsWith('Unknown type') ||
      message.startsWith('Cannot query field')
    ) {
      message += ` Ensure that the content types in the CMS are synced with the definitions in your app. You can use the "@optimizely/cms-cli" CLI app to sync them`;
    } else if (message.startsWith('Syntax Error')) {
      message +=
        ' Try again later. If the error persists, contact Optimizely support';
    }

    super(message, options);

    this.errors = errors;
  }
}
