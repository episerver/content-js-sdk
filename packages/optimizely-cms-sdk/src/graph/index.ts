import {
  createSingleContentQuery,
  ItemsResponse,
  createMultipleContentQuery,
} from './createQuery.js';
import {
  GraphContentResponseError,
  GraphHttpResponseError,
  GraphResponseError,
  GraphMissingContentTypeError,
  OptimizelyGraphError,
} from './error.js';
import {
  GraphVariationInput,
  type FilterShape,
  type ScalarFilter,
  type VariationMode,
  pathScalarFilter,
  previewScalarFilter,
  referenceScalarFilter,
  getFilterVarDecls,
  getFilterWhereClause,
  getVariationMode,
  getVariationVariables,
  getVariationVarDecls,
  getVariationClause,
} from './filters.js';
import { setContext } from '../context/config.js';
import { isContentTypeRegistered } from '../model/contentTypeRegistry.js';
import { isFormContentType } from '../model/formContentTypes.js';
import { contentTypeCanHoldForms, getCachedContentTypes } from '../util/queryUtils.js';
import { logError, SemanticAttributes } from '../telemetry/index.js';
import {
  withRequestSpan,
  withGetContentByPathSpan,
  withGetPreviewContentSpan,
  withGetContentSpan,
} from '../telemetry/spans.js';
import {
  DEFAULT_GRAPH_URL,
  DEFAULT_USER_AGENT,
  DEFAULT_MAX_FRAGMENT_THRESHOLD,
  DEFAULT_EXPAND_CONTRACTS,
  GRAPH_PATH,
} from './constants.js';

/** Configuration for initializing the Optimizely Graph Client */
export type GraphOptions = {
  /** Your Optimizely Graph API key (Single key in CMS) */
  apiKey: string;
  /** Optional custom Graph URL */
  graphUrl?: string;
  /** Optional default host for path filtering */
  host?: string;
  /** Hard limit on generated fragments per content area. Throws GraphFragmentThresholdError when exceeded on unconstrained properties. */
  maxFragmentThreshold?: number;
  /**
   * Enable or disable contract expansion.
   * When true, contracts are expanded to include all implementing types.
   * When false, only the contract itself is included without expansion.
   */
  expandContracts?: boolean;
  /**
   * Enable or disable server-side caching for all queries.
   * Can be overridden per request.
   * @default true
   */
  cache?: boolean;
  /**
   * Select which Graph index to query against for all requests.
   * During a smooth rebuild, two indexes exist: the current (active) one and the new one being built.
   * - `'Current'`: Query the current active index (default)
   * - `'New'`: Query the new index that is being rebuilt
   * Can be overridden per request.
   */
  slot?: GraphSlot;
  /**
   * Custom User-Agent string for HTTP requests to Graph API.
   * @default 'OptimizelySDK/{version} (JS)'
   */
  userAgent?: string;
  /**
   * Optional filter to exclude content types from fragment generation.
   * Return true to include a content type, false to exclude it.
   * Useful for skipping content types that have no registered component.
   */
  typeFilter?: (contentTypeKey: string) => boolean;
  /**
   * Control DAM asset fragment inclusion for all queries.
   * Can be overridden per request.
   * @default 'automatic'
   */
  dam?: DamMode;
};

// Global configuration for client factory
let globalGraphConfig: GraphOptions | null = null;

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
   * Control DAM asset fragment inclusion for this request.
   * Overrides the global `dam` setting in `GraphOptions`.
   */
  dam?: DamMode;
};

export type GraphGetContentOptions = GraphQueryOptions & {
  variation?: GraphVariationInput;
  host?: string;
};

export type GraphGetLinksOptions = GraphQueryOptions & {
  host?: string;
  locales?: string[];
};

export type GraphGetItemOptions = GraphQueryOptions & {
  previewToken?: string;
};

export { GraphVariationInput };

/**
 * Content type and DAM detection, plus an optional probe for whether this page
 * contains a form.
 *
 * Form fragments are large, so they are only fetched for pages that actually
 * have one. The probe is skipped with `@include` rather than living in a second
 * query, so the two cannot drift apart, and the query text stays identical
 * whether or not forms apply — one stored query template instead of two.
 *
 * `composition.nodes.type` matches top-level sections, where a form container
 * always sits, and is an ordinary string field — so the probe is valid whether
 * or not Optimizely Forms is enabled on the instance.
 */
const METADATA_QUERY_BODY = `{
    item {
      _metadata {
        types
        variation
      }
    }
  }
  # Check if "cmp_Asset" type exists which indicates that DAM is enabled
  damAssetType: __type(name: "cmp_Asset") {
    __typename
  }
  # Non-zero when this page has a form container as a top-level section
  formsOnPage: _Experience(where: $formsWhere) @include(if: $withForms) {
    total
  }`;

const METADATA_OP_NAMES: Record<FilterShape, string> = {
  'by-key': 'GetContentMetadata',
  'by-path': 'GetContentMetadataByPath',
};

function getMetadataQuery(shape: FilterShape, variationMode: VariationMode = 'none'): string {
  const varDecls = getFilterVarDecls(shape);
  const variationVars = getVariationVarDecls(variationMode);
  const allVars = [varDecls, variationVars, '$formsWhere: _ExperienceWhereInput', '$withForms: Boolean!']
    .filter(Boolean)
    .join(', ');
  const whereClause = getFilterWhereClause(shape);
  const variationClause = getVariationClause(variationMode);
  return `
query ${METADATA_OP_NAMES[shape]}(${allVars}) {
  _Content(${whereClause}${variationClause}) ${METADATA_QUERY_BODY}
}
`;
}

/**
 * The content types that really own a `composition` field.
 *
 * Kept in its own document on purpose. Graph truncates `possibleTypes` to just
 * `_Section` when this introspection shares a query with a data field, which
 * silently produces the opposite of the intended answer.
 */
const GET_SECTION_TYPES_QUERY = `
query GetSectionTypes {
  sectionTypes: __type(name: "_ISection") {
    possibleTypes {
      name
    }
  }
}
`;

/**
 * One schema lookup per endpoint for the lifetime of the process.
 *
 * The answer is a property of the schema, not of the content being fetched, so
 * it cannot vary by page, preview token or slot. Held at module scope rather
 * than on the client because `getClient()` returns a new client per call, and
 * the in-flight promise is shared so concurrent first requests make one lookup.
 */
const sectionTypesByEndpoint = new Map<
  string,
  Promise<ReadonlySet<string> | undefined>
>();

/**
 * Whether the application registered a section of its own.
 *
 * The schema lookup only changes the outcome for such a type: a form container
 * is handled by the fallback, and everything else is not a section either way.
 */
const hasOwnSectionTypes = (): boolean =>
  getCachedContentTypes().some(
    contentType =>
      'baseType' in contentType &&
      (contentType.baseType === '_section' ||
        ('compositionBehaviors' in contentType &&
          (contentType.compositionBehaviors?.includes('sectionEnabled') ?? false))) &&
      !isFormContentType(contentType.key),
  );

/** Content type key of the section Optimizely Forms uses for a form. */
const FORM_CONTAINER_TYPE = 'OptiFormsContainerData';

/** Narrows a content filter to "the same content, and it contains a form". */
const formsOnPageFilter = (where: unknown) => ({
  _and: [where, { composition: { nodes: { type: { eq: FORM_CONTAINER_TYPE } } } }],
});

/** Reconstructs a where object from scalar filter variables (for the forms probe). */
function buildWhereObject(filter: ScalarFilter): Record<string, unknown> {
  const v = filter.variables;
  switch (filter.filterShape) {
    case 'by-key': {
      const meta: Record<string, unknown> = { key: { eq: v.key } };
      if (v.version) meta.version = { eq: v.version };
      if (v.metadataLocale) meta.locale = { eq: v.metadataLocale };
      return { _metadata: meta };
    }
    case 'by-path': {
      const base = v.host ? { base: { eq: v.host } } : {};
      return {
        _or: [
          { _metadata: { url: { ...base, default: { eq: v.path } } } },
          { _metadata: { url: { ...base, default: { eq: v.pathNoSlash } } } },
          { _metadata: { url: { ...base, hierarchical: { eq: v.path } } } },
          { _metadata: { url: { ...base, hierarchical: { eq: v.pathNoSlash } } } },
        ],
      };
    }
  }
}

const LINKS_BODY = (linkType: 'PATH' | 'ITEMS') => `{
    item {
      _id
      _metadata {
        ...on InstanceMetadata {
          path
        }
      }
      _link(type: ${linkType}) {
        _Page {
          items {
            _metadata {
              key
              sortOrder
              displayName
              locale
              types
              url {
                base
                hierarchical
                default
              }
            }
          }
        }
      }
    }
  }`;

function getLinksQuery(
  opName: string,
  shape: FilterShape,
): string {
  const filterVars = getFilterVarDecls(shape);
  const whereClause = getFilterWhereClause(shape);
  const allVars = [filterVars, '$locale: [Locales]'].sort().join(', ');
  return `
query ${opName}(${allVars}) {
  _Content(${whereClause}, locale: $locale) ${LINKS_BODY('PATH')}
}`;
}

function getItemsQuery(
  opName: string,
  shape: FilterShape,
): string {
  const filterVars = getFilterVarDecls(shape);
  const whereClause = getFilterWhereClause(shape);
  const allVars = [filterVars, '$locale: [Locales]'].sort().join(', ');
  return `
query ${opName}(${allVars}) {
  _Content(${whereClause}, locale: $locale) ${LINKS_BODY('ITEMS')}
}`;
}


type GetLinksResponse = {
  _Content: {
    item: {
      _id: string | null;
      _metadata: {
        path?: string[];
      };
      _link: {
        _Page: {
          items: Array<{
            _metadata?: {
              key: string;
              sortOrder?: number;
              displayName?: string;
              locale?: string;
              types: string[];
              url?: {
                base?: string;
                hierarchical?: string;
                default?: string;
              };
            };
          }>;
        };
      };
    };
  };
};

/**
 * Removes GraphQL alias prefixes from object keys in the response data.
 *
 * For objects with a `__typename` property, removes the `{typename}__` prefix
 * from all field names (e.g., `ContentType__p1` becomes `p1`).
 * This reverses the aliasing applied in query generation to prevent field
 * name collisions in GraphQL fragments.
 *
 * Traverses all keys in an object recursively, processing arrays and nested objects.
 *
 * @param obj - The object to process (typically a GraphQL response)
 * @returns A new object with prefixes removed, or the original value for primitives
 *
 * Note: this function is exported only on this level for testing purposes.
 * It should not be exported in the user-facing API
 */
export function removeTypePrefix(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeTypePrefix);
  }

  if (typeof obj === 'object' && obj !== null) {
    const obj2: Record<string, any> = {};
    if ('__typename' in obj && typeof obj.__typename === 'string') {
      // Get all types from metadata (includes contracts/interfaces)
      const types = obj._metadata?.types || [obj.__typename];

      for (const k in obj) {
        // skip prefix check for keys without '__'
        if (!k.includes('__')) {
          obj2[k] = removeTypePrefix(obj[k]);
          continue;
        }

        // Check each type prefix and strip first match
        let stripped = false;
        for (let i = 0; i < types.length; i++) {
          const prefix = types[i] + '__';
          if (k.startsWith(prefix)) {
            obj2[k.slice(prefix.length)] = removeTypePrefix(obj[k]);
            stripped = true;
            break;
          }
        }

        // No prefix matched, copy as-is
        if (!stripped) {
          obj2[k] = removeTypePrefix(obj[k]);
        }
      }
    } else {
      // Traverse recursively for objects without __typename
      for (const k in obj) {
        obj2[k] = removeTypePrefix(obj[k]);
      }
    }

    return obj2;
  }

  return obj;
}

/**
 * Puts a section's child nodes where the renderer looks for them.
 *
 * Inside an experience, a section's children arrive as `content.nodes`. On
 * their own (e.g. previewing a shared block, or a section within a form),
 * they arrive as `composition.nodes` instead, though `InferSection` expects
 * `nodes` either way. An experience also has a `composition`, so we only lift
 * when the root node is itself a section.
 */
function liftSectionNodes(item: any): any {
  if (typeof item !== 'object' || item === null) return item;
  if (Array.isArray(item.nodes)) return item;

  const composition = item.composition;
  if (composition?.nodeType !== 'section' || !Array.isArray(composition.nodes)) {
    return item;
  }

  return { ...item, nodes: composition.nodes };
}

/** True for a form container anywhere in a response. */
const isFormContainer = (value: any): boolean =>
  value?.__typename === FORM_CONTAINER_TYPE ||
  value?._metadata?.types?.includes?.(FORM_CONTAINER_TYPE) === true;

/**
 * Collects the form containers in a response whose steps did not arrive.
 *
 * Graph resolves a section's `composition` only when that section is the
 * content being asked for. Reached through a content area the field comes back
 * empty, so `liftSectionNodes` finds nothing to lift and the container is left
 * with no `nodes` at all — which is what tells the two cases apart. A form that
 * genuinely has no steps still gets `nodes: []` and is not collected here.
 */
function findUnresolvedForms(value: any, found: any[] = [], seen = new Set()): any[] {
  if (typeof value !== 'object' || value === null || seen.has(value)) return found;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach(entry => findUnresolvedForms(entry, found, seen));
    return found;
  }

  if (isFormContainer(value) && !Array.isArray(value.nodes) && value._metadata?.key) {
    found.push(value);
  }

  Object.values(value).forEach(entry => findUnresolvedForms(entry, found, seen));
  return found;
}

/** Adds an extra `__context` property next to each `__typename` property */
function decorateWithContext(obj: any, params: PreviewParams): any {
  if (Array.isArray(obj)) {
    return obj.map(e => decorateWithContext(e, params));
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

function normalizeGraphUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.pathname === '/' || parsed.pathname === '') {
    parsed.pathname = GRAPH_PATH;
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

export class GraphClient {
  apiKey: string;
  graphUrl: string;
  maxFragmentThreshold: number;
  expandContracts: boolean;
  host?: string;
  cache: boolean;
  slot?: GraphSlot;
  userAgent: string;
  typeFilter?: (contentTypeKey: string) => boolean;
  dam: DamMode;

  // The key is required, other options have defaults or can be set globally
  constructor(apiKey: string, options: Omit<GraphOptions, 'apiKey'> = {}) {
    this.apiKey = apiKey;
    this.graphUrl = normalizeGraphUrl(options.graphUrl || DEFAULT_GRAPH_URL);
    this.maxFragmentThreshold =
      options.maxFragmentThreshold ?? DEFAULT_MAX_FRAGMENT_THRESHOLD;
    this.expandContracts = options.expandContracts ?? DEFAULT_EXPAND_CONTRACTS;
    this.host = options.host;
    this.cache = options.cache ?? true;
    this.slot = options.slot;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.typeFilter = options.typeFilter;
    this.dam = options.dam ?? 'automatic';
  }

  /** Perform a GraphQL query with variables */
  async request(
    query: string,
    variables: any,
    previewToken?: string,
    cache: boolean = true,
    slot?: GraphSlot,
    stored: boolean = false,
  ): Promise<any> {
    return withRequestSpan(
      this.graphUrl,
      this.userAgent,
      cache,
      slot || 'Current',
      !!previewToken,
      async span => {
        const url = new URL(this.graphUrl);

        // Append cache parameter to control caching behavior
        url.searchParams.append('cache', cache.toString());

        if (stored) {
          url.searchParams.append('stored', 'true');
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          Authorization:
            previewToken ? `Bearer ${previewToken}` : `epi-single ${this.apiKey}`,
        };

        if (stored) {
          headers['cg-stored-query'] = 'template';
        }

        if (slot === 'New') {
          headers['cg-query-new'] = 'true';
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables,
          }),
        }).catch(err => {
          if (err instanceof TypeError) {
            const optiErr = new OptimizelyGraphError(
              'Error when calling `fetch`. Ensure the Graph URL is correct or try again later.',
            );
            optiErr.cause = err;
            // Exception is automatically recorded by createSpan wrapper
            throw optiErr;
          }
          throw err;
        });

        // Record HTTP status code
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, response.status);

        if (!response.ok) {
          const text = await response.text().catch(err => {
            logError('Error reading response text', err as Error, {
              [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
            });
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

        const json = (await response.json()) as any;
        return json.data;
      },
    );
  }

  /**
   * Fills in the steps of any form the response left unresolved.
   *
   * A form reached through a content area arrives without them, for the reason
   * given on {@linkcode findUnresolvedForms}, and the only way to get them is to
   * ask for that container on its own. Costs one extra fetch per such form, and
   * nothing at all for a form in a composition or one previewed by itself.
   *
   * Mutates in place. Safe because `removeTypePrefix` has already rebuilt every
   * object, so nothing here is shared with a cached response.
   */
  /**
   * Which content types Graph gives a `composition` field.
   *
   * Costs one request the first time this process talks to an endpoint, and
   * nothing afterwards. Runs alongside the metadata request rather than before
   * it, so even that first call adds no latency.
   *
   * A failed lookup resolves to `undefined` and is not cached, so rendering
   * falls back to assuming only the forms container has the field and a later
   * request can try again.
   */
  private getSectionTypes(): Promise<ReadonlySet<string> | undefined> {
    // Nothing to learn unless the application has a type whose answer could
    // differ from the default. Forms are covered by the fallback, so an app
    // with no sections of its own never pays for this.
    if (!hasOwnSectionTypes()) return Promise.resolve(undefined);

    const endpoint = `${this.graphUrl}::${this.apiKey}`;
    const cached = sectionTypesByEndpoint.get(endpoint);
    if (cached) return cached;

    const pending = this.request(GET_SECTION_TYPES_QUERY, {}, undefined, true, this.slot)
      .then((data: any) => {
        const types = data?.sectionTypes?.possibleTypes;
        if (!Array.isArray(types)) return undefined;
        return new Set((types as { name: string }[]).map(type => type.name));
      })
      .catch(() => {
        // A schema lookup must never stop a page rendering.
        sectionTypesByEndpoint.delete(endpoint);
        return undefined;
      });

    sectionTypesByEndpoint.set(endpoint, pending);
    return pending;
  }

  private async resolveFormNodes<T>(
    item: T,
    options: {
      damEnabled: boolean;
      sectionTypes?: ReadonlySet<string>;
      previewToken?: string;
      cache?: boolean;
      slot?: GraphSlot;
    },
  ): Promise<T> {
    // Grouped by key: one shared form placed twice on a page arrives as two
    // objects, and fetching it once per object would double the round trips.
    const byKey = new Map<string, any[]>();
    for (const form of findUnresolvedForms(item)) {
      const key = form._metadata.key;
      const group = byKey.get(key);
      if (group) group.push(form);
      else byKey.set(key, [form]);
    }
    if (byKey.size === 0) return item;

    await Promise.all(
      [...byKey].map(async ([key, forms]) => {
        const { version, locale } = forms[0]._metadata;

        // Version pins the previewed draft; otherwise Graph returns the
        // published container. Key-only, key+version and key+locale are
        // distinct query shapes now, so the query is built per group rather
        // than once — `withQueryCaching` makes repeats free.
        const filter = referenceScalarFilter({
          key,
          ...(version ? { version }
          : locale ? { locale }
          : {}),
        });

        // Built here rather than delegating to `getContent`, which would spend a
        // metadata round trip rediscovering a content type we already know.
        const query = createSingleContentQuery(FORM_CONTAINER_TYPE, {
          damEnabled: options.damEnabled,
          maxFragmentThreshold: this.maxFragmentThreshold,
          expandContracts: this.expandContracts,
          formsEnabled: true,
          sectionTypes: options.sectionTypes,
          filterShape: filter.filterShape,
        });

        const response = await this.request(
          query,
          filter.variables,
          options.previewToken,
          options.cache ?? this.cache,
          options.slot ?? this.slot,
        );

        const container = liftSectionNodes(removeTypePrefix(response?._Content?.item));
        const nodes = container?.nodes ?? [];
        forms.forEach(form => {
          form.nodes = nodes;
        });
      }),
    );

    return item;
  }

  /**
   * Fetches the content type metadata for a given content input.
   *
   * @param filterShape - The shape of the scalar filter.
   * @param variables - The scalar variables for the query.
   * @param previewToken - Optional preview token for fetching preview content.
   * @returns The content type, whether DAM is enabled, and whether this page
   *   needs the Optimizely Forms fragments.
   */
  private async getContentMetaData(
    filter: ScalarFilter,
    previewToken?: string,
    cache?: boolean,
    slot?: GraphSlot,
    stored?: boolean,
    variationMode: VariationMode = 'none',
    damMode: DamMode = 'automatic',
  ) {
    // Skip if forms aren't registered; local lookup, no round trip.
    const mayRenderForms = isContentTypeRegistered(FORM_CONTAINER_TYPE);

    const query = getMetadataQuery(filter.filterShape, variationMode);
    const variables = {
      ...filter.variables,
      withForms: mayRenderForms,
      formsWhere: mayRenderForms ? formsOnPageFilter(buildWhereObject(filter)) : null,
    };

    const [data, sectionTypes] = await Promise.all([
      this.request(
        query,
        variables,
        previewToken,
        cache ?? this.cache,
        slot ?? this.slot,
        stored ?? true,
      ),
      this.getSectionTypes(),
    ]);

    const contentTypeName = data._Content?.item?._metadata?.types?.[0];

    // Determine if DAM is enabled based on the presence of cmp_Asset type
    // The metadata query always probes for cmp_Asset; forced modes just ignore it.
    const damEnabled =
      damMode === 'on' ? true
      : damMode === 'off' ? false
      : data.damAssetType !== null;

    // The probe covers a form in a composition. Content type checks cover
    // the form container itself and forms in content areas.
    const needsForms =
      mayRenderForms &&
      ((data.formsOnPage?.total ?? 0) > 0 ||
        (typeof contentTypeName === 'string' &&
          (isFormContentType(contentTypeName) ||
            contentTypeCanHoldForms(contentTypeName))));

    if (!contentTypeName) {
      return {
        contentTypeName: null,
        damEnabled,
        formsEnabled: needsForms,
        sectionTypes,
      };
    }

    if (typeof contentTypeName !== 'string') {
      throw new GraphResponseError(
        "Returned type is not 'string'. This might be a bug in the SDK. Try again later. If the error persists, contact Optimizely support",
        {
          request: {
            query,
            variables,
          },
        },
      );
    }

    return { contentTypeName, damEnabled, formsEnabled: needsForms, sectionTypes };
  }

  /**
   * Fetches content from the CMS based on the provided path or options.
   *
   * If a string is provided, it is treated as a content path. If an object is provided,
   * it may include both a path and a variation to filter the content.
   *
   * @param path - A string representing the content path
   * @param options - Options to include or exclude variations
   *
   * @param contentType - A string representing the content type. If omitted, the method
   *   will try to get the content type name from the CMS.
   *
   * @returns An array of all items matching the path and options. Returns an empty array if no content is found.
   */
  async getContentByPath<T = any>(path: string, options?: GraphGetContentOptions) {
    return withGetContentByPathSpan(path, options?.cache ?? this.cache, async span => {
      const host = options?.host ?? this.host;
      const filter = pathScalarFilter(path, host);
      const varMode = getVariationMode(options?.variation);
      const variationVars = getVariationVariables(options?.variation);
      const variables = { ...filter.variables, ...variationVars };

      const cacheEnabled = options?.cache ?? this.cache;
      const storedEnabled = options?.stored ?? true;
      const activeSlot = options?.slot ?? this.slot;
      const damMode = options?.dam ?? this.dam;

      const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
        await this.getContentMetaData(
          filter,
          undefined,
          cacheEnabled,
          activeSlot,
          storedEnabled,
          varMode,
          damMode,
        );

      if (!contentTypeName) {
        span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
        return [];
      }

      span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

      try {
        const query = createMultipleContentQuery(contentTypeName, {
          damEnabled,
          maxFragmentThreshold: this.maxFragmentThreshold,
          expandContracts: this.expandContracts,
          formsEnabled,
          sectionTypes,
          filterShape: filter.filterShape,
          variationMode: varMode,
        });

        const response = (await this.request(
          query,
          variables,
          undefined,
          cacheEnabled,
          activeSlot,
          storedEnabled,
        )) as ItemsResponse<T>;

        return Promise.all(
          response?._Content?.items.map((item: unknown) =>
            this.resolveFormNodes(liftSectionNodes(removeTypePrefix(item)), {
              damEnabled,
              sectionTypes,
              cache: cacheEnabled,
              slot: activeSlot,
            }),
          ) ?? [],
        );
      } catch (error) {
        if (error instanceof GraphMissingContentTypeError) {
          return [];
        }
        throw error;
      }
    });
  }

  /**
   * Given the path or reference of a page, return its "path" (i.e. a list of ancestor pages).
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog/post-1`
   * - GraphReference: Object like `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' }`
   * - String format: `graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all ancestors sorted from top-most to current
   *
   * @example
   * ```typescript
   * // Using path
   * const path = await client.getPath('/blog/post-1');
   *
   * // Using GraphReference
   * const path = await client.getPath({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Using string format
   * const path = await client.getPath('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');
   * ```
   */
  async getPath(reference: string | GraphReference, options?: GraphGetLinksOptions) {
    let filter: ScalarFilter;
    let locales: string[] | undefined;

    if (typeof reference === 'string' && reference.startsWith('graph://')) {
      const ref = this.parseGraphReference(reference);
      filter = referenceScalarFilter(ref);
      locales = options?.locales ?? (ref.locale ? [ref.locale] : undefined);
    } else if (typeof reference === 'string') {
      filter = pathScalarFilter(reference, options?.host ?? this.host);
      locales = options?.locales;
    } else {
      filter = referenceScalarFilter(reference);
      locales = options?.locales ?? (reference.locale ? [reference.locale] : undefined);
    }

    const variables = { ...filter.variables, locale: locales };
    const query = getLinksQuery('GetPath', filter.filterShape);

    const cacheEnabled = options?.cache ?? this.cache;
    const storedEnabled = options?.stored ?? true;
    const activeSlot = options?.slot ?? this.slot;

    const data = (await this.request(
      query,
      variables,
      undefined,
      cacheEnabled,
      activeSlot,
      storedEnabled,
    )) as GetLinksResponse;

    if (!data._Content.item._id) {
      return null;
    }

    const links = data._Content.item._link._Page.items;
    const sortedKeys = data._Content.item._metadata.path;

    if (!sortedKeys) {
      throw new GraphResponseError(
        'The `_metadata` does not contain any `path` field. Ensure that the path you requested is an actual page and not a block. If the problem persists, contact Optimizely support',
        {
          request: {
            query,
            variables,
          },
        },
      );
    }

    const linkMap = new Map(links.map(link => [link._metadata?.key, link]));
    return sortedKeys.map(key => linkMap.get(key)).filter(item => item !== undefined);
  }

  /**
   * Given the path or reference of a page, get its "items" (i.e. the children pages)
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog`
   * - GraphReference: Object like `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' }`
   * - String format: `graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all child/descendant pages
   *
   * @example
   * ```typescript
   * // Using path
   * const items = await client.getItems('/blog');
   *
   * // Using GraphReference
   * const items = await client.getItems({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Using string format
   * const items = await client.getItems('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');
   * ```
   */
  async getItems(reference: string | GraphReference, options?: GraphGetLinksOptions) {
    let filter: ScalarFilter;
    let locales: string[] | undefined;

    if (typeof reference === 'string' && reference.startsWith('graph://')) {
      const ref = this.parseGraphReference(reference);
      filter = referenceScalarFilter(ref);
      locales = options?.locales ?? (ref.locale ? [ref.locale] : undefined);
    } else if (typeof reference === 'string') {
      filter = pathScalarFilter(reference, options?.host ?? this.host);
      locales = options?.locales;
    } else {
      filter = referenceScalarFilter(reference);
      locales = options?.locales ?? (reference.locale ? [reference.locale] : undefined);
    }

    const variables = { ...filter.variables, locale: locales };
    const query = getItemsQuery('GetItems', filter.filterShape);

    const cacheEnabled = options?.cache ?? this.cache;
    const storedEnabled = options?.stored ?? true;
    const activeSlot = options?.slot ?? this.slot;

    const data = (await this.request(
      query,
      variables,
      undefined,
      cacheEnabled,
      activeSlot,
      storedEnabled,
    )) as GetLinksResponse;

    if (!data._Content.item._id) {
      return null;
    }

    return data?._Content?.item._link._Page.items;
  }

  async getPreviewContent(params: PreviewParams, options?: GraphQueryOptions) {
    return withGetPreviewContentSpan(params, async span => {
      const filter = previewScalarFilter(params);
      const storedEnabled = options?.stored ?? true;
      const activeSlot = options?.slot ?? this.slot;
      const damMode = options?.dam ?? this.dam;

      const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
        await this.getContentMetaData(
          filter,
          params.preview_token,
          false,
          activeSlot,
          storedEnabled,
          'all',
          damMode,
        );

      if (!contentTypeName) {
        throw new GraphResponseError(
          `Content with key '${params.key}' could not be found. Verify it exists in the CMS.`,
          { request: { variables: filter.variables, query: getMetadataQuery(filter.filterShape, 'all') } },
        );
      }

      span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

      setContext({
        previewToken: params.preview_token,
        version: params.ver,
        locale: params.loc,
        type: contentTypeName,
        key: params.key,
        mode: params.ctx,
      });

      const query = createSingleContentQuery(contentTypeName, {
        damEnabled,
        maxFragmentThreshold: this.maxFragmentThreshold,
        expandContracts: this.expandContracts,
        formsEnabled,
        sectionTypes,
        filterShape: filter.filterShape,
        variationMode: 'all',
      });

      const response = await this.request(
        query,
        filter.variables,
        params.preview_token,
        false,
        activeSlot,
        storedEnabled,
      );

      return decorateWithContext(
        await this.resolveFormNodes(
          liftSectionNodes(removeTypePrefix(response?._Content?.item)),
          {
            damEnabled,
            sectionTypes,
            previewToken: params.preview_token,
            cache: false,
            slot: activeSlot,
          },
        ),
        params,
      );
    });
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
  private parseGraphReference(referenceString: string): GraphReference {
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

  /**
   * Unified content fetching method using GraphReference.
   * Fetches content by key with optional locale and version parameters.
   *
   * Supports both object and string formats:
   * - Object: `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en', version: '123' }`
   * - String: `graph://source/type/key?loc=en&ver=123`
   *
   * **Priority rules:**
   * - If `version` is specified, it takes priority (ignores locale-based filtering)
   * - If only `locale` is specified, fetches latest published version in that locale
   * - If neither specified, fetches latest published version
   *
   * **Note:** This method always returns published content. To fetch draft content,
   * use `getPreviewContent()` with a preview token instead.
   * @param reference - GraphReference object or string in graph:// format
   * @param previewToken - Optional preview token for preview mode
   * @returns The requested content item, or null if not found
   *
   * @example
   * ```typescript
   * // Fetch latest published content by key
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });
   *
   * // Fetch latest published content in specific locale
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Fetch specific version (version has priority over locale)
   * const content = await client.getContent({
   *   key: '880777d5a2824399b07e93e3ca70668e',
   *   version: '123',
   *   locale: 'en' // This will be ignored when version is specified
   * });
   *
   * // Using string format
   * const content = await client.getContent('graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en&ver=123');
   *
   * // With preview token
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', version: '123' }, { previewToken: 'token' });
   * ```
   */
  async getContent(reference: string | GraphReference, options?: GraphGetItemOptions) {
    const ref =
      typeof reference === 'string' ? this.parseGraphReference(reference) : reference;

    return withGetContentSpan(ref, async span => {
      const previewToken = options?.previewToken;

      const cacheEnabled = options?.cache ?? (previewToken ? false : this.cache);
      const storedEnabled = options?.stored ?? true;
      const activeSlot = options?.slot ?? this.slot;
      const damMode = options?.dam ?? this.dam;

      const filter = referenceScalarFilter(ref);

      const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
        await this.getContentMetaData(
          filter,
          previewToken,
          cacheEnabled,
          activeSlot,
          storedEnabled,
          'none',
          damMode,
        );

      if (!contentTypeName) {
        span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
        return null;
      }

      span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

      try {
        const query = createSingleContentQuery(contentTypeName, {
          damEnabled,
          maxFragmentThreshold: this.maxFragmentThreshold,
          expandContracts: this.expandContracts,
          formsEnabled,
          sectionTypes,
          filterShape: filter.filterShape,
        });

        const response = await this.request(
          query,
          filter.variables,
          previewToken,
          cacheEnabled,
          activeSlot,
          storedEnabled,
        );

        return this.resolveFormNodes(
          liftSectionNodes(removeTypePrefix(response?._Content?.item)),
          {
            damEnabled,
            sectionTypes,
            previewToken,
            cache: cacheEnabled,
            slot: activeSlot,
          },
        );
      } catch (error) {
        if (error instanceof GraphMissingContentTypeError) {
          return null;
        }
        throw error;
      }
    });
  }
}

/**
 * Sets the global graph configuration to be used by getClient()
 * @internal This is called automatically when config is called
 */
function setGraphConfig(config: GraphOptions | undefined) {
  if (config) {
    globalGraphConfig = config;
  }
}

/**
 * Gets the global graph configuration
 * @internal
 */
export function getGraphConfig(): GraphOptions | null {
  return globalGraphConfig;
}

/**
 * Configure the Optimizely Graph client with your settings.
 *
 * Call this function once at the start of your application.
 * After configuration, you can use getClient() anywhere in your app.
 *
 * @param config - The graph configuration object with your API key and optional settings
 *
 * @example
 * ```tsx
 * // In your root layout or app entry point
 * import { config } from '@optimizely/cms-sdk';
 *
 * config({
 *   apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
 *   graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY, // optional
 *   host: 'example.com', // optional
 * });
 *
 * export default function RootLayout({ children }) {
 *   return <html><body>{children}</body></html>;
 * }
 * ```
 */
export function config(options: GraphOptions) {
  if (
    !options.apiKey ||
    typeof options.apiKey !== 'string' ||
    options.apiKey.trim().length === 0
  ) {
    throw new OptimizelyGraphError(
      'Invalid Optimizely Graph API key: key must be a non-empty string. ' +
        'Check that your environment variable is set correctly (e.g., process.env.OPTIMIZELY_GRAPH_SINGLE_KEY).',
    );
  }
  setGraphConfig(options);
}

/**
 * Creates and returns a GraphClient instance using the global configuration.
 *
 * The graph configuration must be set first using config().
 *
 * @param overrideOptions - Optional GraphOptions to override the global configuration
 * @returns A configured GraphClient instance
 * @throws Error if graph configuration is not set
 *
 * @example
 * ```ts
 * // In your root layout (e.g., layout.tsx)
 * import { config } from '@optimizely/cms-sdk';
 *
 * config({
 *   apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
 *   graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY, // optional
 *   host: 'example.com', // optional
 * });
 *
 * // In your components
 * import { getClient } from '@optimizely/cms-sdk';
 *
 * const client = getClient();
 * const content = await client.getContentByPath('/my-page/');
 *
 * // Or override config for specific use cases
 * const customClient = getClient({ host: 'custom.example.com' });
 * ```
 */
export function getClient(overrideOptions?: Partial<GraphOptions>): GraphClient {
  if (!globalGraphConfig) {
    throw new OptimizelyGraphError(
      'The Graph client is not configured. Call config() in the application entry point.',
    );
  }

  const options: GraphOptions = {
    ...globalGraphConfig,
    ...(overrideOptions ?? {}),
  };

  return new GraphClient(options.apiKey, options);
}
