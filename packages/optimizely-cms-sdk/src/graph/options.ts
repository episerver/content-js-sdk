import { GraphVariationInput } from './filters.js';
import {
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
  DEFAULT_COMPOSITION_DEPTH,
  DEFAULT_RICH_TEXT_FORMAT,
  GRAPH_PATH,
} from './constants.js';
import { RichTextFormat } from '../util/queryUtils.js';

// PUBLIC TYPES

/** Slot values for selecting the Graph engine version */
export type GraphSlot = 'Current' | 'New';

/**
 * Controls whether DAM (Digital Asset Management) asset fragments are included
 * in generated content queries.
 * - `'automatic'`: Include them when the Graph schema exposes DAM types (default).
 * - `'on'`: Always include them, skipping schema detection.
 * - `'off'`: Never include them, skipping schema detection.
 */
export type DamMode = 'automatic' | 'on' | 'off';

/** Query options shared by all query methods */
export type GraphQueryOptions = {
  /**
   * Enable or disable server-side caching for this request.
   * Overrides the global `cache` setting in `GraphOptions`.
   */
  cache?: boolean;
  /**
   * Enable or disable server-side stored query registration for this request.
   * When true (default), appends `stored=true` to the endpoint URL, allowing
   * the server to reuse query plans for identical query strings.
   * Set to false to bypass stored queries (useful for debugging schema changes).
   * @default true
   */
  stored?: boolean;
  /**
   * Select which Graph index to query against.
   * During a smooth rebuild, two indexes exist: the current (active) one and the new one being built.
   * - `'Current'`: Query the current active index (default)
   * - `'New'`: Query the new index that is being rebuilt
   * Overrides the global `slot` setting in `GraphOptions`.
   */
  slot?: GraphSlot;
  /**
   * Application host to filter paths by, for a CMS instance serving several
   * sites. Only applies to lookups by path; ignored when content is addressed
   * by key.
   * Overrides the global `host` setting in `GraphOptions`.
   */
  host?: string;
};

/**
 * Settings that shape the GraphQL query the SDK generates.
 *
 * Fixed for the lifetime of a client: unlike {@linkcode GraphQueryOptions},
 * none of these can be overridden on an individual request.
 */
export type GraphFragmentOptions = {
  /**
   * Which Rich Text representation(s) to select in GraphQL queries: `'html'`,
   * `'json'`, or `'both'`. Requesting only what the app renders shrinks query
   * and response payloads.
   *
   * Defaults to `'json'` rather than `'both'` — set to `'html'` or `'both'` if
   * the app renders the raw HTML string (e.g. `dangerouslySetInnerHTML`).
   * @default 'json'
   */
  richTextFormat?: RichTextFormat;
  /**
   * Nesting depth for ordinary composition fragments. Raise it if a composition is nested deeper than the default.
   *
   * Temporary: only needed because Graph's `@recursive` directive doesn't retrieve
   * DAM assets. Once it does, fragments recurse to any depth and this setting goes away.
   * @default 4
   */
  compositionDepth?: number;
  /**
   * Enable or disable contract expansion.
   * When true, contracts are expanded to include all implementing types.
   * When false, only the contract itself is included without expansion.
   */
  expandContracts?: boolean;
  /** Hard limit on generated fragments per content area. Throws GraphFragmentThresholdError when exceeded on unconstrained properties. */
  maxThreshold?: number;
  /**
   * Whether the generated query includes DAM asset fragments.
   * @default 'automatic'
   */
  dam?: DamMode;
  /**
   * Optional filter to exclude content types from fragment generation.
   * Return true to include a content type, false to exclude it.
   * Useful for skipping content types that have no registered component.
   */
  typeFilter?: (contentTypeKey: string) => boolean;
};

/**
 * Configuration for initializing the Optimizely Graph Client.
 */
export type GraphOptions = {
  /** Your Optimizely Graph API key (Single key in CMS) */
  apiKey: string;
  /** Optional custom Graph URL */
  graphUrl?: string;
  /**
   * Custom User-Agent string for HTTP requests to Graph API.
   * @default 'OptimizelySDK/{version} (JS)'
   */
  userAgent?: string;
  /** Settings that shape the generated GraphQL query. */
  fragment?: GraphFragmentOptions;
  /** Defaults for the per-request options, overridable on any single call. */
  query?: GraphQueryOptions;
};

export type GraphGetContentOptions = GraphQueryOptions & {
  variation?: GraphVariationInput;
};

export type GraphGetLinksOptions = GraphQueryOptions & {
  locales?: string[];
};

export type GraphGetItemOptions = GraphQueryOptions & {
  previewToken?: string;
};

export type PreviewParams = {
  preview_token: string;
  key: string;
  ctx: string;
  ver: string;
  loc: string;
};

export type GraphReference = {
  /** Content key/GUID (required) */
  key: string;
  /** Content locale/language (optional) */
  locale?: string;
  /** Content version for preview mode (optional) */
  version?: string;
  /** Content type name (optional) */
  type?: string;
  /** Source identifier - unused for now (optional) */
  source?: string;
};

// OPTION RESOLUTION

/** The `fragment` group once defaults are applied. Only `typeFilter` has no default. */
export type ResolvedFragmentOptions = Required<Omit<GraphFragmentOptions, 'typeFilter'>> &
  Pick<GraphFragmentOptions, 'typeFilter'>;

/** The `query` group once defaults are applied. `slot` and `host` have no default. */
export type ResolvedQueryOptions = Required<Omit<GraphQueryOptions, 'slot' | 'host'>> &
  Pick<GraphQueryOptions, 'slot' | 'host'>;

/**
 * What a content operation needs from the client running it.
 *
 * `GraphClient` satisfies this structurally, so the operations can live outside
 * the class without importing it — which keeps the dependencies between the
 * graph modules pointing one way.
 */
export interface GraphClientContext {
  readonly apiKey: string;
  readonly graphUrl: string;
  readonly userAgent: string;
  readonly fragmentDefaults: ResolvedFragmentOptions;
  readonly queryDefaults: ResolvedQueryOptions;
  request(
    query: string,
    variables: any,
    previewToken?: string,
    cache?: boolean,
    slot?: GraphSlot,
    stored?: boolean,
  ): Promise<any>;
}

export const DEFAULT_FRAGMENT_OPTIONS: ResolvedFragmentOptions = {
  richTextFormat: DEFAULT_RICH_TEXT_FORMAT,
  compositionDepth: DEFAULT_COMPOSITION_DEPTH,
  expandContracts: DEFAULT_EXPAND_CONTRACTS,
  maxThreshold: DEFAULT_MAX_FRAGMENT_THRESHOLD,
  dam: 'automatic',
};

export const DEFAULT_QUERY_OPTIONS: ResolvedQueryOptions = {
  cache: true,
  stored: true,
};

// Skips keys explicitly set to `undefined`, which a plain spread would copy over
// the default. Keeps `{ maxThreshold: undefined }` meaning "unset", not "clear it".
export const withDefaults = <T extends object>(
  defaults: T,
  overrides: Partial<T> = {},
): T => {
  const set = Object.entries(overrides).filter(([, value]) => value !== undefined);
  return { ...defaults, ...Object.fromEntries(set) };
};

/** Points a bare gateway URL at the content endpoint and drops trailing slashes. */
export function normalizeGraphUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.pathname === '/' || parsed.pathname === '') {
    parsed.pathname = GRAPH_PATH;
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

/**
 * Resolves one request's options against the client's `query` defaults, so a
 * method settles the whole group once instead of defaulting each key by hand.
 */
export function resolveQueryOptions(
  context: GraphClientContext,
  options: GraphQueryOptions = {},
  fallbacks: Partial<ResolvedQueryOptions> = {},
): ResolvedQueryOptions {
  const { cache, stored, slot, host } = options;
  const defaults = { ...context.queryDefaults, ...fallbacks };

  return withDefaults(defaults, { cache, stored, slot, host });
}

/**
 * The client's `fragment` settings in the shape the query builders take, with
 * the tri-state `dam` already settled into a boolean.
 */
export function fragmentContext(context: GraphClientContext, damEnabled: boolean) {
  const { dam, ...fragment } = context.fragmentDefaults;

  return { ...fragment, damEnabled };
}

/**
 * Parse GraphReference from string format.
 * Supports format: `graph://source/type/key?loc=locale&ver=version`
 *
 * @param referenceString - String in graph:// format
 * @returns Parsed GraphReference object
 *
 * @example
 * ```typescript
 * parseGraphReference('graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en&ver=123')
 * // Returns: { source: 'cms', type: 'Page', key: '880777d5a2824399b07e93e3ca70668e', locale: 'en', version: '123' }
 * ```
 */
export function parseGraphReference(referenceString: string): GraphReference {
  const graphProtocol = 'graph://';

  if (!referenceString.startsWith(graphProtocol)) {
    throw new Error(
      `Invalid graph reference format. Expected to start with "${graphProtocol}", got: "${referenceString}"`,
    );
  }

  const withoutProtocol = referenceString.slice(graphProtocol.length);
  const [pathPart, queryPart] = withoutProtocol.split('?');
  const pathSegments = pathPart.split('/').filter(s => s.length > 0);

  if (pathSegments.length < 1) {
    throw new Error(
      `Invalid graph reference format. Expected at least key to be present, got: "${referenceString}"`,
    );
  }

  let source: string | undefined;
  let type: string | undefined;
  let key: string;

  if (pathSegments.length === 3) {
    [source, type, key] = pathSegments;
  } else if (pathSegments.length === 2) {
    [type, key] = pathSegments;
  } else {
    key = pathSegments[0];
  }

  let locale: string | undefined;
  let version: string | undefined;

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    locale = params.get('loc') || undefined;
    version = params.get('ver') || undefined;
  }

  return {
    key,
    ...(locale && { locale }),
    ...(version && { version }),
    ...(type && { type }),
    ...(source && { source }),
  };
}
