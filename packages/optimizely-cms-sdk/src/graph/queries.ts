import {
  type FilterShape,
  type ScalarFilter,
  type VariationMode,
  getFilterVarDecls,
  getFilterWhereClause,
  getVariationVarDecls,
  getVariationClause,
} from './filters.js';
import { isFormContentType } from '../model/formContentTypes.js';
import { getCachedContentTypes } from '../util/queryUtils.js';
import { PreviewParams } from './options.js';

// METADATA QUERY

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

/** The content type, DAM and forms probe for one piece of content. */
export function getMetadataQuery(
  shape: FilterShape,
  variationMode: VariationMode = 'none',
): string {
  const varDecls = getFilterVarDecls(shape);
  const variationVars = getVariationVarDecls(variationMode);
  const allVars = [
    varDecls,
    variationVars,
    '$formsWhere: _ExperienceWhereInput',
    '$withForms: Boolean!',
  ]
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

// SECTION TYPES

/**
 * The content types that really own a `composition` field.
 *
 * Kept in its own document on purpose. Graph truncates `possibleTypes` to just
 * `_Section` when this introspection shares a query with a data field, which
 * silently produces the opposite of the intended answer.
 */
export const GET_SECTION_TYPES_QUERY = `
query GetSectionTypes {
  sectionTypes: __type(name: "_ISection") {
    possibleTypes {
      name
    }
  }
}
`;

/**
 * Whether the application registered a section of its own.
 *
 * The schema lookup only changes the outcome for such a type: a form container
 * is handled by the fallback, and everything else is not a section either way.
 */
export const hasOwnSectionTypes = (): boolean =>
  getCachedContentTypes().some(
    contentType =>
      'baseType' in contentType &&
      (contentType.baseType === '_section' ||
        ('compositionBehaviors' in contentType &&
          (contentType.compositionBehaviors?.includes('sectionEnabled') ?? false))) &&
      !isFormContentType(contentType.key),
  );

// FORMS

/** Content type key of the section Optimizely Forms uses for a form. */
export const FORM_CONTAINER_TYPE = 'OptiFormsContainerData';

/** Narrows a content filter to "the same content, and it contains a form". */
export const formsOnPageFilter = (where: unknown) => ({
  _and: [where, { composition: { nodes: { type: { eq: FORM_CONTAINER_TYPE } } } }],
});

/** Reconstructs a where object from scalar filter variables (for the forms probe). */
export function buildWhereObject(filter: ScalarFilter): Record<string, unknown> {
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
export function findUnresolvedForms(
  value: any,
  found: any[] = [],
  seen = new Set(),
): any[] {
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

// LINKS AND ITEMS QUERIES

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

/** The ancestors of one piece of content. */
export function getLinksQuery(opName: string, shape: FilterShape): string {
  const filterVars = getFilterVarDecls(shape);
  const whereClause = getFilterWhereClause(shape);
  const allVars = [filterVars, '$locale: [Locales]'].sort().join(', ');
  return `
query ${opName}(${allVars}) {
  _Content(${whereClause}, locale: $locale) ${LINKS_BODY('PATH')}
}`;
}

/** The children of one piece of content. */
export function getItemsQuery(opName: string, shape: FilterShape): string {
  const filterVars = getFilterVarDecls(shape);
  const whereClause = getFilterWhereClause(shape);
  const allVars = [filterVars, '$locale: [Locales]'].sort().join(', ');
  return `
query ${opName}(${allVars}) {
  _Content(${whereClause}, locale: $locale) ${LINKS_BODY('ITEMS')}
}`;
}

export type GetLinksResponse = {
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

// RESPONSE TRANSFORMS

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
export function liftSectionNodes(item: any): any {
  if (typeof item !== 'object' || item === null) return item;
  if (Array.isArray(item.nodes)) return item;

  const composition = item.composition;
  if (composition?.nodeType !== 'section' || !Array.isArray(composition.nodes)) {
    return item;
  }

  return { ...item, nodes: composition.nodes };
}

/** Adds an extra `__context` property next to each `__typename` property */
export function decorateWithContext(obj: any, params: PreviewParams): any {
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
