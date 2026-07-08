import { faker } from '@faker-js/faker';
import type { AnyContentType, ContentType, Contract } from '@optimizely/cms-sdk';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function makeUrl(value: string) {
  return {
    type: null,
    default: value,
    hierarchical: null,
    internal: null,
    graph: null,
    base: null,
  };
}

function generatePropertyValue(prop: { type: string; enum?: { value: string | number; displayName: string }[]; allowedTypes?: string[] }): unknown {
  switch (prop.type) {
    case 'string':
      if (prop.enum?.length) {
        const nonDefault = prop.enum.find(e => e.value !== 'default');
        return nonDefault?.value ?? prop.enum[0].value;
      }
      return faker.lorem.words(3);

    case 'boolean':
      return true;

    case 'url':
      return makeUrl(faker.internet.url());

    case 'richText': {
      const text = faker.lorem.paragraph();
      return {
        html: `<p>${text}</p>`,
        json: {
          type: 'richText',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text }],
            },
          ],
        },
      };
    }

    case 'contentReference': {
      const isImage = prop.allowedTypes?.includes('_image');
      const url = isImage
        ? 'https://picsum.photos/800/600'
        : faker.internet.url();
      return {
        url: makeUrl(url),
        item: null,
        key: faker.string.uuid(),
      };
    }

    case 'integer':
      return faker.number.int({ min: 1, max: 100 });

    case 'float':
      return faker.number.float({ min: 0, max: 100, fractionDigits: 2 });

    case 'dateTime':
      return '2026-01-15T12:00:00.000Z';

    case 'link':
      return {
        text: faker.lorem.words(2),
        title: faker.lorem.words(3),
        target: '_blank',
        url: makeUrl(faker.internet.url()),
      };

    case 'json':
      return {};

    case 'array':
      return [];

    default:
      return null;
  }
}

export function generateMockContent(
  contentTypeDef: AnyContentType | ContentType | Contract,
  displayTemplateKey?: string,
) {
  faker.seed(hashString(contentTypeDef.key));

  const properties: Record<string, unknown> = {};
  const props = 'properties' in contentTypeDef ? contentTypeDef.properties : undefined;
  if (props) {
    for (const [key, prop] of Object.entries(props)) {
      properties[key] = generatePropertyValue(prop as any);
    }
  }

  return {
    _id: faker.string.uuid(),
    _metadata: {
      key: faker.string.uuid(),
      locale: 'en',
      fallbackForLocale: 'en',
      version: '1',
      displayName: contentTypeDef.displayName ?? contentTypeDef.key,
      url: makeUrl('/component-preview'),
      types: [contentTypeDef.key],
      published: '2026-01-15T12:00:00.000Z',
      status: 'published',
      created: '2026-01-15T12:00:00.000Z',
      lastModified: '2026-01-15T12:00:00.000Z',
      sortOrder: 0,
      variation: 'default',
      displayOption: displayTemplateKey ?? null,
    },
    __typename: contentTypeDef.key,
    displayTemplateKey: displayTemplateKey ?? null,
    ...properties,
  };
}
