import { AnyProperty } from '../model/properties';
import { AnyContentType, ContentOrMediaType } from '../model/contentTypes';
import { isContentType } from '../model';
import {
  getAllContentTypes,
  getContentType,
} from '../model/contentTypeRegistry';

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
 * Get the key or name of ContentType or Media type
 * @param t ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
function getKeyName(t: ContentOrMediaType) {
  return isContentType(t) ? t.key : t;
}

/**
 * Check if the keyName is a special type
 * @param key keyName of the content type
 * @returns boolean
 */
function isBaseType(key: string): boolean {
  return /^_/.test(key);
}

/**
 * Check if the keyName is a Media type
 * @param key keyName of the content type
 * @returns boolean
 */
function isMediaType(key: string): boolean {
  return ['_Image', '_Media', '_Video'].includes(key);
}

/**
 * Generates and adds framents for base types
 * @param contentTypeName name of the base content type
 * @param allFields all fields inside the given content type
 * @param allExtraFragments all additional fragments needed for given content type
 * @returns
 */
function generateBaseTypeFragments(
  contentTypeName: string,
  allFields: string[],
  allExtraFragments: string[]
) {
  // Note: more base typea to be added later
  if (isMediaType(contentTypeName)) {
    allExtraFragments.push(
      `fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }`
    );
    allFields.push(`_metadata { ...mediaMetaData }`);
  }
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

  if (property.type === 'content') {
    const allowed = refinedAllowedTypes(
      property.allowedTypes,
      property.restrictedTypes,
      rootName
    );

    for (const t of allowed) {
      const key = getKeyName(t);
      extraFragments.push(...createFragment(key, visited));
      subfields.push(`...${key}`);
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
    // do nothing for now
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
  visited: Set<string> = new Set() // shared across recursion
): string[] {
  // a recursion guard that prevents infinite loops
  if (visited.has(contentTypeName)) return [];
  visited.add(contentTypeName);

  const allFields: string[] = [];
  const allExtraFragments: string[] = [];

  if (isBaseType(contentTypeName)) {
    // generates and adds fragments for base types
    generateBaseTypeFragments(contentTypeName, allFields, allExtraFragments);
  } else {
    // generates and adds fragments for user defined contentTypes
    const contentType = getContentType(contentTypeName);
    if (!contentType) {
      throw new Error(`Content type ${contentTypeName} is not defined`);
    }

    for (const [key, prop] of Object.entries(contentType.properties ?? {})) {
      const { fields, extraFragments } = convertProperty(
        key,
        prop,
        contentTypeName,
        visited
      );
      allFields.push(...fields);
      allExtraFragments.push(...extraFragments);
    }
  }

  return [
    ...new Set(allExtraFragments), // unique dependency fragments
    `fragment ${contentTypeName} on ${contentTypeName} { ${allFields.join(
      ' '
    )} }`,
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
function refinedAllowedTypes(
  allowedTypes: ContentOrMediaType[] | undefined,
  restrictedTypes: ContentOrMediaType[] | undefined,
  rootName: string
): ContentOrMediaType[] {
  // “skip” lives only for this property
  const skip = new Set<string>();

  // ecord this level’s restrictions
  for (const r of restrictedTypes ?? []) {
    skip.add(getKeyName(r));
  }

  // decide the baseline list baseline (allowedTypes  OR  every known contentType)
  const baseline: ContentOrMediaType[] =
    allowedTypes && allowedTypes.length > 0
      ? allowedTypes
      : (getCachedContentTypes() as ContentOrMediaType[]);

  // subtract everything in skip and the fragment that is beign built
  return baseline.filter(
    (t) => !skip.has(getKeyName(t)) && getKeyName(t) !== rootName
  );
}
