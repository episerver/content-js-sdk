import { describe, expect, test } from 'vitest';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createSingleContentQuery } from '../createQuery.js';

const page = (properties: Record<string, any>) =>
  contentType({
    key: 'ctPage',
    displayName: 'CT Page',
    baseType: '_page',
    properties,
  });

const ctImage = contentType({
  key: 'ctImage',
  displayName: 'CT Image',
  baseType: '_image',
  properties: { alt: { type: 'string' } },
});

describe('query cache', () => {
  test('rebuilds the query after the registry changes', () => {
    initContentTypeRegistry([page({ title: { type: 'string' } })]);
    const before = createSingleContentQuery('ctPage');
    expect(before).not.toContain('ctImage');

    // Same content type and options, different registry.
    initContentTypeRegistry([
      ctImage,
      page({ hero: { type: 'contentReference', allowedTypes: [ctImage] } }),
    ]);

    expect(createSingleContentQuery('ctPage')).toContain(
      'item { __typename ...ctImage }',
    );
  });
});
