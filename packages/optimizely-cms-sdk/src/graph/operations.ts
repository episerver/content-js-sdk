import {
  createSingleContentQuery,
  ItemsResponse,
  createMultipleContentQuery,
} from './createQuery.js';
import { GraphResponseError, GraphMissingContentTypeError } from './error.js';
import {
  type ScalarFilter,
  type VariationMode,
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
import { SemanticAttributes } from '../telemetry/index.js';
import { logWarning } from '../telemetry/logger.js';
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
  type GraphQueryOptions,
  type GraphReference,
  type GraphSlot,
  type PreviewParams,
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
        ...fragmentContext(context, options.damEnabled),
        formsEnabled: true,
        sectionTypes: options.sectionTypes,
        filterShape: filter.filterShape,
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

// METADATA

/**
 * Fetches the content type metadata for a given content input.
 *
 * @param context - The client performing the request.
 * @param filter - The scalar filter identifying the content.
 * @param queryOptions - The request settings, already resolved against the defaults.
 * @param previewToken - Optional preview token for fetching preview content.
 * @returns The content type, whether DAM is enabled, and whether this page
 *   needs the Optimizely Forms fragments.
 */
async function getContentMetaData(
  context: GraphClientContext,
  filter: ScalarFilter,
  queryOptions: ResolvedQueryOptions,
  previewToken?: string,
  variationMode: VariationMode = 'none',
) {
  // Skip if forms aren't registered; local lookup, no round trip.
  const mayRenderForms = isContentTypeRegistered(FORM_CONTAINER_TYPE);

  const query = getMetadataQuery(filter.filterShape, variationMode, mayRenderForms);
  const variables = {
    ...filter.variables,
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
  const { dam } = context.fragmentDefaults;
  const damEnabled =
    dam === 'on' ? true
    : dam === 'off' ? false
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

    const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(context, filter, queryOptions, undefined, varMode);

    if (!contentTypeName) {
      span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
      if (queryOptions.host) {
        logWarning(
          `No content found for path "${path}" with host "${queryOptions.host}". If all pages are returning empty, verify that your host value matches a base URL registered in Optimizely Graph.`,
          { 'host.value': queryOptions.host, 'content.path': path },
        );
      }
      return [];
    }

    span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

    try {
      const query = createMultipleContentQuery(contentTypeName, {
        ...fragmentContext(context, damEnabled),
        formsEnabled,
        sectionTypes,
        filterShape: filter.filterShape,
        variationMode: varMode,
      });

      const response = (await context.request(
        query,
        variables,
        undefined,
        queryOptions.cache,
        queryOptions.slot,
        queryOptions.stored,
      )) as ItemsResponse<T>;

      return Promise.all(
        response?._Content?.items.map((item: unknown) =>
          resolveFormNodes(context, liftSectionNodes(removeTypePrefix(item)), {
            damEnabled,
            sectionTypes,
            cache: queryOptions.cache,
            slot: queryOptions.slot,
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

/** The draft a preview token points at. See `GraphClient.getPreviewContent`. */
export async function getPreviewContent(
  context: GraphClientContext,
  params: PreviewParams,
  options?: GraphQueryOptions,
) {
  return withGetPreviewContentSpan(params, async span => {
    const filter = previewScalarFilter(params);
    const queryOptions = resolveQueryOptions(context, options);

    const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(
        context,
        filter,
        { ...queryOptions, cache: false },
        params.preview_token,
        'all',
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
    });

    const response = await context.request(
      query,
      filter.variables,
      params.preview_token,
      false,
      queryOptions.slot,
      queryOptions.stored,
    );

    return decorateWithContext(
      await resolveFormNodes(
        context,
        liftSectionNodes(removeTypePrefix(response?._Content?.item)),
        {
          damEnabled,
          sectionTypes,
          previewToken: params.preview_token,
          cache: false,
          slot: queryOptions.slot,
        },
      ),
      params,
    );
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

    const { contentTypeName, damEnabled, formsEnabled, sectionTypes } =
      await getContentMetaData(context, filter, queryOptions, previewToken, 'none');

    if (!contentTypeName) {
      span.setAttribute(SemanticAttributes.OPTI_CONTENT_FOUND, false);
      return null;
    }

    span.setAttribute(SemanticAttributes.OPTI_CONTENT_TYPE, contentTypeName);

    try {
      const query = createSingleContentQuery(contentTypeName, {
        ...fragmentContext(context, damEnabled),
        formsEnabled,
        sectionTypes,
        filterShape: filter.filterShape,
      });

      const response = await context.request(
        query,
        filter.variables,
        previewToken,
        queryOptions.cache,
        queryOptions.slot,
        queryOptions.stored,
      );

      return resolveFormNodes(
        context,
        liftSectionNodes(removeTypePrefix(response?._Content?.item)),
        {
          damEnabled,
          sectionTypes,
          previewToken,
          cache: queryOptions.cache,
          slot: queryOptions.slot,
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

// NAVIGATION

/** The ancestors of a page, top-most first. See `GraphClient.getPath`. */
export async function getPath(
  context: GraphClientContext,
  reference: string | GraphReference,
  options?: GraphGetLinksOptions,
) {
  const queryOptions = resolveQueryOptions(context, options);

  let filter: ScalarFilter;
  let locales: string[] | undefined;

  if (typeof reference === 'string' && reference.startsWith('graph://')) {
    const ref = parseGraphReference(reference);
    filter = referenceScalarFilter(ref);
    locales = options?.locales ?? (ref.locale ? [ref.locale] : undefined);
  } else if (typeof reference === 'string') {
    filter = pathScalarFilter(reference, queryOptions.host);
    locales = options?.locales;
  } else {
    filter = referenceScalarFilter(reference);
    locales = options?.locales ?? (reference.locale ? [reference.locale] : undefined);
  }

  const variables = { ...filter.variables, locale: locales };
  const query = getLinksQuery('GetPath', filter.filterShape);

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

  let filter: ScalarFilter;
  let locales: string[] | undefined;

  if (typeof reference === 'string' && reference.startsWith('graph://')) {
    const ref = parseGraphReference(reference);
    filter = referenceScalarFilter(ref);
    locales = options?.locales ?? (ref.locale ? [ref.locale] : undefined);
  } else if (typeof reference === 'string') {
    filter = pathScalarFilter(reference, queryOptions.host);
    locales = options?.locales;
  } else {
    filter = referenceScalarFilter(reference);
    locales = options?.locales ?? (reference.locale ? [reference.locale] : undefined);
  }

  const variables = { ...filter.variables, locale: locales };
  const query = getItemsQuery('GetItems', filter.filterShape);

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
