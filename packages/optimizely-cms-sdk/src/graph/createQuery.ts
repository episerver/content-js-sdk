import { AnyProperty } from '../model/properties.js';
import {
  AnyContentType,
  MAIN_BASE_TYPES,
  MediaStringTypes,
  PermittedTypes,
} from '../model/contentTypes.js';
import {
  getContentType,
  getAllContentTypes,
  getContentTypeByBaseType,
  getAllMediaTypeKeys,
} from '../model/contentTypeRegistry.js';
import {
  getKeyName,
  isBaseMediaType,
  buildBaseTypeFragments,
  MEDIA_METADATA_FRAGMENT,
  COMMON_MEDIA_METADATA_BLOCK,
  isBaseType,
} from '../util/baseTypeUtil.js';
import { checkTypeConstraintIssues } from '../util/fragmentConstraintChecks.js';

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

/**
 * Converts a property definition into GraphQL fields and fragments.
 * Logs warnings for potential performance or recursion issues based on configuration.
 * @param name - The field name in the selection set.
 * @param property - The property definition from the schema.
 * @param rootName - The root content type name used for tracing and warning messages.
 * @param visited - A set of already visited fragments to prevent infinite recursion.
 * @returns An object containing GraphQL field strings and extra dependent fragments.
 */
function convertProperty(
  name: string,
  property: AnyProperty,
  rootName: string,
  visited: Set<string>
): { fields: string[]; extraFragments: string[] } {
  const result = convertPropertyField(name, property, rootName, visited);

  // logs warnings if the fragment generation causes potential issues
  const warningMessage = checkTypeConstraintIssues(rootName, property, result);

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
 * @param visited - A set of already visited fragments to prevent infinite recursion.
 * @returns An object containing GraphQL field strings and extra dependent fragments.
 */
function convertPropertyField(
  name: string,
  property: AnyProperty,
  rootName: string,
  visited: Set<string>
): { fields: string[]; extraFragments: string[] } {
  const fields: string[] = [];
  const subfields: string[] = [];
  const extraFragments: string[] = [];

  if (property.type === 'component') {
    const key = property.contentType.key;
    const fragmentName = `${key}Property`;
    extraFragments.push(...createFragment(key, visited, 'Property'));
    fields.push(`${name} { ...${fragmentName} }`);
  } else if (property.type === 'content') {
    const allowed = resolveAllowedTypes(
      property.allowedTypes,
      property.restrictedTypes
    );

    for (const t of allowed) {
      const key = getKeyName(t);
      extraFragments.push(...createFragment(key, visited));
      subfields.push(`...${key}`);

      // if the key name is one of the user defined media type we append the base type fragment
      // eg: userDefinedImage (baseType:"image") -> _image
      if (getAllMediaTypeKeys().includes(key)) {
        const cc = getContentType(key);
        if (cc) {
          subfields.push(`...${cc.baseType.trim()}`);
        }
      }
    }

    const uniqueSubfields = [...new Set(subfields)].join(' '); // remove duplicates
    fields.push(`${name} { __typename ${uniqueSubfields} }`);
  } else if (property.type === 'richText') {
    fields.push(`${name} { html, json }`);
  } else if (property.type === 'url') {
    fields.push(`${name} { type, default }`);
  } else if (property.type === 'link') {
    fields.push(`${name} { url { type, default }}`);
  } else if (property.type === 'contentReference') {
    fields.push(`${name} { url { type default }}`);
  } else if (property.type === 'array') {
    const f = convertProperty(name, property.items, rootName, visited);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
  } else {
    fields.push(name);
  }

  return {
    fields,
    extraFragments: [...new Set(extraFragments)],
  };
}

/**
 * Builds experience GraphQL fragments and their dependencies.
 * @param visited - Set of fragment names already visited to avoid cycles.
 * @returns A list of GraphQL fragment strings.
 */
function createExperienceFragments(visited: Set<string>): string[] {
  // Fixed fragments for all experiences
  const fixedFragments = [
    'fragment _IExperience on _IExperience { composition {...ICompositionNode }}',
    'fragment ICompositionNode on ICompositionNode { __typename key type nodeType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }',
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
    .flatMap((n) => createFragment(n, visited));

  const nodeNames = experienceNodes.map((n) => `...${n}`).join(' ');
  const componentFragment = `fragment _IComponent on _IComponent { __typename ${nodeNames} }`;

  return [...fixedFragments, ...extraFragments, componentFragment];
}

/**
 * Builds a GraphQL fragment for the requested content-type **and** returns every nested fragment it depends on.
 * @param contentTypeName Name/key of the content-type to expand.
 * @param visited Set of fragment names already on the stack.
 * @returns Array of fragment strings.
 */
export function createFragment(
  contentTypeName: string,
  visited: Set<string> = new Set(), // shared across recursion
  suffix: string = ''
): string[] {
  const fragmentName = `${contentTypeName}${suffix}`;
  if (visited.has(fragmentName)) return []; // cyclic ref guard
  // Refresh registry cache only on the *root* call (avoids redundant reads)
  if (visited.size === 0) refreshCache();
  visited.add(fragmentName);

  const fields: string[] = [];
  const extraFragments: string[] = [];

  // Built‑in CMS baseTypes  ("_image", "_video", "_media" etc.)
  if (isBaseType(contentTypeName)) {
    const { fields: f, extraFragments: e } = buildBaseTypeFragments(
      contentTypeName as MediaStringTypes
    );
    fields.push(...f);
    extraFragments.push(...e);

    // Handle User defined contentType
  } else {
    const ct = getContentType(contentTypeName);
    if (!ct) throw new Error(`Unknown content type: ${contentTypeName}`);

    // Gather fields for every property
    for (const [propKey, prop] of Object.entries(ct.properties ?? {})) {
      const { fields: f, extraFragments: e } = convertProperty(
        propKey,
        prop,
        contentTypeName,
        visited
      );
      fields.push(...f);
      extraFragments.push(...e);
    }

    // Custom contentTypes which implements baseTypes (media/image/video): we append fragments for metadata
    if (isBaseMediaType(ct.baseType)) {
      extraFragments.unshift(MEDIA_METADATA_FRAGMENT); // maintain order
      fields.push(COMMON_MEDIA_METADATA_BLOCK);
    }

    if (ct.baseType === '_experience') {
      fields.push('..._IExperience');
      extraFragments.push(...createExperienceFragments(visited));
    }
  }

  // Compose unique fragment
  const uniqueFields = [...new Set(fields)].join(' ');
  return [
    ...new Set(extraFragments), // unique dependency fragments
    `fragment ${fragmentName} on ${fragmentName} { ${uniqueFields} }`,
  ];
}

/**
 * Generates a complete GraphQL query for fetching a content type and its fragment.
 * @param contentType - The key of the content type to query.
 * @returns A string representing the GraphQL query.
 */
export function createQuery(contentType: string) {
  const fragment = createFragment(contentType);

  return `
${fragment.join('\n')}
query FetchContent($filter: _ContentWhereInput) {
  _Content(where: $filter) {
    item {
      __typename
      ...${contentType}
    }
  }
}
  `;
}

/**
 * Resolves the set of allowed content types for a property, excluding restricted and recursive entries.
 * @param allowed - Explicit allow list of types.
 * @param restricted - Explicit deny list of types.
 * @returns An array of allowed content types for fragment generation.
 */
function resolveAllowedTypes(
  allowed: PermittedTypes[] | undefined,
  restricted: PermittedTypes[] | undefined
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
