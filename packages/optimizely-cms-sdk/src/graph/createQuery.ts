import { AnyProperty } from '../model/properties.js';
import {
  AnyContentType,
  MAIN_BASE_TYPES,
  PermittedTypes,
} from '../model/contentTypes.js';
import {
  getContentType,
  getAllContentTypes,
  getContentTypeByBaseType,
} from '../model/contentTypeRegistry.js';
import {
  getKeyName,
  buildBaseTypeFragments,
  isBaseType,
  toBaseTypeFragmentKey,
  CONTENT_URL_FRAGMENT,
  DAM_ASSET_FRAGMENTS,
} from '../util/baseTypeUtil.js';
import { checkTypeConstraintIssues } from '../util/fragmentConstraintChecks.js';
import { GraphMissingContentTypeError } from './error.js';

/**
 * Options for controlling GraphQL fragment generation behavior.
 */
type FragmentOptions = {
  /**
   * Enable Digital Asset Management (DAM) support for contentReference properties.
   * When true, includes specialized fragments for DAM assets (images, videos, files).
   * @default false
   */
  damEnabled?: boolean;
  /**
   * Maximum number of fragments allowed before logging performance warnings.
   * Helps prevent excessive GraphQL query complexity from unrestricted content types.
   * @default 100
   */
  maxFragmentThreshold?: number;
  /**
   * Whether to include CMS base type fragments (e.g., _IContent, _IPage) in generated fragments.
   * Set to false for component property fragments that don't need base metadata.
   * @default true
   */
  includeBaseFragments?: boolean;
};

let allContentTypes: AnyContentType[] = [];

/**
 * Retrieves and caches all content type definitions.
 * Avoids repeated calls to the content registry.
 * @returns An array of all contentType definitions.
 */
function getCachedContentTypes(): AnyContentType[] {
  if (allContentTypes.length === 0) {
    allContentTypes = getAllContentTypes();
  }
  return allContentTypes;
}

/**
 * Forces a refresh of the cached content type definitions.
 */
function refreshCache() {
  allContentTypes = getAllContentTypes();
}

/** Checks if all properties of a content type have indexingType set to 'disabled' or if there are no properties.
 * @param ct - The content type to check.
 * @returns True if all properties are disabled, false otherwise.
 */
function allPropertiesAreDisabled(ct: AnyContentType): boolean {
  if (!ct || !ct.properties) return false;
  let hasProperties = false;
  for (const k in ct.properties) {
    hasProperties = true;
    if (ct.properties[k]?.indexingType !== 'disabled') return false;
  }
  return hasProperties;
}

/**
 * Converts a property definition into GraphQL fields and fragments.
 * Logs warnings for potential performance or recursion issues based on configuration.
 * @param name - The field name in the selection set.
 * @param property - The property definition from the schema.
 * @param rootName - The root content type name used for tracing and warning messages.
 * @param suffix - Optional suffix for the fragment name.
 * @param visited - A set of already visited fragments to prevent infinite recursion.
 * @param options - Fragment generation options (damEnabled, maxFragmentThreshold).
 * @returns An object containing GraphQL field strings and extra dependent fragments.
 */
function convertProperty(
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions = {},
): {
  fields: string[];
  extraFragments: string[];
  includesDamAssetsFragments: boolean;
} {
  const { maxFragmentThreshold = 100 } = options;

  const result = convertPropertyField(
    name,
    property,
    rootName,
    suffix,
    visited,
    options,
  );

  // logs warnings if the fragment generation causes potential issues
  const warningMessage = checkTypeConstraintIssues(
    rootName,
    property,
    result,
    maxFragmentThreshold,
  );

  if (warningMessage) {
    console.warn(warningMessage);
  }

  return result;
}

/**
 * Converts a property definition into a GraphQL field selection and any dependent fragments.
 * @param name - The field name in the selection set.
 * @param property - The property definition from the schema.
 * @param rootName - The root content type name for recursive fragment generation.
 * @param suffix - Optional suffix for the fragment name.
 * @param visited - A set of already visited fragments to prevent infinite recursion.
 * @param options - Fragment generation options (damEnabled, maxFragmentThreshold).
 * @returns An object containing GraphQL field strings and extra dependent fragments.
 */
function convertPropertyField(
  name: string,
  property: AnyProperty,
  rootName: string,
  suffix: string,
  visited: Set<string>,
  options: FragmentOptions = {},
): {
  fields: string[];
  extraFragments: string[];
  includesDamAssetsFragments: boolean;
} {
  const { damEnabled = false, maxFragmentThreshold = 100 } = options;
  const fields: string[] = [];
  const subfields: string[] = [];
  const extraFragments: string[] = [];
  let includesDamAssetsFragments = false;
  const nameInFragment = `${rootName}${suffix}__${name}:${name}`;

  if (property.type === 'component') {
    const key = property.contentType.key;
    const fragmentName = `${key}Property`;
    extraFragments.push(
      ...createFragment(key, visited, 'Property', {
        damEnabled,
        maxFragmentThreshold,
        includeBaseFragments: false,
      }),
    );
    fields.push(`${nameInFragment} { ...${fragmentName} }`);
  } else if (property.type === 'content') {
    const allowed = resolveAllowedTypes(
      property.allowedTypes,
      property.restrictedTypes,
    );

    for (const t of allowed) {
      let key = getKeyName(t);
      // If the key is '_self', we use the root name (since it's self-referential)
      if (key === '_self') {
        key = rootName;
      }
      extraFragments.push(
        ...createFragment(key, visited, '', {
          damEnabled,
          maxFragmentThreshold,
          includeBaseFragments: true,
        }),
      );
      subfields.push(`...${key}`);
    }

    const uniqueSubfields = ['__typename', ...new Set(subfields)].join(' '); // remove duplicates
    fields.push(`${nameInFragment} { ${uniqueSubfields} }`);
  } else if (property.type === 'richText') {
    fields.push(`${nameInFragment} { html, json }`);
  } else if (property.type === 'url') {
    extraFragments.push(CONTENT_URL_FRAGMENT);
    fields.push(`${nameInFragment} { ...ContentUrl }`);
  } else if (property.type === 'link') {
    extraFragments.push(CONTENT_URL_FRAGMENT);
    fields.push(`${nameInFragment} { text title target url { ...ContentUrl }}`);
  } else if (property.type === 'contentReference') {
    extraFragments.push(CONTENT_URL_FRAGMENT);
    const itemFragment = damEnabled ? ' ...ContentReferenceItem' : '';
    fields.push(`${name} { key url { ...ContentUrl }${itemFragment} }`);
    // Mark that contentReference type is used and based on damEnabled value, trigger DAM fragments to be included at root level
    includesDamAssetsFragments = damEnabled;
  } else if (property.type === 'array') {
    const f = convertProperty(name, property.items, rootName, suffix, visited, {
      damEnabled,
      maxFragmentThreshold,
    });
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
    includesDamAssetsFragments = includesDamAssetsFragments || f.includesDamAssetsFragments;
  } else {
    fields.push(nameInFragment);
  }

  return {
    fields,
    extraFragments: [...new Set(extraFragments)],
    includesDamAssetsFragments,
  };
}

/**
 * Builds experience GraphQL fragments and their dependencies.
 * @param visited - Set of fragment names already visited to avoid cycles.
 * @param options - Fragment generation options.
 * @returns A list of GraphQL fragment strings.
 */
function createExperienceFragments(
  visited: Set<string>,
  options: FragmentOptions = {},
): string[] {
  // Fixed fragments for all experiences
  const fixedFragments = [
    'fragment _IExperience on _IExperience { composition {...ICompositionNode }}',
    'fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }',
  ];

  const experienceNodes = getCachedContentTypes()
    .filter((c) => {
      if (c.baseType === '_component') {
        return (
          'compositionBehaviors' in c &&
          (c.compositionBehaviors?.length ?? 0) > 0
        );
      }
      return false;
    })
    .map((c) => c.key);

  // Get the required fragments
  const extraFragments = experienceNodes
    .filter((n) => !visited.has(n))
    .flatMap((n) => createFragment(n, visited, '', { ...options, includeBaseFragments: true }));

  const nodeNames = experienceNodes.map((n) => `...${n}`).join(' ');
  const componentFragment = `fragment _IComponent on _IComponent { __typename ${nodeNames} }`;

  return [...fixedFragments, ...extraFragments, componentFragment];
}

/**
 * Builds a GraphQL fragment for the requested content-type **and** returns every nested fragment it depends on.
 * @param contentTypeName Name/key of the content-type to expand.
 * @param visited Set of fragment names already on the stack.
 * @param suffix Optional suffix for the fragment name.
 * @param options Fragment generation options (damEnabled, maxFragmentThreshold, includeBaseFragments).
 * @returns Array of fragment strings.
 */
export function createFragment(
  contentTypeName: string,
  visited: Set<string> = new Set(), // shared across recursion
  suffix: string = '',
  options: FragmentOptions = {},
): string[] {
  const {
    damEnabled = false,
    maxFragmentThreshold = 100,
    includeBaseFragments = true,
  } = options;
  const fragmentName = `${contentTypeName}${suffix}`;
  if (visited.has(fragmentName)) return []; // cyclic ref guard
  // Refresh registry cache only on the *root* call (avoids redundant reads)
  if (visited.size === 0) refreshCache();
  visited.add(fragmentName);

  const fields: string[] = ['__typename'];
  const extraFragments: string[] = [];
  let includesDamAssetsFragments = false;

  // Built‑in CMS baseTypes
  if (isBaseType(contentTypeName)) {
    const { fields: f, extraFragments: e } = buildBaseTypeFragments();
    fields.push(...f);
    extraFragments.push(...e);
  } else {
    // User-defined content type
    const ct = getContentType(contentTypeName);
    if (!ct) {
      throw new GraphMissingContentTypeError(contentTypeName);
    }

    // Gather fields for every property
    for (const [propKey, prop] of Object.entries(ct.properties ?? {})) {
      // Skip properties with indexingType "disabled"
      if (prop.indexingType === 'disabled') {
        continue;
      }
      const {
        fields: f,
        extraFragments: e,
        includesDamAssetsFragments: propHasRef,
      } = convertProperty(propKey, prop, contentTypeName, suffix, visited, {
        damEnabled,
        maxFragmentThreshold,
      });
      fields.push(...f);
      extraFragments.push(...e);
      includesDamAssetsFragments = includesDamAssetsFragments || propHasRef;
    }

    // Add fragments for the base type of the user-defined content type
    if (includeBaseFragments) {
      const baseFragments = buildBaseTypeFragments();
      extraFragments.unshift(...baseFragments.extraFragments); // maintain order
      fields.push(...baseFragments.fields);
    }

    if (ct.baseType === '_experience') {
      fields.push('..._IExperience');
      extraFragments.push(
        ...createExperienceFragments(visited, {
          damEnabled,
          maxFragmentThreshold,
        }),
      );
    }
  }

  // Convert base type key to GraphQL fragment format
  // eg: "_image" -> "_Image"
  const parsedFragmentName = toBaseTypeFragmentKey(fragmentName);

  // Add DAM asset fragments if contentReference with DAM was used
  if (includesDamAssetsFragments) {
    extraFragments.unshift(...DAM_ASSET_FRAGMENTS);
  }

  // Compose unique fragment
  const uniqueFields = [...new Set(fields)].join(' ');
  return [
    ...new Set(extraFragments), // unique dependency fragments
    `fragment ${fragmentName} on ${parsedFragmentName} { ${uniqueFields} }`,
  ];
}

/**
 * Generates a complete GraphQL query for fetching one item.
 *
 * @param contentType - The key of the content type to query.
 * @returns A string representing the GraphQL query.
 */
export function createSingleContentQuery(
  contentType: string,
  damEnabled: boolean = false,
  maxFragmentThreshold: number = 100,
) {
  const fragment = createFragment(contentType, new Set(), '', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: true,
  });
  const fragmentName = fragment.length > 0 ? '...' + contentType : '';

  return `
${fragment.join('\n')}
query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    item {
      __typename
      ${fragmentName}
      _metadata {
        variation
      }
    }
  }
}
  `;
}

/**
 * Generates a complete GraphQL query for fetching multiple items.
 * All items must have the same content type
 *
 * @param contentType - The key of the content type to query.
 * @param damEnabled - Whether DAM assets are enabled.
 * @param maxFragmentThreshold - Maximum fragment threshold for warnings (default: 100).
 * @returns A string representing the GraphQL query.
 */
export function createMultipleContentQuery(
  contentType: string,
  damEnabled: boolean = false,
  maxFragmentThreshold: number = 100,
) {
  const fragment = createFragment(contentType, new Set(), '', {
    damEnabled,
    maxFragmentThreshold,
    includeBaseFragments: true,
  });
  const fragmentName = fragment.length > 0 ? '...' + contentType : '';

  return `
${fragment.join('\n')}
query ListContent($where: _ContentWhereInput, $variation: VariationInput) {
  _Content(where: $where, variation: $variation) {
    items {

      ${fragmentName}
      _metadata {
        variation
      }
    }
  }
}
  `;
}

export type ItemsResponse<T> = {
  _Content: {
    items: ({
      __typename: string;
      _metadata: {
        variation: string;
      };
    } & T)[];
  };
};

/**
 * Resolves the set of allowed content types for a property, excluding restricted and recursive entries.
 * @param allowed - Explicit allow list of types.
 * @param restricted - Explicit deny list of types.
 * @returns An array of allowed content types for fragment generation.
 */
function resolveAllowedTypes(
  allowed: PermittedTypes[] | undefined,
  restricted: PermittedTypes[] | undefined,
): (PermittedTypes | AnyContentType)[] {
  const skip = new Set<string>();
  const seen = new Set<string>();
  const result: (PermittedTypes | AnyContentType)[] = [];
  const baseline = allowed?.length ? allowed : getCachedContentTypes();

  // If a CMS base media type ("_image", "_media" …) is restricted,
  // we must also ban every user defined media type that shares the same media type
  restricted?.forEach((r) => {
    const key = getKeyName(r);
    skip.add(key);
    if (isBaseType(key)) {
      getContentTypeByBaseType(key).forEach((ct) => skip.add(ct.key));
    }
  });

  const add = (ct: PermittedTypes | AnyContentType) => {
    const key = getKeyName(ct);
    // Skip content types where all properties are disabled
    const ctObj =
      typeof ct === 'object' && 'key' in ct ? ct : getContentType(key);
    if (ctObj && allPropertiesAreDisabled(ctObj)) return;
    // Skip if in skip list, already seen, or is a main base type
    if (skip.has(key) || seen.has(key) || MAIN_BASE_TYPES.includes(key as any))
      return;
    seen.add(key);
    result.push(ct);
  };

  for (const entry of baseline) {
    const key = getKeyName(entry);

    // If this entry is a base media type inject all matching custom media‑types *before* it.
    if (allowed?.length && isBaseType(key)) {
      getContentTypeByBaseType(key).forEach(add);
    }

    add(entry); // add the entry itself
  }

  return result;
}
