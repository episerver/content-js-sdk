import { AnyProperty } from '../model/contentTypeProperties';
import { AnyContentType } from '../model/contentTypes';

/**
 * Converts a property into a GraphQL field
 * @param name Name of the property
 * @param property Property options
 */
function convertProperty(name: string, property: AnyProperty) {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  if (property.type === 'content') {
    extraFragments.push(...property.views.map(createFragment));
    const subfields = property.views.map((view) => `...${view.key}`).join(' ');

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
export function createFragment(contentType: AnyContentType): string {
  const fragmentName = contentType.key;
  const allFields: string[] = [];
  const allExtraFragments: string[] = [];

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    const { fields, extraFragments } = convertProperty(key, property);

    allFields.push(...fields);
    allExtraFragments.push(...extraFragments);
  }

  return `${allExtraFragments}
fragment ${fragmentName} on ${fragmentName} { ${allFields.join(' ')} }`;
}
