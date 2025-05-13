import { AnyProperty } from '../model/properties';
import {
  AnyContentType,
  MediaStringTypes,
  ContentOrMediaType,
} from '../model/contentTypes';
import {
  getContentType,
  getAllContentTypes,
  getContentTypeByBaseType,
  getAllMediaTypeKeys,
} from '../model/contentTypeRegistry';
import {
  getKeyName,
  isBaseMediaType,
  isCustomMediaType,
  buildBaseTypeFragments,
  MEDIA_METADATA_FRAGMENT,
  COMMON_MEDIA_METADATA_BLOCK,
  isBaseType,
  getBaseKey,
} from '../util/baseTypeUtil';

let allContentTypes: AnyContentType[] = [];

/**
 * This is a simple memoisation that avoids repeatedly calling the registry
 * @returns An array of all contentType definitions.
 */
function getCachedContentTypes(): AnyContentType[] {
  if (allContentTypes.length === 0) {
    allContentTypes = getAllContentTypes();
  }
  return allContentTypes;
}

/**
 *  Force a fresh read called once per *top‑level* createFragment() call.
 * @returns An array of all contentType definitions.
 */
function refreshCache() {
  allContentTypes = getAllContentTypes();
}

/**
 * Converts a property into a GraphQL field
 * @param name Field name in the parent selection set.
 * @param property Property definition object from the schema.
 * @param rootName Name of the fragment we are **currently** building.
 * @param visited Shared recursion-guard set from the caller.
 * @returns object including the refined fileds and extraFragments `{ fields, extraFragments }`.
 */
function convertProperty(
  name: string,
  property: AnyProperty,
  rootName: string,
  visited: Set<string> // one shared guard per tree
): { fields: string[]; extraFragments: string[] } {
  const fields: string[] = [];
  const subfields: string[] = [];
  const extraFragments: string[] = [];

  if (property.type === 'component') {
    extraFragments.push(
      ...createFragment(property.contentType.key, visited, 'Property')
    );
    fields.push(`${name} { ...${property.contentType.key}Property }`);
  } else if (property.type === 'content') {
    const allowed = resolveAllowedTypes(
      property.allowedTypes,
      property.restrictedTypes,
      rootName
    );

    for (const t of allowed) {
      const key = getKeyName(t);
      extraFragments.push(...createFragment(key, visited));
      subfields.push(`...${key}`);

      // if the key name is one of the user defined media type we append the base type fragment
      // eg: userDefinedImage (baseType:"image") -> _Image
      if (getAllMediaTypeKeys().includes(key)) {
        const cc = getContentType(key);
        if (cc) {
          const baseKey = getBaseKey(cc.baseType);
          subfields.push(`...${baseKey.trim()}`);
        }
      }
    }

    const uniqueSubfields = [...new Set(subfields)] // remove duplicates
      .join(' ');

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
    // Call recursively
    const f = convertProperty(name, property.items, rootName, visited);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
  } else {
    fields.push(name);
  }

  return {
    fields,
    extraFragments: [...new Set(extraFragments)], // remove duplicates
  };
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
  // Refresh registry cache only on the *root* call (avoids redundant reads)
  if (visited.size === 0) refreshCache();
  if (visited.has(contentTypeName)) return []; // cyclic ref guard
  visited.add(contentTypeName);

  const fields: string[] = [];
  const extraFragments: string[] = [];

  // Built‑in CMS baseTypes  ("_Image", "_Video", "_Media" etc.)
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
    if (isCustomMediaType(ct)) {
      extraFragments.unshift(MEDIA_METADATA_FRAGMENT); // maintain order
      fields.push(COMMON_MEDIA_METADATA_BLOCK);
    }
  }

  // Compose unique fragment
  const uniqueFields = [...new Set(fields)].join(' ');
  return [
    ...new Set(extraFragments), // unique dependency fragments
    `fragment ${contentTypeName}${suffix} on ${contentTypeName}${suffix} { ${uniqueFields} }`,
  ];
}

/**
 * Creates a GraphQL query for a particular content type
 * @param contentType The content type
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
 * Returns the set of content types that are **allowed** at the current property level.
 * @param allowedTypes Explicit allow-list for the property, or `undefined`.
 * @param restrictedTypes Explicit restricted-list for the property, or `undefined`.
 * @param rootName Name of the fragment we are **currently** building.
 * @returns baseline array (all allowedTypes – restrictedTypes) in declaration order.
 */
function resolveAllowedTypes(
  allowed: ContentOrMediaType[] | undefined,
  restricted: ContentOrMediaType[] | undefined,
  rootKey: string
): (ContentOrMediaType | AnyContentType)[] {
  const skip = new Set<string>();
  const seen = new Set<string>();
  const result: (ContentOrMediaType | AnyContentType)[] = [];
  const baseline = allowed?.length ? allowed : getCachedContentTypes();

  // If a CMS base media type ("_Image", "_Media" …) is restricted,
  // we must also ban every user defined media type that shares the same media type
  restricted?.forEach((r) => {
    const key = getKeyName(r);
    skip.add(key);
    if (isBaseMediaType(key as MediaStringTypes)) {
      getContentTypeByBaseType(key as MediaStringTypes).forEach((ct) =>
        skip.add(ct.key)
      );
    }
  });

  const add = (ct: ContentOrMediaType | AnyContentType) => {
    const key = getKeyName(ct);
    if (key === rootKey || skip.has(key) || seen.has(key)) return;
    seen.add(key);
    result.push(ct);
  };

  for (const entry of baseline) {
    const key = getKeyName(entry);

    // If this entry is a base media type inject all matching custom media‑types *before* it.
    if (allowed?.length && isBaseMediaType(key as MediaStringTypes)) {
      getContentTypeByBaseType(key as MediaStringTypes)
        .filter(isCustomMediaType)
        .forEach(add);
    }

    add(entry); // finally, the entry itself (token or regular type)
  }

  return result;
}
