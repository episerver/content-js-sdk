import { AnyProperty } from '../model/properties';
import {
  AnyContentType,
  ContentType,
  MediaStringTypes,
} from '../model/contentTypes';
import { isContentType } from '../model';

export type Importer = (contentTypeName: string) => Promise<AnyContentType>;

/**
 * Get the key or name of ContentType or Media type
 * @param t ContentType or Media type property
 * @returns Name of the ContentType or Media type
 */
export function getKeyName(t: MediaStringTypes | ContentType<AnyContentType>) {
  return isContentType(t) ? t.key : t;
}

/**
 * Converts a property into a GraphQL field
 * @param name Name of the property
 * @param property Property options
 */
async function convertProperty(
  name: string,
  property: AnyProperty,
  customImport: Importer
) {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  if (property.type === 'content') {
    for (const t of property.allowedTypes ?? []) {
      extraFragments.push(await createFragment(getKeyName(t), customImport));
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
    const f = await convertProperty(name, property.items, customImport);
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
export async function createFragment(
  contentTypeName: string,
  customImport: Importer
): Promise<string> {
  const fragmentName = contentTypeName;
  const allFields: string[] = [];
  const allExtraFragments: string[] = [];
  const contentType = await customImport(contentTypeName);

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    const { fields, extraFragments } = await convertProperty(
      key,
      property,
      customImport
    );

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
export async function createQuery(contentType: string, customImport: Importer) {
  const fragment = await createFragment(contentType, customImport);

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
