import { FETCH_CONTENT_TYPE_QUERY, type GraphFilter } from '.';

/** Represents the request sent to graph */
type GraphRequest = {
  /** Query sent to Graph */
  query: string;

  /** Variables sent to Graph */
  variables: any;
};
/** Super-class for all errors related to Optimizely Graph */
export class OptimizelyGraphError extends Error {
  request: GraphRequest;

  /** Response received by Graph */
  response: any;

  constructor(message: string, request: GraphRequest) {
    super(message);
    this.request = request;
  }
}

/** Errors related to the Graph Query request step */
export class GraphRequestError extends OptimizelyGraphError {}

/** Errors that ocurred when creating the query */
export class QueryCreationError extends OptimizelyGraphError {}

/** Error thrown when content is not found */
export class NotFound extends OptimizelyGraphError {
  hint: string = 'Check that your CMS contains something in the given path/key';

  constructor(filter: GraphFilter, message?: string) {
    super(message ?? 'Content not found', {
      query: FETCH_CONTENT_TYPE_QUERY,
      variables: { filter },
    });
  }
}
