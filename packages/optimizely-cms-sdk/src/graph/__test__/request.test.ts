import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { GraphClient } from '../index.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
  OptimizelyGraphError,
} from '../error.js';

const QUERY = 'query Test { _Content { total } }';
const VARIABLES = { key: 'a' };

type FakeResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  text?: () => Promise<string>;
  json?: () => Promise<unknown>;
};

const fakeResponse = ({ ok = true, status = 200, statusText = 'OK', ...rest }: FakeResponse) =>
  ({ ok, status, statusText, ...rest }) as Response;

const httpError = (status: number, statusText: string, body: string) =>
  fakeResponse({ ok: false, status, statusText, text: async () => body });

const jsonBody = (body: unknown) => fakeResponse({ json: async () => body });

let fetchMock: ReturnType<typeof vi.fn>;
let warnSpy: MockInstance<typeof console.warn>;
let errorSpy: MockInstance<typeof console.error>;

const send = () => new GraphClient('test-key').request(QUERY, VARIABLES);

/** The error `send()` rejects with. */
const rejection = async () => {
  try {
    await send();
  } catch (error) {
    return error as Error;
  }
  throw new Error('request resolved');
};

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('a non-ok response', () => {
  test('with GraphQL errors in a JSON body throws GraphContentResponseError', async () => {
    const errors = [{ message: 'Field "x" is not allowed' }];
    fetchMock.mockResolvedValue(httpError(400, 'Bad Request', JSON.stringify({ errors })));

    const error = await rejection();

    expect(error).toBeInstanceOf(GraphContentResponseError);
    expect(error).toMatchObject({
      name: 'GraphContentResponseError',
      message: 'HTTP 400: Field "x" is not allowed',
      status: 400,
      errors,
      request: { query: QUERY, variables: VARIABLES },
    });
  });

  test('with a body that is not JSON throws GraphHttpResponseError carrying the body', async () => {
    fetchMock.mockResolvedValue(httpError(502, 'Bad Gateway', '<html>upstream down</html>'));

    const error = await rejection();

    expect(error).toBeInstanceOf(GraphHttpResponseError);
    expect(error).not.toBeInstanceOf(GraphContentResponseError);
    expect(error).toMatchObject({ message: 'HTTP 502: <html>upstream down</html>', status: 502 });
  });

  test('with a JSON body but no errors falls back to the status text', async () => {
    fetchMock.mockResolvedValue(httpError(401, 'Unauthorized', '{"message":"no key"}'));

    const error = await rejection();

    expect(error).toBeInstanceOf(GraphHttpResponseError);
    expect(error.message).toBe('HTTP 401: Unauthorized');
  });

  test('whose body cannot be read logs the failure and reports the status text', async () => {
    const readError = new Error('stream closed');
    fetchMock.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.reject(readError),
      }),
    );

    const error = await rejection();

    expect(error).toBeInstanceOf(GraphHttpResponseError);
    expect(error.message).toBe('HTTP 503: Service Unavailable');
    expect(errorSpy).toHaveBeenCalledWith('Error reading response text', readError, {
      'http.status_code': 503,
    });
  });
});

describe('a fetch that rejects', () => {
  test('with a TypeError is wrapped in an OptimizelyGraphError keeping the cause', async () => {
    const networkError = new TypeError('fetch failed');
    fetchMock.mockRejectedValue(networkError);

    const error = await rejection();

    expect(error).toBeInstanceOf(OptimizelyGraphError);
    expect(error).not.toBeInstanceOf(GraphResponseError);
    expect(error.message).toContain('Error when calling `fetch`');
    expect(error.cause).toBe(networkError);
  });

  test('with anything else rethrows it untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(send()).rejects.toBe(abort);
  });
});

describe('an HTTP 200 response', () => {
  test('returns data', async () => {
    fetchMock.mockResolvedValue(jsonBody({ data: { _Content: { total: 3 } } }));

    await expect(send()).resolves.toEqual({ _Content: { total: 3 } });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('with errors and no data throws GraphContentResponseError', async () => {
    fetchMock.mockResolvedValue(jsonBody({ errors: [{ message: 'Not authorized' }], data: null }));

    const error = await rejection();

    expect(error).toBeInstanceOf(GraphContentResponseError);
    expect(error).toMatchObject({ message: 'HTTP 200: Not authorized', status: 200 });
  });

  test('with errors alongside partial data returns the data and warns', async () => {
    fetchMock.mockResolvedValue(
      jsonBody({ data: { _Content: null }, errors: [{ message: 'first' }, { message: 'second' }] }),
    );

    await expect(send()).resolves.toEqual({ _Content: null });
    expect(warnSpy).toHaveBeenCalledWith('Graph returned errors alongside partial data', {
      'http.status_code': 200,
      'graph.errors': 'first; second',
    });
  });

  test('with an empty errors array is treated as a success', async () => {
    fetchMock.mockResolvedValue(jsonBody({ data: { ok: true }, errors: [] }));

    await expect(send()).resolves.toEqual({ ok: true });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('GraphContentResponseError message', () => {
  const messageFor = (errors: { message: string }[]) =>
    new GraphContentResponseError(errors, { status: 400, request: { query: QUERY, variables: {} } })
      .message;

  test.each(['Unknown type "Foo".', 'Cannot query field "bar" on type "Foo".'])(
    'points at a schema mismatch for "%s"',
    message => {
      expect(messageFor([{ message }])).toBe(
        `HTTP 400: ${message} Ensure your CMS content types are in sync with the types defined in your application, as inconsistencies may cause query issues. Use the "@optimizely/cms-cli" CLI to push or reconcile your local definitions with the CMS.`,
      );
    },
  );

  test('suggests retrying a syntax error', () => {
    expect(messageFor([{ message: 'Syntax Error: Unexpected "}"' }])).toBe(
      'HTTP 400: Syntax Error: Unexpected "}" Try again later. If the error persists, contact Optimizely support.',
    );
  });

  test('passes any other single message through', () => {
    expect(messageFor([{ message: 'Something else' }])).toBe('HTTP 400: Something else');
  });

  test('summarises several errors by count', () => {
    expect(messageFor([{ message: 'Unknown type "A"' }, { message: 'b' }])).toBe(
      'HTTP 400: 2 errors in the GraphQL query. Check "errors" object.',
    );
  });
});
