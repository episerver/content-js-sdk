import {
  createSingleContentQuery,
  ItemsResponse,
  createMultipleContentQuery,
} from './createQuery.js';
import { GraphResponseError, GraphMissingContentTypeError } from './error.js';
import {
  type ScalarFilter,
  type GraphVariationInput,
  pathScalarFilter,
  previewScalarFilter,
  referenceScalarFilter,
  getVariationMode,
  getVariationVariables,
} from './filters.js';
import { setContext } from '../context/config.js';
import { isContentTypeRegistered } from '../model/contentTypeRegistry.js';
import { isFormContentType } from '../model/formContentTypes.js';
import { contentTypeCanHoldForms } from '../util/queryUtils.js';
import { SemanticAttributes, logWarning } from '../telemetry/index.js';
import {
  withGetContentByPathSpan,
  withGetPreviewContentSpan,
  withGetContentSpan,
} from '../telemetry/spans.js';
import {
  type GraphClientContext,
  type GraphGetContentOptions,
  type GraphGetItemOptions,
  type GraphGetLinksOptions,
  type GraphGetPreviewOptions,
  type GraphQueryOptions,
  type GraphReference,
  type GraphSlot,
  type PreviewParams,
  type TaxonomyTerm,
  type ResolvedQueryOptions,
  fragmentContext,
  parseGraphReference,
  resolveQueryOptions,
} from './options.js';
import {
  type GetLinksResponse,
  FORM_CONTAINER_TYPE,
  GET_SECTION_TYPES_QUERY,
  decorateWithContext,
  findUnresolvedForms,
  getItemsQuery,
  getLinksQuery,
  getMetadataQuery,
  hasOwnSectionTypes,
  liftSectionNodes,
  removeTypePrefix,
  toLocaleEnumValues,
} from './queries.js';

// SECTION TYPES

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
function getSectionTypes(
  context: GraphClientContext,
): Promise<ReadonlySet<string> | undefined> {
  // Nothing to learn unless the application has a type whose answer could
  // differ from the default. Forms are covered by the fallback, so an app
  // with no sections of its own never pays for this.
  if (!hasOwnSectionTypes()) return Promise.resolve(undefined);

  const endpoint = `${context.graphUrl}::${context.apiKey}`;
  const cached = sectionTypesByEndpoint.get(endpoint);
  if (cached) return cached;

  const pending = context
    .request(GET_SECTION_TYPES_QUERY, {}, undefined, true, context.queryDefaults.slot)
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

// FORMS

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
async function resolveFormNodes<T>(
  context: GraphClientContext,
  item: T,
  options: {
    damEnabled: boolean;
    taxonomyEnabled?: boolean;
    sectionTypes?: ReadonlySet<string>;
    previewToken?: string;
    cache?: boolean;
    slot?: GraphSlot;
    publishedOnly?: boolean;
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

  const queryOptions = resolveQueryOptions(context, options);

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
        ...fragmentContext(context, options.damEnabled, options.taxonomyEnabled),
        formsEnabled: true,
        sectionTypes: options.sectionTypes,
        filterShape: filter.filterShape,
        // A pinned version is the draft being previewed, which is not published.
        publishedOnly: options.publishedOnly && !version,
      });

      const response = await context.request(
        query,
        filter.variables,
        options.previewToken,
        queryOptions.cache,
        queryOptions.slot,
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

// TAXONOMY HIERARCHY RESOLUTION

const PARENT_FIELDS = 'key displayName';
const PARENT_DEPTH = `{ ${PARENT_FIELDS} parent { ${PARENT_FIELDS} parent { ${PARENT_FIELDS} parent { ${PARENT_FIELDS} parent { ${PARENT_FIELDS} } } } } }`;

const TAXONOMY_BATCH_SIZE = 100;

const RESOLVE_TAXONOMY_QUERY = `
query ResolveTaxonomyTerms($keys: [String!]!) {
  _TaxonomyTerm(where: { _metadata: { key: { in: $keys } } }) {
    items {
      _metadata {
        key
        displayName
        description
        taxonomy
        usage
        parent ${PARENT_DEPTH}
      }
    }
  }
}
`;

type TermMetadata = {
  key: string;
  displayName: string | null;
  description?: string | null;
  taxonomy?: string | null;
  usage?: string | null;
  parent?: { key: string; displayName: string | null; parent?: TermMetadata['parent'] } | null;
};

function buildPath(meta: TermMetadata): Array<{ key: string; displayName: string | null }> {
  const chain: Array<{ key: string; displayName: string | null }> = [];
  let current: TermMetadata['parent'] = { key: meta.key, displayName: meta.displayName, parent: meta.parent };
  while (current) {
    chain.push({ key: current.key, displayName: current.displayName });
    current = current.parent;
  }
  chain.reverse();
  return chain;
}

function metadataToTaxonomyTerm(key: string, meta: TermMetadata | undefined): TaxonomyTerm {
  if (!meta) {
    return {
      key,
      displayName: null,
      description: null,
      taxonomy: null,
      usage: null,
      sortOrder: null,
      isAvailable: null,
      isSelectable: null,
      path: [{ key, displayName: null }],
    };
  }

  return {
    key,
    displayName: meta.displayName,
    description: meta.description ?? null,
    taxonomy: meta.taxonomy ?? null,
    usage: meta.usage ?? null,
    sortOrder: null,
    isAvailable: null,
    isSelectable: null,
    path: buildPath(meta),
  };
}

/**
 * Per-endpoint, per-locale cache for resolved taxonomy terms.
 *
 * Taxonomy terms change rarely compared to content, so caching them for the
 * lifetime of the process avoids redundant `_TaxonomyTerm` queries when
 * multiple content items share the same categories (e.g., 20 items on a page).
 *
 * Follows the same pattern as {@linkcode sectionTypesByEndpoint}.
 */
const taxonomyTermCache = new Map<string, Map<string, TaxonomyTerm>>();

function taxonomyCacheKey(context: GraphClientContext, locale: string | undefined): string {
  return `${context.graphUrl}::${context.apiKey}::${locale ?? ''}`;
}

export function clearTaxonomyCache(): void {
  taxonomyTermCache.clear();
}

async function resolveTaxonomyTerms(
  context: GraphClientContext,
  termKeys: string[],
  locale: string | undefined,
): Promise<TaxonomyTerm[] | undefined> {
  if (termKeys.length === 0) return [];

  const cacheKey = taxonomyCacheKey(context, locale);
  let localCache = taxonomyTermCache.get(cacheKey);
  if (!localCache) {
    localCache = new Map();
    taxonomyTermCache.set(cacheKey, localCache);
  }

  const cached: TaxonomyTerm[] = [];
  const uncachedKeys: string[] = [];

  for (const key of [...new Set(termKeys)]) {
    const hit = localCache.get(key);
    if (hit) {
      cached.push(hit);
    } else {
      uncachedKeys.push(key);
    }
  }

  if (uncachedKeys.length > 0) {
    try {
      const batches: string[][] = [];
      for (let i = 0; i < uncachedKeys.length; i += TAXONOMY_BATCH_SIZE) {
        batches.push(uncachedKeys.slice(i, i + TAXONOMY_BATCH_SIZE));
      }

      const batchResults = await Promise.all(
        batches.map(batch =>
          context.request(
            RESOLVE_TAXONOMY_QUERY,
            { keys: batch, ...(locale && { locale }) },
            undefined,
            true,
          ),
        ),
      );

      const fetchedMap = new Map<string, TermMetadata>();
      for (const data of batchResults) {
        const items: Array<{ _metadata: TermMetadata }> =
          data?._TaxonomyTerm?.items ?? [];
        for (const item of items) {
          fetchedMap.set(item._metadata.key, item._metadata);
        }
      }

      for (const key of uncachedKeys) {
        const term = metadataToTaxonomyTerm(key, fetchedMap.get(key));
        localCache.set(key, term);
      }
    } catch {
      logWarning('Taxonomy hierarchy resolution failed; resolvedCategories will be undefined');
      return undefined;
    }
  }

  return termKeys.map(key => localCache!.get(key) ?? metadataToTaxonomyTerm(key, undefined));
}

// METADATA

/**
 * Fetches the content type metadata for a given content input.
 *
 * @param context - The client performing the request.
 * @param filter - The scalar filter identifying the content.
 * @param queryOptions - The request settings, already resolved against the defaults.
 * @param previewToken - Optional preview token for fetching preview content.
 * @param variation - The variation filter. Takes the input rather than a
 *   `VariationMode` so the `$vN` values travel with the declarations; a mode
 *   alone knows how many variables the query declares but not what they are.
 * @returns The content type, whether DAM is enabled, and whether this page
 *   needs the Optimizely Forms fragments.
 */
async function getContentMetaData(
  context: GraphClientContext,
  filter: ScalarFilter,
  queryOptions: ResolvedQueryOptions,
  previewToken?: string,
  variation?: GraphVariationInput,
) {
  // Skip if forms aren't registered; local lookup, no round trip.
  const mayRenderForms = isContentTypeRegistered(FORM_CONTAINER_TYPE);

  const query = getMetadataQuery(
    filter.filterShape,
    getVariationMode(variation),
    mayRenderForms,
    queryOptions.publishedOnly,
  );
  const variables = {
    ...filter.variables,
    ...getVariationVariables(variation),
    ...(mayRenderForms && { withForms: true }),
  };

  const [data, sectionTypes] = await Promise.all([
    context.request(
      query,
      variables,
      previewToken,
      queryOptions.cache,
      queryOptions.slot,
      queryOptions.stored,
    ),
    getSectionTypes(context),
  ]);

  const contentTypeName = data._Content?.item?._metadata?.types?.[0];

  // Determine if DAM is enabled based on the presence of cmp_Asset type
  // The metadata query always probes for cmp_Asset; forced modes just ignore it.
  const { dam, taxonomy } = context.fragmentDefaults;
  const damEnabled =
    dam === 'on' ? true
    : dam === 'off' ? false
    : data.damAssetType !== null;

  const taxonomyEnabled =
    taxonomy === 'on' ? true
    : taxonomy === 'off' ? false
    : data.taxonomyType !== null;

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
      taxonomyEnabled,
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

  return { contentTypeName, damEnabled, taxonomyEnabled, formsEnabled: needsForms, sectionTypes };
}

// CONTENT FETCHING

/** Every item published at a URL path. See `GraphClient.getContentByPath`. */
export async function getContentByPath<T = any>(
  context: GraphClientContext,
  path: string,
  options?: GraphGetContentOptions,
) {
  const queryOptions = resolveQueryOptions(context, options);

  return withGetContentByPathSpan(path, queryOptions.cache, async span => {
    const filter = pathScalarFilter(path, queryOptions.host);
    const varMode = getVariationMode(options?.variation);
    const variationVars = getVariationVariables(options?.variation);
    const variables = { ...filter.variables, ...variationVars };

    const { contentTypeName, damEnabled, taxonomyEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(
        context,
        filter,
        queryOptions,
        undefined,
        options?.variation,
      );

    if (!contentTypeName) {
      span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
      return [];
    }

    span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

    try {
      const query = createMultipleContentQuery(contentTypeName, {
        ...fragmentContext(context, damEnabled, taxonomyEnabled),
        formsEnabled,
        sectionTypes,
        filterShape: filter.filterShape,
        variationMode: varMode,
        publishedOnly: queryOptions.publishedOnly,
      });

      const response = (await context.request(
        query,
        variables,
        undefined,
        queryOptions.cache,
        queryOptions.slot,
        queryOptions.stored,
      )) as ItemsResponse<T>;

      const items = await Promise.all(
        response?._Content?.items.map((item: unknown) =>
          resolveFormNodes(context, liftSectionNodes(removeTypePrefix(item)), {
            damEnabled,
            taxonomyEnabled,
            sectionTypes,
            cache: queryOptions.cache,
            slot: queryOptions.slot,
            publishedOnly: queryOptions.publishedOnly,
          }),
        ) ?? [],
      );

      if (options?.resolveTaxonomy && taxonomyEnabled) {
        await Promise.all(
          items.map(async (item: any) => {
            const categories: string[] | undefined = item?._metadata?.categories;
            if (categories && categories.length > 0) {
              item._metadata.resolvedCategories = await resolveTaxonomyTerms(
                context,
                categories,
                item?._metadata?.locale,
              );
            } else if (categories) {
              item._metadata.resolvedCategories = [];
            }
          }),
        );
      }

      return items;
    } catch (error) {
      if (error instanceof GraphMissingContentTypeError) {
        return [];
      }
      throw error;
    }
  });
}

/** The draft a preview token points at. See `GraphClient.getPreviewContent`. */
export async function getPreviewContent(
  context: GraphClientContext,
  params: PreviewParams,
  options?: GraphGetPreviewOptions,
) {
  return withGetPreviewContentSpan(params, async span => {
    const filter = previewScalarFilter(params);
    const queryOptions = resolveQueryOptions(context, options);

    // A preview exists to show the draft, so the published filter never applies here.
    const { contentTypeName, damEnabled, taxonomyEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(
        context,
        filter,
        { ...queryOptions, cache: false, publishedOnly: false },
        params.preview_token,
        { include: 'ALL' },
      );

    if (!contentTypeName) {
      throw new GraphResponseError(
        `Content with key '${params.key}' could not be found. Verify it exists in the CMS.`,
        {
          request: {
            variables: filter.variables,
            query: getMetadataQuery(filter.filterShape, 'all'),
          },
        },
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
      ...fragmentContext(context, damEnabled),
      formsEnabled,
      sectionTypes,
      filterShape: filter.filterShape,
      variationMode: 'all',
      publishedOnly: false,
    });

    const response = await context.request(
      query,
      filter.variables,
      params.preview_token,
      false,
      queryOptions.slot,
      queryOptions.stored,
    );

    const result = await resolveFormNodes(
      context,
      liftSectionNodes(removeTypePrefix(response?._Content?.item)),
      {
        damEnabled,
        taxonomyEnabled,
        sectionTypes,
        previewToken: params.preview_token,
        cache: false,
        slot: queryOptions.slot,
        publishedOnly: false,
      },
    );

    if (result && options?.resolveTaxonomy && taxonomyEnabled) {
      const categories: string[] | undefined = result?._metadata?.categories;
      if (categories && categories.length > 0) {
        result._metadata.resolvedCategories = await resolveTaxonomyTerms(
          context,
          categories,
          params.loc,
        );
      } else if (categories) {
        result._metadata.resolvedCategories = [];
      }
    }

    return decorateWithContext(result, params);
  });
}

/** One item, addressed by reference. See `GraphClient.getContent`. */
export async function getContent(
  context: GraphClientContext,
  reference: string | GraphReference,
  options?: GraphGetItemOptions,
) {
  const ref = typeof reference === 'string' ? parseGraphReference(reference) : reference;

  return withGetContentSpan(ref, async span => {
    const previewToken = options?.previewToken;

    // A preview is uncacheable unless the caller insists.
    const queryOptions = resolveQueryOptions(
      context,
      options,
      previewToken ? { cache: false } : {},
    );

    const filter = referenceScalarFilter(ref);

    // A preview token or a pinned version asks for one exact version, which is
    // rarely the published one.
    const publishedOnly = queryOptions.publishedOnly && !previewToken && !ref.version;

    const { contentTypeName, damEnabled, taxonomyEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(
        context,
        filter,
        { ...queryOptions, publishedOnly },
        previewToken,
      );

    if (!contentTypeName) {
      span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
      return null;
    }

    span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

    try {
      const query = createSingleContentQuery(contentTypeName, {
        ...fragmentContext(context, damEnabled, taxonomyEnabled),
        formsEnabled,
        sectionTypes,
        filterShape: filter.filterShape,
        publishedOnly,
      });

      const response = await context.request(
        query,
        filter.variables,
        previewToken,
        queryOptions.cache,
        queryOptions.slot,
        queryOptions.stored,
      );

      const result = await resolveFormNodes(
        context,
        liftSectionNodes(removeTypePrefix(response?._Content?.item)),
        {
          damEnabled,
          taxonomyEnabled,
          sectionTypes,
          previewToken,
          cache: queryOptions.cache,
          slot: queryOptions.slot,
          publishedOnly,
        },
      );

      if (result && options?.resolveTaxonomy && taxonomyEnabled) {
        const categories: string[] | undefined = result?._metadata?.categories;
        if (categories && categories.length > 0) {
          result._metadata.resolvedCategories = await resolveTaxonomyTerms(
            context,
            categories,
            ref.locale,
          );
        } else if (categories) {
          result._metadata.resolvedCategories = [];
        }
      }

      return result;
    } catch (error) {
      if (error instanceof GraphMissingContentTypeError) {
        return null;
      }
      throw error;
    }
  });
}

// NAVIGATION

/**
 * The filter and locale list behind `getPath` and `getItems`.
 *
 * A requested locale is carried only by the `locale:` field argument, never by
 * `_metadata.locale` in the `where` clause. Those two are not interchangeable:
 * a language-fallback document keeps the `_metadata.locale` of the language it
 * was authored in and announces the requested one through `fallbackForLocale`,
 * so filtering on `_metadata.locale` excludes every fallback and the lookup
 * comes back empty. The `locale:` argument is what resolves fallbacks.
 */
function linksFilter(
  reference: string | GraphReference,
  host: string | undefined,
  options?: GraphGetLinksOptions,
): { filter: ScalarFilter; locales: string[] | undefined } {
  if (typeof reference === 'string' && !reference.startsWith('graph://')) {
    return { filter: pathScalarFilter(reference, host), locales: options?.locales };
  }

  const ref = typeof reference === 'string' ? parseGraphReference(reference) : reference;
  return {
    filter: referenceScalarFilter({ key: ref.key, version: ref.version }),
    locales: options?.locales ?? (ref.locale ? [ref.locale] : undefined),
  };
}

/** The ancestors of a page, top-most first. See `GraphClient.getPath`. */
export async function getPath(
  context: GraphClientContext,
  reference: string | GraphReference,
  options?: GraphGetLinksOptions,
) {
  const queryOptions = resolveQueryOptions(context, options);
  const { filter, locales } = linksFilter(reference, queryOptions.host, options);

  const variables = { ...filter.variables, locale: toLocaleEnumValues(locales) };
  const publishedOnly = queryOptions.publishedOnly && !filter.variables.version;
  const query = getLinksQuery('GetPath', filter.filterShape, publishedOnly);

  const data = (await context.request(
    query,
    variables,
    undefined,
    queryOptions.cache,
    queryOptions.slot,
    queryOptions.stored,
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

/** The children of a page. See `GraphClient.getItems`. */
export async function getItems(
  context: GraphClientContext,
  reference: string | GraphReference,
  options?: GraphGetLinksOptions,
) {
  const queryOptions = resolveQueryOptions(context, options);
  const { filter, locales } = linksFilter(reference, queryOptions.host, options);

  const variables = { ...filter.variables, locale: toLocaleEnumValues(locales) };
  const publishedOnly = queryOptions.publishedOnly && !filter.variables.version;
  const query = getItemsQuery('GetItems', filter.filterShape, publishedOnly);

  const data = (await context.request(
    query,
    variables,
    undefined,
    queryOptions.cache,
    queryOptions.slot,
    queryOptions.stored,
  )) as GetLinksResponse;

  if (!data._Content.item._id) {
    return null;
  }

  return data?._Content?.item._link._Page.items;
}
