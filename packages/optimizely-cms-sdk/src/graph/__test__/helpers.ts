import { vi } from 'vitest';
import type { GraphClient } from '../index.js';
import { createFragment } from '../createQuery.js';
import { contentType, contract } from '../../model/index.js';
import { createQueryContext } from '../../util/queryUtils.js';

// FIXTURES

export const Categorizable = contract({
  key: 'Categorizable',
  displayName: 'Categorizable',
  properties: { category: { type: 'string' } },
});

export const BlogArticle = contentType({
  key: 'BlogArticle',
  displayName: 'Blog Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { title: { type: 'string' } },
});

export const NewsArticle = contentType({
  key: 'NewsArticle',
  displayName: 'News Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { headline: { type: 'string' } },
});

// GRAPH STUB

type Variables = Record<string, any>;
type ResponderFn = (variables: Variables, query: string) => unknown;
type Responder = ResponderFn | object | null;

export type GraphStub = {
  /** Answer for the `GetContentMetadata*` request. */
  metadata: Responder;
  /** Answers keyed by GraphQL operation name, checked before `content`. */
  operations?: Record<string, Responder>;
  /** Answer for every other request. */
  content?: Responder;
};

export type GraphRequestSpy = ReturnType<typeof stubGraph>;

const METADATA_OPERATION = /query GetContentMetadata/;

const operationName = (query: string) => query.match(/query (\w+)/)?.[1] ?? '';

const answer = (responder: Responder, variables: Variables, query: string) =>
  typeof responder === 'function' ? (responder as ResponderFn)(variables, query) : responder;

/** A metadata response for content of the given types, with DAM, taxonomy and forms absent. */
export const metadataResponse = (types: string[], extra: Record<string, unknown> = {}) => ({
  _Content: { item: { _metadata: { types } } },
  damAssetType: null,
  ...extra,
});

/** Replaces `client.request` with canned answers routed by operation name. */
export function stubGraph(client: GraphClient, { metadata, operations = {}, content = {} }: GraphStub) {
  return vi.spyOn(client, 'request').mockImplementation(async (query: string, variables: Variables) => {
    const name = operationName(query);

    if (METADATA_OPERATION.test(query)) return answer(metadata, variables, query);
    if (name in operations) return answer(operations[name], variables, query);
    return answer(content, variables, query);
  });
}

/** Every query text sent through the spy, in order. */
export const sentQueries = (spy: GraphRequestSpy): string[] => spy.mock.calls.map(call => String(call[0]));

/** The last request that isn't the metadata one. */
export const contentQuery = (spy: GraphRequestSpy): string =>
  sentQueries(spy)
    .filter(query => !METADATA_OPERATION.test(query))
    .at(-1) ?? '';

/** The metadata request. */
export const metadataQuery = (spy: GraphRequestSpy): string =>
  sentQueries(spy).find(query => METADATA_OPERATION.test(query)) ?? '';

// FRAGMENTS

/** The fragments generated for a registered content type. */
export const fragmentsFor = (key: string, context: Parameters<typeof createQueryContext>[0] = {}): string[] =>
  createFragment(key, new Set(), '', createQueryContext({ maxThreshold: 100, ...context })).fragments;
