import { describe, expect, test } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

describe('createFragment()', () => {
  test('works when it has a content that refers to empty base types', async () => {
    const ct1 = contentType({
      key: 'ct1',
      baseType: '_page',
      properties: {
        p1: { type: 'content', allowedTypes: ['_component'] },
      },
    });
    initContentTypeRegistry([ct1]);
    const result = await createFragment('ct1');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ct1 on ct1 { __typename p1 { __typename } }",
      ]
    `);
  });
});
