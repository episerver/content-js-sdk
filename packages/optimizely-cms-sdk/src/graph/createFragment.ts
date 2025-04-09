import { AnyProperty } from '../model/contentTypeProperties';
import { AnyContentType } from '../model/contentTypes';

/** Converts a property into a GraphQL field */
function expandProperty(name: string, options: AnyProperty) {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  if (options.type === 'content') {
    extraFragments.push(...options.views.map(createFragment));
    const subfields = options.views.map((view) => `...${view.key}`).join(' ');

    fields.push(`${name} { __typename ${subfields} }`);
  } else if (options.type === 'richText') {
    fields.push(`${name} { html, json }`);
  } else if (options.type === 'url') {
    fields.push(`${name} { type, default }`);
  } else if (options.type === 'link') {
    fields.push(`${name} { url { type, default }}`);
  } else if (options.type === 'contentReference') {
    // do nothing for now
  } else if (options.type === 'array') {
    // Call recursively
    const f = expandProperty(name, options.items);
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

function getFields(contentType: AnyContentType): {
  fields: string[];
  extraFragments: string[];
} {
  const fields: string[] = [];
  const extraFragments: string[] = [];

  for (const [key, property] of Object.entries(contentType.properties ?? {})) {
    const f = expandProperty(key, property);
    fields.push(...f.fields);
    extraFragments.push(...f.extraFragments);
  }

  return { fields, extraFragments };
}

/** Get the fragment for a content type */
export function createFragment(contentType: AnyContentType): string {
  const fragmentName = contentType.key;
  const { fields, extraFragments } = getFields(contentType);

  return `${extraFragments}
  fragment ${fragmentName} on ${fragmentName} { ${fields.join(' ')} }`;
}
