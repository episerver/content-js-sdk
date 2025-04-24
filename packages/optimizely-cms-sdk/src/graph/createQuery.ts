import type { AnyProperty } from '../model/properties.js';
import type { ContentOrMediaType } from '../model/contentTypes.js';
import { isContentType } from '../model/index.js';
import { getContentType } from '../model/contentTypeRegistry.js';

/**
 * Get the key or name of ContentType or Media type
 * @param t ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
function getKeyName(t: ContentOrMediaType) {
  return isContentType(t) ? t.key : t;
}

/**
 * Converts a property into a GraphQL field
 * @param name Name of the property
 * @param property Property options
 */
function convertProperty(name: string, property: AnyProperty) {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  if (property.type === 'content') {
    for (const t of property.allowedTypes ?? []) {
      extraFragments.push(createFragment(getKeyName(t)));
    }

    const subfields = (property.allowedTypes ?? [])
      .map((t) => `...${getKeyName(t)}`)
      .join(' ');

    fields.push(`${name} { __typename ${subfields} }`);
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
    const f = convertProperty(name, property.items);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
  } else {
    fields.push(name);
  }

  return {
    fields,
    extraFragments,
  };
}

/** Get the fragment for a content type */
export function createFragment(contentTypeName: string): string {
  const fragmentName = contentTypeName;
  const allFields: string[] = [];
  const allExtraFragments: string[] = [];
  const contentType = getContentType(contentTypeName);

  if (!contentType) {
    throw new Error(`Content type ${contentTypeName} is not defined`);
  }

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    const { fields, extraFragments } = convertProperty(key, property);

    allFields.push(...fields);
    allExtraFragments.push(...extraFragments);
  }

  return `${allExtraFragments}
fragment ${fragmentName} on ${fragmentName} { ${allFields.join(' ')} }`;
}

/**
 * Creates a GraphQL query for a particular content type
 * @param contentType The content type
 */
export function createQuery(contentType: string) {
  const fragment = createFragment(contentType);

  return `${fragment}
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
